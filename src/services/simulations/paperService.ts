import { prisma } from "@/db/prisma";
import { Difficulty, ExamType, QuestionType, type Prisma } from "@prisma/client";
import { EXAM_PATTERNS } from "@/data/simulations/patterns";
import { CURATED_SIMULATIONS } from "@/data/simulations/mocks";
import { getExamSyllabus } from "@/data/exams/syllabi";
import { examEntry } from "@/data/exams/catalog";
import { generateExamQuestions } from "@/services/ai/examQuestions";
import { isAiConfigured } from "@/lib/env";
import type {
  ExamSectionConfig,
  ExamSectionPart,
  SimulationMock,
  SimulationQuestion,
} from "@/data/simulations/types";
import { InvalidStateError } from "@/lib/errors";

/**
 * Assembling a full-length paper.
 *
 * "Make the practice tests match the real test" comes down to one rule: the
 * paper the student sits must have the same number of questions, in the same
 * sections, of the same types, under the same marking scheme as the published
 * pattern. Everything here works backwards from `EXAM_PATTERNS`.
 *
 * Questions are drawn in order of how trustworthy they are:
 *
 *   1. curated items already written for that exam and subject,
 *   2. the shared question bank for that exam,
 *   3. the model, prompted per section and part,
 *
 * and any shortfall is filled deterministically, because a paper that is
 * eleven questions short is not a simulation of anything.
 */

/** Papers are large; without a ceiling one request could fan out very wide. */
const MAX_QUESTIONS = 400;

interface SourcedQuestion {
  subject: string;
  content: string;
  options?: { label: string; text: string }[];
  correctAnswer: string;
  solution: string;
  hint?: string;
  chapter: string;
  topic?: string;
  difficulty: Difficulty;
  year?: number;
  curated: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Source pools                                                               */
/* -------------------------------------------------------------------------- */

const norm = (value: string) => value.trim().toLowerCase();

/** Curated simulation questions for this exam, indexed by subject and type. */
function curatedPool(examType: ExamType): SourcedQuestion[] {
  return CURATED_SIMULATIONS.filter((sim) => sim.examType === examType).flatMap((sim) =>
    sim.questions.map((q) => ({
      subject: q.subject,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      solution: q.solution,
      hint: q.hint,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty,
      year: q.year,
      curated: true,
    }))
  );
}

/**
 * Bank questions for this exam. These are the previous-year and
 * previous-year-styled items a student recognises, so they outrank anything
 * the model writes.
 */
async function bankPool(examType: ExamType): Promise<Map<string, SourcedQuestion[]>> {
  const rows = await prisma.bankQuestion.findMany({
    where: { examType },
    orderBy: { orderIndex: "asc" },
  });

  const bySubject = new Map<string, SourcedQuestion[]>();
  for (const row of rows) {
    if (!row.correctAnswer) continue;
    const list = bySubject.get(norm(row.subject)) ?? [];
    list.push({
      subject: row.subject,
      content: row.content,
      options: (row.options as { label: string; text: string }[] | null) ?? undefined,
      correctAnswer: row.correctAnswer,
      solution: row.solution ?? "",
      hint: row.hint ?? undefined,
      chapter: row.chapter,
      topic: row.topic ?? undefined,
      difficulty: row.difficulty,
      year: row.year ?? undefined,
      curated: true,
    });
    bySubject.set(norm(row.subject), list);
  }
  return bySubject;
}

/** Chapters to spread a section across, taken from the exam's own syllabus. */
function chaptersFor(examType: ExamType, subject: string): string[] {
  const syllabus = getExamSyllabus(examType);
  const match = syllabus?.subjects.find(
    (s) => norm(s.title) === norm(subject) || norm(subject).includes(norm(s.title))
  );
  const chapters = (match?.chapters ?? []).flatMap((chapter) =>
    chapter.topics.length ? chapter.topics : [chapter.title]
  );
  return chapters.length ? chapters.slice(0, 24) : [subject];
}

/**
 * Whether a sourced question can stand in for a slot of this type.
 *
 * A bank MCQ cannot fill a numerical slot — the whole point of the numerical
 * part is that there are no options to eliminate — so type compatibility is
 * strict rather than best-effort.
 */
function fits(question: SourcedQuestion, type: QuestionType): boolean {
  const hasOptions = Boolean(question.options?.length);
  switch (type) {
    case QuestionType.mcq:
      return hasOptions && !question.correctAnswer.includes(",");
    case QuestionType.msq:
      return hasOptions;
    case QuestionType.numeric:
      return !hasOptions && /^-?\d+(\.\d+)?$/.test(question.correctAnswer.trim());
    case QuestionType.short_answer:
    case QuestionType.long_answer:
      return !hasOptions;
    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Assembly                                                                   */
/* -------------------------------------------------------------------------- */

export interface BuildPaperInput {
  userId: string;
  examType: ExamType;
  /** Reserved for a future "practice only these subjects" flow. */
  title?: string;
}

export async function buildFullLengthPaper(
  input: BuildPaperInput
): Promise<SimulationMock> {
  const pattern = EXAM_PATTERNS[input.examType];
  if (!pattern) throw new InvalidStateError("That exam has no published pattern to build from.");

  const declared = pattern.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
  if (declared > MAX_QUESTIONS) {
    throw new InvalidStateError("That paper is too large to generate in one go.");
  }

  const [curated, bank] = await Promise.all([
    Promise.resolve(curatedPool(input.examType)),
    bankPool(input.examType),
  ]);

  // A question used in one slot must not reappear in another.
  const used = new Set<string>();
  const takeFrom = (pool: SourcedQuestion[], type: QuestionType, count: number) => {
    const taken: SourcedQuestion[] = [];
    for (const question of pool) {
      if (taken.length >= count) break;
      if (used.has(question.content)) continue;
      if (!fits(question, type)) continue;
      used.add(question.content);
      taken.push(question);
    }
    return taken;
  };

  const sectionResults = await Promise.all(
    pattern.sections.map((section) =>
      buildSection({
        examType: input.examType,
        section,
        curated: curated.filter((q) => norm(q.subject) === norm(section.subject)),
        bank: bank.get(norm(section.subject)) ?? [],
        takeFrom,
      })
    )
  );

  const questions = sectionResults.flat();
  const curatedCount = questions.filter((q) => !q.generated).length;

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const exam = examEntry(input.examType);
  const title =
    input.title ??
    `${exam?.label ?? pattern.title} — full-length mock (${questions.length} questions)`;

  const paper = await prisma.mockPaper.create({
    data: {
      userId: input.userId,
      examType: input.examType,
      title,
      durationMinutes: pattern.durationMinutes,
      totalMarks,
      questionCount: questions.length,
      sectionalTiming: Boolean(pattern.sectionalTiming),
      generatedBy: isAiConfigured() ? "ai" : "offline",
      curatedCount,
      data: {
        sections: pattern.sections,
        instructions: pattern.instructions,
        questions,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return toSimulationMock(paper.id, {
    examType: input.examType,
    title,
    durationMinutes: pattern.durationMinutes,
    totalMarks,
    sectionalTiming: Boolean(pattern.sectionalTiming),
    sections: pattern.sections,
    instructions: pattern.instructions,
    questions,
    generatedBy: paper.generatedBy,
    curatedCount,
  });
}

interface SectionBuildInput {
  examType: ExamType;
  section: ExamSectionConfig;
  curated: SourcedQuestion[];
  bank: SourcedQuestion[];
  takeFrom: (
    pool: SourcedQuestion[],
    type: QuestionType,
    count: number
  ) => SourcedQuestion[];
}

async function buildSection(input: SectionBuildInput): Promise<SimulationQuestion[]> {
  const { section, examType } = input;
  const parts: ExamSectionPart[] =
    section.parts ?? [
      {
        label: section.name,
        type: QuestionType.mcq,
        count: section.totalQuestions,
        marksPerCorrect: section.marksPerCorrect,
        negativeMarks: section.negativeMarks,
      },
    ];

  const chapters = chaptersFor(examType, section.subject);

  const built = await Promise.all(
    parts.map(async (part, partIndex) => {
      // Curated first, then the bank, then the model for whatever is left.
      const fromCurated = input.takeFrom(input.curated, part.type, part.count);
      const fromBank = input.takeFrom(input.bank, part.type, part.count - fromCurated.length);

      const shortfall = part.count - fromCurated.length - fromBank.length;
      const generated = shortfall > 0
        ? (
            await generateExamQuestions({
              examType,
              subject: section.subject,
              chapters,
              type: part.type,
              count: shortfall,
              marksPerCorrect: part.marksPerCorrect,
              negativeMarks: part.negativeMarks,
              partLabel: part.label,
            })
          ).map((q) => ({ ...q, curated: false }))
        : [];

      const pooled = [...fromCurated, ...fromBank, ...generated].slice(0, part.count);

      return pooled.map(
        (q, index): SimulationQuestion => ({
          id: `${section.id}-p${partIndex}-q${index + 1}`,
          sectionId: section.id,
          subject: section.subject,
          chapter: q.chapter,
          topic: q.topic,
          type: part.type,
          difficulty: q.difficulty,
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          hint: q.hint,
          marks: part.marksPerCorrect,
          negativeMarks: part.negativeMarks,
          year: q.year,
          partLabel: part.label,
          generated: !q.curated,
        })
      );
    })
  );

  return built.flat();
}

/* -------------------------------------------------------------------------- */
/*  Reading papers back                                                        */
/* -------------------------------------------------------------------------- */

interface StoredPaper {
  sections: ExamSectionConfig[];
  instructions: string[];
  questions: SimulationQuestion[];
}

function toSimulationMock(
  id: string,
  paper: {
    examType: ExamType;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    sectionalTiming: boolean;
    sections: ExamSectionConfig[];
    instructions: string[];
    questions: SimulationQuestion[];
    generatedBy: string;
    curatedCount: number;
  }
): SimulationMock {
  const sourced = paper.curatedCount;
  return {
    id,
    slug: id,
    title: paper.title,
    examType: paper.examType,
    description:
      paper.generatedBy === "offline"
        ? `Full-length paper built to the official pattern. Questions are placeholders — add a Groq API key in Settings to have them written.`
        : `Full-length paper built to the official pattern${
            sourced > 0 ? `, including ${sourced} curated question${sourced === 1 ? "" : "s"}` : ""
          }.`,
    durationMinutes: paper.durationMinutes,
    totalMarks: paper.totalMarks,
    sectionalTiming: paper.sectionalTiming,
    sections: paper.sections,
    instructions: paper.instructions,
    questions: paper.questions,
    origin: "generated",
    curatedCount: sourced,
  };
}

/** A generated paper the user owns, in the shape the CBT player expects. */
export async function getGeneratedPaper(
  paperId: string,
  userId: string
): Promise<SimulationMock | null> {
  const paper = await prisma.mockPaper.findFirst({ where: { id: paperId, userId } });
  if (!paper) return null;

  const stored = paper.data as unknown as StoredPaper;
  return toSimulationMock(paper.id, {
    examType: paper.examType,
    title: paper.title,
    durationMinutes: paper.durationMinutes,
    totalMarks: paper.totalMarks,
    sectionalTiming: paper.sectionalTiming,
    sections: stored.sections ?? [],
    instructions: stored.instructions ?? [],
    questions: stored.questions ?? [],
    generatedBy: paper.generatedBy,
    curatedCount: paper.curatedCount,
  });
}

/** The user's generated papers, newest first. */
export async function listGeneratedPapers(userId: string, examType?: ExamType) {
  const papers = await prisma.mockPaper.findMany({
    where: { userId, ...(examType ? { examType } : {}) },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return papers.map((paper) => {
    const stored = paper.data as unknown as StoredPaper;
    return toSimulationMock(paper.id, {
      examType: paper.examType,
      title: paper.title,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      sectionalTiming: paper.sectionalTiming,
      sections: stored.sections ?? [],
      instructions: stored.instructions ?? [],
      questions: stored.questions ?? [],
      generatedBy: paper.generatedBy,
      curatedCount: paper.curatedCount,
    });
  });
}
