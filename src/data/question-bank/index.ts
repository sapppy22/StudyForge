import type { BankSeed, BankSource } from "./types";
import { jeeBank } from "./jee";
import { neetBank } from "./neet";
import { sscBank } from "./ssc";

/**
 * The curated question bank, in seed order.
 *
 * Ordering is meaningful: within each subject, chapters appear highest-weightage
 * first, so working straight down the sheet covers the most marks per hour. The
 * `orderIndex` written to the database is simply the position here.
 */
export const questionBank: BankSeed[] = [...jeeBank, ...neetBank, ...sscBank];

/**
 * Where the taxonomy and ordering came from. Surfaced in the UI so a student can
 * check the weightage claims rather than taking the sheet's ordering on trust.
 */
export const bankSources: BankSource[] = [
  {
    examType: "JEE_MAIN",
    label: "JEE Main exam pattern and marking scheme (NTA)",
    url: "https://www.embibe.com/exams/jee-main-exam-pattern/",
  },
  {
    examType: "JEE_MAIN",
    label: "JEE Main chapter-wise weightage (last 10 years)",
    url: "https://collegedunia.com/exams/jee-main/chapter-wise-weightage",
  },
  {
    examType: "JEE_ADVANCED",
    label: "JEE Advanced paper pattern, Paper 1 & Paper 2",
    url: "https://www.askiitians.com/iit-jee/advanced/paper-pattern.html",
  },
  {
    examType: "NEET",
    label: "NEET UG exam pattern, duration and marking scheme",
    url: "https://news.careers360.com/neet-ug-2025-candidates-attempt-180-questions-for-720-marks-marking-scheme-exam-duration",
  },
  {
    examType: "NEET",
    label: "NEET chapter-wise weightage across Physics, Chemistry and Biology",
    url: "https://allen.in/neet/chapter-wise-weightage",
  },
  {
    examType: "SSC_CGL",
    label: "SSC CGL Tier 1 & Tier 2 pattern, marks and negative marking",
    url: "https://www.sscadda.com/ssc-cgl-exam-pattern/",
  },
];

/** Exams that have a curated sheet, in the order they should be offered. */
export const BANK_EXAMS = [
  "JEE_MAIN",
  "JEE_ADVANCED",
  "NEET",
  "SSC_CGL",
] as const;

export type { BankSeed, BankSource };
