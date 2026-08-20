import type { ExamType } from "@prisma/client";
import class9 from "@/templates/class9.json";
import jee from "@/templates/jee.json";
import { EXAM_CATALOG, examEntry } from "@/data/exams/catalog";
import { EXAM_SYLLABI, type ExamSyllabus } from "@/data/exams/syllabi";

export interface TopicTemplate {
  title: string;
  topics?: string[];
}

export interface ChapterTemplate {
  title: string;
  topics?: string[];
}

export interface SubjectTemplate {
  title: string;
  chapters?: ChapterTemplate[];
}

export interface SyllabusTemplate {
  examType: string;
  title: string;
  subjects: SubjectTemplate[];
}

/**
 * Syllabus templates, keyed by exam.
 *
 * The two hand-authored JSON files came first and stay authoritative for their
 * exams; everything else comes from `data/exams/syllabi.ts`. Merging here means
 * `createGoal` has one lookup and the goal picker one list, however a given
 * syllabus happens to be stored.
 */
const templates: Partial<Record<string, SyllabusTemplate>> = {
  ...(EXAM_SYLLABI as Partial<Record<string, ExamSyllabus>>),
  CLASS_9: class9 as SyllabusTemplate,
  JEE_MAIN: jee as SyllabusTemplate,
};

export interface TemplateSummary {
  key: string;
  title: string;
  examType: string;
  label: string;
  category: string;
  blurb: string;
  /** Leaf topics the syllabus will create, so the picker can be honest about it. */
  topicCount: number;
}

function countTopics(template: SyllabusTemplate | undefined): number {
  if (!template) return 0;
  return template.subjects.reduce(
    (sum, subject) =>
      sum +
      (subject.chapters ?? []).reduce(
        (chapterSum, chapter) => chapterSum + (chapter.topics?.length ?? 0),
        0
      ),
    0
  );
}

/**
 * Every exam in the catalog, in catalog order — not just the ones that happen
 * to have a JSON file. An exam with no syllabus still creates a usable goal;
 * you add your own topics to it.
 */
export function listTemplates(): TemplateSummary[] {
  return EXAM_CATALOG.map((entry) => {
    const template = templates[entry.examType];
    return {
      key: entry.examType,
      title: template?.title ?? entry.fullName,
      examType: entry.examType,
      label: entry.label,
      category: entry.category,
      blurb: entry.blurb,
      topicCount: countTopics(template),
    };
  });
}

export function getTemplate(examType: ExamType | string): SyllabusTemplate | undefined {
  return templates[examType as string];
}

export { examEntry };
