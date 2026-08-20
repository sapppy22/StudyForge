import { ExamType } from "@prisma/client";

/**
 * The exams StudyForge supports, in the order they are offered.
 *
 * One list drives goal creation, the question bank tabs and the simulation
 * library, so adding an exam is a single edit here plus its pattern in
 * `data/simulations/patterns.ts` and its syllabus in `data/exams/syllabi.ts`.
 */

export type ExamCategory =
  | "engineering"
  | "medical"
  | "management"
  | "government"
  | "law"
  | "teaching"
  | "study-abroad"
  | "school";

export interface ExamCatalogEntry {
  examType: ExamType;
  /** Short name used on tabs and chips. */
  label: string;
  /** Full name, for the goal picker. */
  fullName: string;
  category: ExamCategory;
  blurb: string;
}

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  engineering: "Engineering",
  medical: "Medical",
  management: "Management",
  government: "Government & Banking",
  law: "Law",
  teaching: "Teaching",
  "study-abroad": "Study abroad",
  school: "School boards",
};

export const EXAM_CATALOG: ExamCatalogEntry[] = [
  {
    examType: ExamType.JEE_MAIN,
    label: "JEE Main",
    fullName: "JEE Main (NTA)",
    category: "engineering",
    blurb: "75 questions · 180 min · Physics, Chemistry, Mathematics",
  },
  {
    examType: ExamType.JEE_ADVANCED,
    label: "JEE Advanced",
    fullName: "JEE Advanced (IIT)",
    category: "engineering",
    blurb: "51 questions · 180 min · multi-correct and integer answers",
  },
  {
    examType: ExamType.BITSAT,
    label: "BITSAT",
    fullName: "BITSAT (BITS Pilani)",
    category: "engineering",
    blurb: "130 questions · 180 min · adds English and Logical Reasoning",
  },
  {
    examType: ExamType.GATE,
    label: "GATE",
    fullName: "GATE (Graduate Aptitude Test in Engineering)",
    category: "engineering",
    blurb: "65 questions · 180 min · aptitude plus your core discipline",
  },
  {
    examType: ExamType.NEET,
    label: "NEET",
    fullName: "NEET (UG)",
    category: "medical",
    blurb: "180 questions · 180 min · Physics, Chemistry, Botany, Zoology",
  },
  {
    examType: ExamType.CAT,
    label: "CAT",
    fullName: "CAT (Common Admission Test)",
    category: "management",
    blurb: "68 questions · 120 min · 40-minute sectional locks",
  },
  {
    examType: ExamType.GMAT,
    label: "GMAT",
    fullName: "GMAT Focus Edition",
    category: "management",
    blurb: "64 questions · 135 min · Quant, Verbal, Data Insights",
  },
  {
    examType: ExamType.GRE,
    label: "GRE",
    fullName: "GRE General Test",
    category: "study-abroad",
    blurb: "55 items · 118 min · Verbal, Quant, Analytical Writing",
  },
  {
    examType: ExamType.IELTS,
    label: "IELTS",
    fullName: "IELTS Academic",
    category: "study-abroad",
    blurb: "82 items · 150 min · Listening, Reading, Writing",
  },
  {
    examType: ExamType.TOEFL,
    label: "TOEFL",
    fullName: "TOEFL iBT",
    category: "study-abroad",
    blurb: "54 items · 116 min · four skills, section by section",
  },
  {
    examType: ExamType.UPSC,
    label: "UPSC",
    fullName: "UPSC Civil Services Prelims",
    category: "government",
    blurb: "100 questions · 120 min · General Studies Paper I",
  },
  {
    examType: ExamType.SSC_CGL,
    label: "SSC CGL",
    fullName: "SSC CGL Tier-1",
    category: "government",
    blurb: "100 questions · 60 min · speed is the whole game",
  },
  {
    examType: ExamType.SSC_CHSL,
    label: "SSC CHSL",
    fullName: "SSC CHSL Tier-1",
    category: "government",
    blurb: "100 questions · 60 min · four 25-question sections",
  },
  {
    examType: ExamType.IBPS_PO,
    label: "IBPS PO",
    fullName: "IBPS PO Prelims",
    category: "government",
    blurb: "100 questions · 60 min · 20-minute sectional locks",
  },
  {
    examType: ExamType.RRB_NTPC,
    label: "RRB NTPC",
    fullName: "RRB NTPC CBT-1",
    category: "government",
    blurb: "100 questions · 90 min · GA-heavy railway recruitment",
  },
  {
    examType: ExamType.NDA,
    label: "NDA",
    fullName: "NDA & NA written exam",
    category: "government",
    blurb: "270 questions · 300 min · Mathematics plus General Ability",
  },
  {
    examType: ExamType.CLAT,
    label: "CLAT",
    fullName: "CLAT (UG)",
    category: "law",
    blurb: "120 questions · 120 min · every section passage-driven",
  },
  {
    examType: ExamType.CTET,
    label: "CTET",
    fullName: "CTET Paper II",
    category: "teaching",
    blurb: "150 questions · 150 min · no negative marking",
  },
  {
    examType: ExamType.CUET_UG,
    label: "CUET UG",
    fullName: "CUET (UG)",
    category: "school",
    blurb: "160 questions · 180 min · Language, Domain, General Test",
  },
  {
    examType: ExamType.CLASS_10,
    label: "Class 10",
    fullName: "CBSE Class 10 Boards",
    category: "school",
    blurb: "38 questions · 120 min · objective, short and long answers",
  },
  {
    examType: ExamType.CLASS_9,
    label: "Class 9",
    fullName: "CBSE Class 9",
    category: "school",
    blurb: "30 questions · 90 min · Science and Mathematics",
  },
  {
    examType: ExamType.CUSTOM,
    label: "Custom",
    fullName: "Custom goal",
    category: "school",
    blurb: "Build your own syllabus and paper shape",
  },
];

const BY_TYPE = new Map(EXAM_CATALOG.map((entry) => [entry.examType, entry]));

export function examEntry(examType: ExamType): ExamCatalogEntry | undefined {
  return BY_TYPE.get(examType);
}

/** Human label for an exam, falling back to the enum name for safety. */
export function examLabel(examType: ExamType): string {
  return BY_TYPE.get(examType)?.label ?? String(examType).replace(/_/g, " ");
}

/** The catalog grouped for a picker, categories in catalog order. */
export function examsByCategory(): { category: ExamCategory; label: string; exams: ExamCatalogEntry[] }[] {
  const order: ExamCategory[] = [];
  const grouped = new Map<ExamCategory, ExamCatalogEntry[]>();

  for (const entry of EXAM_CATALOG) {
    if (!grouped.has(entry.category)) {
      grouped.set(entry.category, []);
      order.push(entry.category);
    }
    grouped.get(entry.category)!.push(entry);
  }

  return order.map((category) => ({
    category,
    label: EXAM_CATEGORY_LABELS[category],
    exams: grouped.get(category)!,
  }));
}
