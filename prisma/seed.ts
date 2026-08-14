import { PrismaClient } from "@prisma/client";
import { questionBank } from "../src/data/question-bank";

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Seeding ${questionBank.length} curated questions into Supabase...`);

  const records = questionBank.map((seed, index) => ({
    slug: seed.slug,
    examType: seed.examType,
    subject: seed.subject,
    chapter: seed.chapter,
    topic: seed.topic ?? null,
    type: seed.type,
    difficulty: seed.difficulty,
    content: seed.content,
    correctAnswer: seed.correctAnswer ?? null,
    solution: seed.solution ?? null,
    hint: seed.hint ?? null,
    marks: seed.marks ?? 4,
    expectedMinutes: seed.expectedMinutes ?? 3,
    year: seed.year ?? null,
    tags: seed.tags ?? [],
    orderIndex: index,
  }));

  const result = await prisma.bankQuestion.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`✅ Successfully seeded ${result.count} questions into the database!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
