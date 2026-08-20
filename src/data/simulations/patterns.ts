import { ExamType, QuestionType } from "@prisma/client";
import type { ExamPatternConfig, ExamSectionConfig, ExamSectionPart } from "./types";

/**
 * The official shape of every exam StudyForge can simulate.
 *
 * A mock is only worth taking if it is the same size and the same clock as the
 * real paper, so these numbers are the contract the paper builder works to:
 * section counts, per-part question types, marking scheme and duration. Every
 * value here is the current published pattern for that exam — where a board
 * publishes a range (CLAT's 22–26 English questions) the mid-point is used.
 */

/** Sums the parts so a section's total can never drift from its composition. */
function section(
  config: Omit<ExamSectionConfig, "totalQuestions" | "marksPerCorrect" | "negativeMarks"> & {
    parts: ExamSectionPart[];
  }
): ExamSectionConfig {
  const totalQuestions = config.parts.reduce((sum, part) => sum + part.count, 0);
  const headline = config.parts[0];
  return {
    ...config,
    totalQuestions,
    marksPerCorrect: headline.marksPerCorrect,
    negativeMarks: headline.negativeMarks,
  };
}

/** A plain block of single-correct MCQs — the most common section shape. */
function mcqPart(
  count: number,
  marksPerCorrect: number,
  negativeMarks: number,
  label = "Multiple choice"
): ExamSectionPart {
  return { label, type: QuestionType.mcq, count, marksPerCorrect, negativeMarks };
}

export const EXAM_PATTERNS: Record<ExamType, ExamPatternConfig> = {
  [ExamType.JEE_MAIN]: {
    examType: ExamType.JEE_MAIN,
    title: "JEE Main (NTA CBT Pattern)",
    subtitle: "Joint Entrance Examination Main (Physics, Chemistry, Mathematics)",
    durationMinutes: 180,
    totalMarks: 300,
    totalQuestions: 75,
    instructions: [
      "The examination duration is 180 minutes (3 hours).",
      "The paper consists of 3 subjects: Physics, Chemistry, and Mathematics.",
      "Each subject has 25 questions: Section A (20 Multiple Choice Questions) and Section B (5 Numerical Value Questions).",
      "For Section A (MCQs): +4 marks for correct answer, -1 mark for incorrect answer, 0 for unattempted.",
      "For Section B (Numerical): +4 marks for correct numerical answer, -1 mark for incorrect answer (NTA 2024+ pattern), 0 for unattempted.",
      "You can switch between sections and questions at any time.",
      "The palette on the right shows the status of each question in official NTA color coding.",
      "Fullscreen mode and Proctoring are active. Switching apps or tabs will result in a warning.",
    ],
    sections: [
      section({
        id: "jee-physics",
        name: "Physics",
        subject: "Physics",
        description: "Section A: 20 MCQs · Section B: 5 numerical value questions.",
        parts: [
          mcqPart(20, 4, 1, "Section A — Multiple choice"),
          { label: "Section B — Numerical value", type: QuestionType.numeric, count: 5, marksPerCorrect: 4, negativeMarks: 1 },
        ],
      }),
      section({
        id: "jee-chemistry",
        name: "Chemistry",
        subject: "Chemistry",
        description: "Section A: 20 MCQs · Section B: 5 numerical value questions.",
        parts: [
          mcqPart(20, 4, 1, "Section A — Multiple choice"),
          { label: "Section B — Numerical value", type: QuestionType.numeric, count: 5, marksPerCorrect: 4, negativeMarks: 1 },
        ],
      }),
      section({
        id: "jee-maths",
        name: "Mathematics",
        subject: "Mathematics",
        description: "Section A: 20 MCQs · Section B: 5 numerical value questions.",
        parts: [
          mcqPart(20, 4, 1, "Section A — Multiple choice"),
          { label: "Section B — Numerical value", type: QuestionType.numeric, count: 5, marksPerCorrect: 4, negativeMarks: 1 },
        ],
      }),
    ],
  },

  [ExamType.JEE_ADVANCED]: {
    examType: ExamType.JEE_ADVANCED,
    title: "JEE Advanced (Paper 1 Pattern)",
    subtitle: "Indian Institute of Technology Joint Entrance Examination Advanced",
    durationMinutes: 180,
    totalMarks: 180,
    totalQuestions: 51,
    instructions: [
      "The examination duration is 180 minutes (3 hours).",
      "Consists of 3 subjects: Physics, Chemistry, and Mathematics — 17 questions and 60 marks each.",
      "Single correct MCQs: +3, -1. One or more correct (MSQ): +4 full, partial credit for a subset, -2 for any wrong option.",
      "Non-negative integer / numerical answers carry +4 with no negative marking.",
      "Matching-list questions are single correct and carry +3 / -1.",
      "Full proctoring enabled. Any tab switch will trigger anti-cheat warnings.",
    ],
    sections: [
      section({
        id: "jeeadv-physics",
        name: "Physics",
        subject: "Physics",
        description: "Single correct, multi-correct and integer-answer questions.",
        parts: [
          mcqPart(4, 3, 1, "Section 1 — Single correct"),
          { label: "Section 2 — One or more correct", type: QuestionType.msq, count: 3, marksPerCorrect: 4, negativeMarks: 2 },
          { label: "Section 3 — Numerical / integer", type: QuestionType.numeric, count: 6, marksPerCorrect: 4, negativeMarks: 0 },
          mcqPart(4, 3, 1, "Section 4 — Matching list"),
        ],
      }),
      section({
        id: "jeeadv-chemistry",
        name: "Chemistry",
        subject: "Chemistry",
        description: "Single correct, multi-correct and integer-answer questions.",
        parts: [
          mcqPart(4, 3, 1, "Section 1 — Single correct"),
          { label: "Section 2 — One or more correct", type: QuestionType.msq, count: 3, marksPerCorrect: 4, negativeMarks: 2 },
          { label: "Section 3 — Numerical / integer", type: QuestionType.numeric, count: 6, marksPerCorrect: 4, negativeMarks: 0 },
          mcqPart(4, 3, 1, "Section 4 — Matching list"),
        ],
      }),
      section({
        id: "jeeadv-maths",
        name: "Mathematics",
        subject: "Mathematics",
        description: "Single correct, multi-correct and integer-answer questions.",
        parts: [
          mcqPart(4, 3, 1, "Section 1 — Single correct"),
          { label: "Section 2 — One or more correct", type: QuestionType.msq, count: 3, marksPerCorrect: 4, negativeMarks: 2 },
          { label: "Section 3 — Numerical / integer", type: QuestionType.numeric, count: 6, marksPerCorrect: 4, negativeMarks: 0 },
          mcqPart(4, 3, 1, "Section 4 — Matching list"),
        ],
      }),
    ],
  },

  [ExamType.NEET]: {
    examType: ExamType.NEET,
    title: "NEET (UG) Medical Simulation",
    subtitle: "National Eligibility cum Entrance Test (Physics, Chemistry, Botany, Zoology)",
    durationMinutes: 180,
    totalMarks: 720,
    totalQuestions: 180,
    instructions: [
      "Total duration is 180 minutes (3 hours) for 180 questions.",
      "Consists of 4 sections: Physics (45 Q), Chemistry (45 Q), Botany (45 Q), and Zoology (45 Q).",
      "All questions are Multiple Choice Questions (MCQ) with 4 options.",
      "Marking scheme: +4 marks for each correct response, -1 mark for each incorrect response, 0 for unattempted.",
      "Rough work should be done on rough sheets.",
      "Switching tabs or minimizing the browser will be flagged by the anti-cheat guard.",
    ],
    sections: [
      section({
        id: "neet-physics",
        name: "Physics",
        subject: "Physics",
        description: "Kinematics, Thermodynamics, Optics, Current Electricity, Semiconductor.",
        parts: [mcqPart(45, 4, 1)],
      }),
      section({
        id: "neet-chemistry",
        name: "Chemistry",
        subject: "Chemistry",
        description: "Physical Chemistry, Inorganic Chemistry, Organic Reactions.",
        parts: [mcqPart(45, 4, 1)],
      }),
      section({
        id: "neet-botany",
        name: "Botany",
        subject: "Botany",
        description: "Plant Physiology, Genetics, Ecology, Cell Biology.",
        parts: [mcqPart(45, 4, 1)],
      }),
      section({
        id: "neet-zoology",
        name: "Zoology",
        subject: "Zoology",
        description: "Human Physiology, Reproduction, Evolution, Biotechnology.",
        parts: [mcqPart(45, 4, 1)],
      }),
    ],
  },

  [ExamType.BITSAT]: {
    examType: ExamType.BITSAT,
    title: "BITSAT (Computer Based Test)",
    subtitle: "Birla Institute of Technology & Science Admission Test",
    durationMinutes: 180,
    totalMarks: 390,
    totalQuestions: 130,
    instructions: [
      "Duration is 180 minutes for 130 questions.",
      "Physics 30, Chemistry 30, English Proficiency 10, Logical Reasoning 20, Mathematics 40.",
      "Marking scheme: +3 for correct, -1 for incorrect, 0 for unattempted.",
      "There is no sectional time limit — budget your own time across the five parts.",
    ],
    sections: [
      section({ id: "bitsat-physics", name: "Physics", subject: "Physics", parts: [mcqPart(30, 3, 1)] }),
      section({ id: "bitsat-chemistry", name: "Chemistry", subject: "Chemistry", parts: [mcqPart(30, 3, 1)] }),
      section({ id: "bitsat-english", name: "English Proficiency", subject: "English", parts: [mcqPart(10, 3, 1)] }),
      section({ id: "bitsat-reasoning", name: "Logical Reasoning", subject: "Logical Reasoning", parts: [mcqPart(20, 3, 1)] }),
      section({ id: "bitsat-maths", name: "Mathematics", subject: "Mathematics", parts: [mcqPart(40, 3, 1)] }),
    ],
  },

  [ExamType.CUET_UG]: {
    examType: ExamType.CUET_UG,
    title: "CUET (UG) Combined Paper",
    subtitle: "Common University Entrance Test — Language, Domain and General Test",
    durationMinutes: 180,
    totalMarks: 800,
    totalQuestions: 160,
    instructions: [
      "Three papers of 60 minutes each: Language, a Domain subject, and the General Test.",
      "Marking scheme: +5 for correct, -1 for incorrect, 0 for unattempted.",
      "Each paper runs on its own clock and cannot be revisited once submitted.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "cuet-language",
        name: "Language",
        subject: "Language",
        durationMinutes: 60,
        description: "Reading comprehension, verbal ability, vocabulary.",
        parts: [mcqPart(50, 5, 1)],
      }),
      section({
        id: "cuet-domain",
        name: "Domain Subject",
        subject: "Domain Subject",
        durationMinutes: 60,
        description: "Your chosen NCERT Class 12 domain subject.",
        parts: [mcqPart(50, 5, 1)],
      }),
      section({
        id: "cuet-general",
        name: "General Test",
        subject: "General Test",
        durationMinutes: 60,
        description: "General knowledge, current affairs, quantitative reasoning, logical reasoning.",
        parts: [mcqPart(60, 5, 1)],
      }),
    ],
  },

  [ExamType.GATE]: {
    examType: ExamType.GATE,
    title: "GATE (Graduate Aptitude Test in Engineering)",
    subtitle: "General Aptitude + Core Discipline",
    durationMinutes: 180,
    totalMarks: 100,
    totalQuestions: 65,
    instructions: [
      "Duration is 180 minutes for 65 questions carrying 100 marks.",
      "General Aptitude carries 15 marks; the core subject carries 85 marks.",
      "1-mark MCQs carry -1/3 negative marking, 2-mark MCQs carry -2/3.",
      "Multiple Select (MSQ) and Numerical Answer Type (NAT) questions carry no negative marking.",
      "A virtual calculator is permitted; rough work on the supplied sheets only.",
    ],
    sections: [
      section({
        id: "gate-aptitude",
        name: "General Aptitude",
        subject: "General Aptitude",
        description: "Verbal ability, numerical ability, analytical reasoning.",
        parts: [
          mcqPart(5, 1, 0.33, "1-mark multiple choice"),
          mcqPart(5, 2, 0.67, "2-mark multiple choice"),
        ],
      }),
      section({
        id: "gate-core",
        name: "Core Subject",
        subject: "Core Subject",
        description: "Your chosen engineering discipline.",
        parts: [
          mcqPart(20, 1, 0.33, "1-mark multiple choice"),
          { label: "1-mark numerical answer", type: QuestionType.numeric, count: 5, marksPerCorrect: 1, negativeMarks: 0 },
          mcqPart(20, 2, 0.67, "2-mark multiple choice"),
          { label: "2-mark multiple select", type: QuestionType.msq, count: 5, marksPerCorrect: 2, negativeMarks: 0 },
          { label: "2-mark numerical answer", type: QuestionType.numeric, count: 5, marksPerCorrect: 2, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.NDA]: {
    examType: ExamType.NDA,
    title: "NDA & NA (Paper I + Paper II)",
    subtitle: "National Defence Academy written examination",
    durationMinutes: 300,
    totalMarks: 900,
    totalQuestions: 270,
    instructions: [
      "Paper I — Mathematics: 120 questions, 300 marks, 150 minutes (+2.5 / -0.83).",
      "Paper II — General Ability Test: 150 questions, 600 marks, 150 minutes (+4 / -1.33).",
      "The General Ability Test is split into English (50 questions) and General Knowledge (100 questions).",
      "One third of the marks for a question are deducted for a wrong answer.",
    ],
    sections: [
      section({
        id: "nda-maths",
        name: "Mathematics (Paper I)",
        subject: "Mathematics",
        durationMinutes: 150,
        parts: [mcqPart(120, 2.5, 0.83)],
      }),
      section({
        id: "nda-english",
        name: "English (Paper II)",
        subject: "English",
        parts: [mcqPart(50, 4, 1.33)],
      }),
      section({
        id: "nda-gk",
        name: "General Knowledge (Paper II)",
        subject: "General Knowledge",
        description: "Physics, Chemistry, General Science, History, Geography, Current Events.",
        parts: [mcqPart(100, 4, 1.33)],
      }),
    ],
  },

  [ExamType.SSC_CGL]: {
    examType: ExamType.SSC_CGL,
    title: "SSC CGL (Tier-1 CBT Simulation)",
    subtitle: "Staff Selection Commission Combined Graduate Level Examination",
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 100,
    instructions: [
      "Total duration is 60 minutes (1 hour) for 100 questions.",
      "The test consists of 4 parts: Reasoning (25 Q), General Awareness (25 Q), Quantitative Aptitude (25 Q), and English Comprehension (25 Q).",
      "Marking Scheme: +2 marks for every correct answer, -0.50 marks for every wrong answer.",
      "Speed and accuracy are crucial — average 36 seconds per question.",
      "Fullscreen mode is enforced throughout the examination.",
    ],
    sections: [
      section({
        id: "ssc-reasoning",
        name: "General Intelligence & Reasoning",
        subject: "Reasoning",
        description: "Analogies, Syllogisms, Series, Coding-Decoding, Non-verbal reasoning.",
        parts: [mcqPart(25, 2, 0.5)],
      }),
      section({
        id: "ssc-gk",
        name: "General Awareness",
        subject: "General Awareness",
        description: "History, Polity, Geography, Economy, General Science, Current Affairs.",
        parts: [mcqPart(25, 2, 0.5)],
      }),
      section({
        id: "ssc-quant",
        name: "Quantitative Aptitude",
        subject: "Quantitative Aptitude",
        description: "Arithmetic, Algebra, Geometry, Trigonometry, Data Interpretation.",
        parts: [mcqPart(25, 2, 0.5)],
      }),
      section({
        id: "ssc-english",
        name: "English Comprehension",
        subject: "English",
        description: "Grammar, Vocabulary, Reading Comprehension, Idioms, Error Detection.",
        parts: [mcqPart(25, 2, 0.5)],
      }),
    ],
  },

  [ExamType.SSC_CHSL]: {
    examType: ExamType.SSC_CHSL,
    title: "SSC CHSL (Tier-1 Simulation)",
    subtitle: "Combined Higher Secondary Level Examination",
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 100,
    instructions: [
      "Duration: 60 minutes.",
      "4 sections of 25 questions each.",
      "Marking Scheme: +2 for correct, -0.5 for wrong.",
    ],
    sections: [
      section({ id: "chsl-reasoning", name: "General Intelligence", subject: "Reasoning", parts: [mcqPart(25, 2, 0.5)] }),
      section({ id: "chsl-gk", name: "General Awareness", subject: "General Awareness", parts: [mcqPart(25, 2, 0.5)] }),
      section({ id: "chsl-quant", name: "Quantitative Aptitude", subject: "Quantitative Aptitude", parts: [mcqPart(25, 2, 0.5)] }),
      section({ id: "chsl-english", name: "English Language", subject: "English", parts: [mcqPart(25, 2, 0.5)] }),
    ],
  },

  [ExamType.IBPS_PO]: {
    examType: ExamType.IBPS_PO,
    title: "IBPS PO (Preliminary Examination)",
    subtitle: "Institute of Banking Personnel Selection — Probationary Officer",
    durationMinutes: 60,
    totalMarks: 100,
    totalQuestions: 100,
    instructions: [
      "Three sections with individual 20-minute limits — you cannot return to a section once its clock expires.",
      "English Language 30 questions, Quantitative Aptitude 35 questions, Reasoning Ability 35 questions.",
      "Marking scheme: +1 for correct, -0.25 for incorrect.",
      "Sectional cut-offs apply, so leaving a whole section blank is fatal even with a high total.",
    ],
    sectionalTiming: true,
    sections: [
      section({ id: "ibps-english", name: "English Language", subject: "English", durationMinutes: 20, parts: [mcqPart(30, 1, 0.25)] }),
      section({ id: "ibps-quant", name: "Quantitative Aptitude", subject: "Quantitative Aptitude", durationMinutes: 20, parts: [mcqPart(35, 1, 0.25)] }),
      section({ id: "ibps-reasoning", name: "Reasoning Ability", subject: "Reasoning", durationMinutes: 20, parts: [mcqPart(35, 1, 0.25)] }),
    ],
  },

  [ExamType.RRB_NTPC]: {
    examType: ExamType.RRB_NTPC,
    title: "RRB NTPC (CBT Stage 1)",
    subtitle: "Railway Recruitment Board — Non-Technical Popular Categories",
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    instructions: [
      "Duration is 90 minutes for 100 questions.",
      "General Awareness 40 questions, Mathematics 30 questions, General Intelligence & Reasoning 30 questions.",
      "Marking scheme: +1 for correct, -1/3 for incorrect.",
    ],
    sections: [
      section({ id: "ntpc-ga", name: "General Awareness", subject: "General Awareness", parts: [mcqPart(40, 1, 0.33)] }),
      section({ id: "ntpc-maths", name: "Mathematics", subject: "Mathematics", parts: [mcqPart(30, 1, 0.33)] }),
      section({ id: "ntpc-reasoning", name: "General Intelligence & Reasoning", subject: "Reasoning", parts: [mcqPart(30, 1, 0.33)] }),
    ],
  },

  [ExamType.CTET]: {
    examType: ExamType.CTET,
    title: "CTET Paper II (Classes VI–VIII)",
    subtitle: "Central Teacher Eligibility Test",
    durationMinutes: 150,
    totalMarks: 150,
    totalQuestions: 150,
    instructions: [
      "Duration is 150 minutes for 150 questions.",
      "Child Development & Pedagogy 30, Language I 30, Language II 30, Mathematics & Science 60.",
      "Marking scheme: +1 for correct. There is no negative marking, so leave nothing blank.",
    ],
    sections: [
      section({ id: "ctet-cdp", name: "Child Development & Pedagogy", subject: "Pedagogy", parts: [mcqPart(30, 1, 0)] }),
      section({ id: "ctet-lang1", name: "Language I", subject: "Language I", parts: [mcqPart(30, 1, 0)] }),
      section({ id: "ctet-lang2", name: "Language II", subject: "Language II", parts: [mcqPart(30, 1, 0)] }),
      section({ id: "ctet-mathsci", name: "Mathematics & Science", subject: "Mathematics & Science", parts: [mcqPart(60, 1, 0)] }),
    ],
  },

  [ExamType.UPSC]: {
    examType: ExamType.UPSC,
    title: "UPSC Civil Services Prelims (GS-1)",
    subtitle: "General Studies Paper-1 Simulation",
    durationMinutes: 120,
    totalMarks: 200,
    totalQuestions: 100,
    instructions: [
      "Duration is 120 minutes for 100 questions.",
      "Marking scheme: +2 for correct, -0.66 for incorrect (one third of the marks assigned).",
      "Questions are heavily statement-based — read every option before eliminating.",
    ],
    sections: [
      section({
        id: "upsc-gs",
        name: "General Studies",
        subject: "General Studies",
        description: "History, Polity, Geography, Economy, Environment, Science & Technology, Current Affairs.",
        parts: [mcqPart(100, 2, 0.66)],
      }),
    ],
  },

  [ExamType.CLAT]: {
    examType: ExamType.CLAT,
    title: "CLAT (UG) Common Law Admission Test",
    subtitle: "Consortium of National Law Universities",
    durationMinutes: 120,
    totalMarks: 120,
    totalQuestions: 120,
    instructions: [
      "Duration is 120 minutes for 120 comprehension-based questions.",
      "English Language 24, Current Affairs & GK 30, Legal Reasoning 30, Logical Reasoning 24, Quantitative Techniques 12.",
      "Marking scheme: +1 for correct, -0.25 for incorrect.",
      "Every section is passage-driven — the answer is in the passage, not in prior legal knowledge.",
    ],
    sections: [
      section({ id: "clat-english", name: "English Language", subject: "English", parts: [mcqPart(24, 1, 0.25)] }),
      section({ id: "clat-gk", name: "Current Affairs & General Knowledge", subject: "General Knowledge", parts: [mcqPart(30, 1, 0.25)] }),
      section({ id: "clat-legal", name: "Legal Reasoning", subject: "Legal Reasoning", parts: [mcqPart(30, 1, 0.25)] }),
      section({ id: "clat-logical", name: "Logical Reasoning", subject: "Logical Reasoning", parts: [mcqPart(24, 1, 0.25)] }),
      section({ id: "clat-quant", name: "Quantitative Techniques", subject: "Quantitative Aptitude", parts: [mcqPart(12, 1, 0.25)] }),
    ],
  },

  [ExamType.CAT]: {
    examType: ExamType.CAT,
    title: "CAT (Common Admission Test)",
    subtitle: "IIM Entrance Simulation (VARC, DILR, QA)",
    durationMinutes: 120,
    totalMarks: 204,
    totalQuestions: 68,
    instructions: [
      "Duration is 120 minutes with a hard 40-minute limit on each of the three sections.",
      "You cannot return to a section once its 40 minutes have elapsed.",
      "MCQ: +3 for correct, -1 for incorrect. Non-MCQ (TITA): +3 for correct, no negative marking.",
      "VARC 24 questions, DILR 22 questions, QA 22 questions.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "cat-varc",
        name: "VARC",
        subject: "Verbal Ability & Reading Comprehension",
        durationMinutes: 40,
        parts: [
          mcqPart(19, 3, 1),
          { label: "TITA — type in the answer", type: QuestionType.short_answer, count: 5, marksPerCorrect: 3, negativeMarks: 0 },
        ],
      }),
      section({
        id: "cat-dilr",
        name: "DILR",
        subject: "Data Interpretation & Logical Reasoning",
        durationMinutes: 40,
        parts: [
          mcqPart(15, 3, 1),
          { label: "TITA — type in the answer", type: QuestionType.numeric, count: 7, marksPerCorrect: 3, negativeMarks: 0 },
        ],
      }),
      section({
        id: "cat-qa",
        name: "QA",
        subject: "Quantitative Aptitude",
        durationMinutes: 40,
        parts: [
          mcqPart(14, 3, 1),
          { label: "TITA — type in the answer", type: QuestionType.numeric, count: 8, marksPerCorrect: 3, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.GRE]: {
    examType: ExamType.GRE,
    title: "GRE General Test (shorter format)",
    subtitle: "Educational Testing Service — Verbal, Quantitative and Analytical Writing",
    durationMinutes: 118,
    // 27 verbal + 27 quant at a point each, plus the 0-6 Analytical Writing task.
    totalMarks: 60,
    totalQuestions: 55,
    instructions: [
      "Total testing time is 1 hour 58 minutes with no scheduled break.",
      "Analytical Writing: one 30-minute 'Analyze an Issue' task.",
      "Verbal Reasoning: two sections (12 and 15 questions) totalling 41 minutes.",
      "Quantitative Reasoning: two sections (12 and 15 questions) totalling 47 minutes.",
      "There is no negative marking, and the second section of each measure adapts to how you did on the first.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "gre-writing",
        name: "Analytical Writing",
        subject: "Analytical Writing",
        durationMinutes: 30,
        parts: [
          { label: "Analyze an Issue", type: QuestionType.long_answer, count: 1, marksPerCorrect: 6, negativeMarks: 0 },
        ],
      }),
      section({
        id: "gre-verbal",
        name: "Verbal Reasoning",
        subject: "Verbal Reasoning",
        durationMinutes: 41,
        description: "Text completion, sentence equivalence, reading comprehension.",
        parts: [mcqPart(27, 1, 0)],
      }),
      section({
        id: "gre-quant",
        name: "Quantitative Reasoning",
        subject: "Quantitative Reasoning",
        durationMinutes: 47,
        description: "Quantitative comparison, problem solving, data interpretation.",
        parts: [
          mcqPart(20, 1, 0),
          { label: "Numeric entry", type: QuestionType.numeric, count: 7, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.GMAT]: {
    examType: ExamType.GMAT,
    title: "GMAT Focus Edition",
    subtitle: "Graduate Management Admission Test",
    durationMinutes: 135,
    totalMarks: 64,
    totalQuestions: 64,
    instructions: [
      "Three 45-minute sections: Quantitative Reasoning (21 Q), Verbal Reasoning (23 Q), Data Insights (20 Q).",
      "There is no negative marking, but the test is adaptive and unanswered questions are penalised heavily.",
      "You may bookmark and revisit up to three answers per section before that section ends.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "gmat-quant",
        name: "Quantitative Reasoning",
        subject: "Quantitative Reasoning",
        durationMinutes: 45,
        description: "Problem solving — algebra and arithmetic, no geometry in the Focus Edition.",
        parts: [mcqPart(21, 1, 0)],
      }),
      section({
        id: "gmat-verbal",
        name: "Verbal Reasoning",
        subject: "Verbal Reasoning",
        durationMinutes: 45,
        description: "Reading comprehension and critical reasoning.",
        parts: [mcqPart(23, 1, 0)],
      }),
      section({
        id: "gmat-di",
        name: "Data Insights",
        subject: "Data Insights",
        durationMinutes: 45,
        description: "Data sufficiency, multi-source reasoning, table analysis, graphics interpretation.",
        parts: [mcqPart(20, 1, 0)],
      }),
    ],
  },

  [ExamType.IELTS]: {
    examType: ExamType.IELTS,
    title: "IELTS Academic (Listening, Reading, Writing)",
    subtitle: "International English Language Testing System",
    durationMinutes: 150,
    totalMarks: 82,
    totalQuestions: 82,
    instructions: [
      "Listening: 40 questions in 30 minutes. Reading: 40 questions in 60 minutes. Writing: 2 tasks in 60 minutes.",
      "The Speaking test is a face-to-face interview and is not simulated here.",
      "There is no negative marking — a raw score out of 40 converts to the 9-band scale.",
      "Spelling and grammar count in Listening and Reading answers.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "ielts-listening",
        name: "Listening",
        subject: "Listening",
        durationMinutes: 30,
        description: "Four recorded parts — conversations and monologues.",
        parts: [
          mcqPart(20, 1, 0),
          { label: "Form / note completion", type: QuestionType.short_answer, count: 20, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
      section({
        id: "ielts-reading",
        name: "Reading",
        subject: "Reading",
        durationMinutes: 60,
        description: "Three long academic passages.",
        parts: [
          mcqPart(20, 1, 0),
          { label: "Sentence / summary completion", type: QuestionType.short_answer, count: 20, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
      section({
        id: "ielts-writing",
        name: "Writing",
        subject: "Writing",
        durationMinutes: 60,
        description: "Task 1 (150 words, describe a visual) and Task 2 (250 words, essay).",
        parts: [
          { label: "Task 1 — report", type: QuestionType.long_answer, count: 1, marksPerCorrect: 1, negativeMarks: 0 },
          { label: "Task 2 — essay", type: QuestionType.long_answer, count: 1, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.TOEFL]: {
    examType: ExamType.TOEFL,
    title: "TOEFL iBT",
    subtitle: "Test of English as a Foreign Language — internet-based test",
    durationMinutes: 116,
    totalMarks: 54,
    totalQuestions: 54,
    instructions: [
      "Reading: 20 questions in 35 minutes. Listening: 28 questions in 36 minutes.",
      "Speaking: 4 tasks in 16 minutes. Writing: 2 tasks in 29 minutes.",
      "No negative marking; each section is scaled to 0–30 for a total of 120.",
    ],
    sectionalTiming: true,
    sections: [
      section({
        id: "toefl-reading",
        name: "Reading",
        subject: "Reading",
        durationMinutes: 35,
        parts: [mcqPart(20, 1, 0)],
      }),
      section({
        id: "toefl-listening",
        name: "Listening",
        subject: "Listening",
        durationMinutes: 36,
        parts: [mcqPart(28, 1, 0)],
      }),
      section({
        id: "toefl-speaking",
        name: "Speaking",
        subject: "Speaking",
        durationMinutes: 16,
        description: "One independent and three integrated tasks.",
        parts: [
          { label: "Speaking task", type: QuestionType.short_answer, count: 4, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
      section({
        id: "toefl-writing",
        name: "Writing",
        subject: "Writing",
        durationMinutes: 29,
        description: "Integrated writing and 'Writing for an Academic Discussion'.",
        parts: [
          { label: "Writing task", type: QuestionType.long_answer, count: 2, marksPerCorrect: 1, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.CLASS_9]: {
    examType: ExamType.CLASS_9,
    title: "CBSE Class 9 Term Exam Simulation",
    subtitle: "Science & Mathematics Practice",
    durationMinutes: 90,
    totalMarks: 90,
    totalQuestions: 30,
    instructions: [
      "Duration is 90 minutes.",
      "Questions carry 3 marks each with no negative marking.",
      "Written answers are graded against a rubric, so show your working.",
    ],
    sections: [
      section({
        id: "c9-science",
        name: "Science",
        subject: "Science",
        parts: [
          mcqPart(10, 3, 0, "Objective"),
          { label: "Short answer", type: QuestionType.short_answer, count: 5, marksPerCorrect: 3, negativeMarks: 0 },
        ],
      }),
      section({
        id: "c9-math",
        name: "Mathematics",
        subject: "Mathematics",
        parts: [
          mcqPart(10, 3, 0, "Objective"),
          { label: "Short answer", type: QuestionType.short_answer, count: 5, marksPerCorrect: 3, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.CLASS_10]: {
    examType: ExamType.CLASS_10,
    title: "CBSE Class 10 Board Simulation",
    subtitle: "Science & Mathematics Board Pattern",
    durationMinutes: 120,
    totalMarks: 152,
    totalQuestions: 38,
    instructions: [
      "Duration is 120 minutes.",
      "Follows the official CBSE Board paper pattern: objective, short answer and long answer.",
      "There is no negative marking; partial credit is awarded on the rubric.",
    ],
    sections: [
      section({
        id: "c10-science",
        name: "Science",
        subject: "Science",
        parts: [
          mcqPart(10, 4, 0, "Section A — Objective"),
          { label: "Section B — Short answer", type: QuestionType.short_answer, count: 6, marksPerCorrect: 4, negativeMarks: 0 },
          { label: "Section C — Long answer", type: QuestionType.long_answer, count: 3, marksPerCorrect: 4, negativeMarks: 0 },
        ],
      }),
      section({
        id: "c10-math",
        name: "Mathematics",
        subject: "Mathematics",
        parts: [
          mcqPart(10, 4, 0, "Section A — Objective"),
          { label: "Section B — Short answer", type: QuestionType.short_answer, count: 6, marksPerCorrect: 4, negativeMarks: 0 },
          { label: "Section C — Long answer", type: QuestionType.long_answer, count: 3, marksPerCorrect: 4, negativeMarks: 0 },
        ],
      }),
    ],
  },

  [ExamType.CUSTOM]: {
    examType: ExamType.CUSTOM,
    title: "Custom Exam Simulation",
    subtitle: "Personalized Mock Test",
    durationMinutes: 60,
    totalMarks: 100,
    totalQuestions: 25,
    instructions: ["Practice test according to your customized settings."],
    sections: [
      section({
        id: "custom-sec-1",
        name: "Section 1",
        subject: "General",
        parts: [
          mcqPart(20, 4, 1),
          { label: "Written", type: QuestionType.short_answer, count: 5, marksPerCorrect: 4, negativeMarks: 0 },
        ],
      }),
    ],
  },
};

/** Every question the pattern asks for, flattened across sections and parts. */
export function patternQuestionCount(pattern: ExamPatternConfig): number {
  return pattern.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
}

/** Total marks on offer, derived from the parts rather than trusted blindly. */
export function patternMaxMarks(pattern: ExamPatternConfig): number {
  return pattern.sections.reduce(
    (sum, s) =>
      sum +
      (s.parts?.reduce((secSum, p) => secSum + p.count * p.marksPerCorrect, 0) ??
        s.totalQuestions * s.marksPerCorrect),
    0
  );
}
