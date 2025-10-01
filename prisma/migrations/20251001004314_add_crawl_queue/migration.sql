-- CreateTable
CREATE TABLE "crawl_queue" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isSeedDomain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "crawl_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crawl_queue_id_key" ON "crawl_queue"("id");

-- CreateIndex
CREATE UNIQUE INDEX "crawl_queue_url_key" ON "crawl_queue"("url");

-- CreateIndex
CREATE INDEX "crawl_queue_status_idx" ON "crawl_queue"("status");

-- CreateIndex
CREATE INDEX "crawl_queue_isSeedDomain_idx" ON "crawl_queue"("isSeedDomain");
