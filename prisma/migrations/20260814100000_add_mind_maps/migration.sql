-- CreateTable
CREATE TABLE "mind_maps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "content_item_id" TEXT,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "generated_by" TEXT NOT NULL DEFAULT 'ai',
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mind_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mind_maps_user_id_idx" ON "mind_maps"("user_id");

-- CreateIndex
CREATE INDEX "mind_maps_topic_id_idx" ON "mind_maps"("topic_id");

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "syllabus_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

