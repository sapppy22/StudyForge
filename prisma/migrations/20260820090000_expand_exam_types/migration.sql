-- Widen the exam catalog beyond the original engineering/medical/SSC set.
--
-- Postgres appends enum values in declaration order only for newly created
-- types, so these land at the end of "ExamType". Nothing reads the enum's
-- ordinal position — the UI orders exams from the catalog in
-- src/data/exams/catalog.ts — so appending is safe.
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'BITSAT';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'CUET_UG';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'GATE';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'NDA';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'IBPS_PO';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'RRB_NTPC';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'CTET';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'CLAT';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'GRE';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'GMAT';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'IELTS';
ALTER TYPE "ExamType" ADD VALUE IF NOT EXISTS 'TOEFL';
