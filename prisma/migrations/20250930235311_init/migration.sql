-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "faviconId" TEXT,
    "ogImageId" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "discord" TEXT,
    "github" TEXT,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "keywords" TEXT[],
    "industry" TEXT,
    "audience" TEXT,
    "technologies" TEXT[],
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_id_key" ON "properties"("id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_hostname_key" ON "properties"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_id_key" ON "nodes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_url_key" ON "nodes"("url");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_id_key" ON "connectors"("id");

-- CreateIndex
CREATE UNIQUE INDEX "media_id_key" ON "media"("id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_toId_fkey" FOREIGN KEY ("toId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
