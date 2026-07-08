CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "BlogBlockType" AS ENUM (
  'HEADING',
  'PARAGRAPH',
  'IMAGE',
  'GALLERY',
  'QUOTE',
  'ORDERED_LIST',
  'UNORDERED_LIST',
  'DIVIDER',
  'YOUTUBE'
);

CREATE TABLE "Blog" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "featuredImageKey" TEXT,
  "author" TEXT NOT NULL,
  "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
  "metaTitle" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogBlock" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "type" "BlogBlockType" NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BlogBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogTemple" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "templeId" TEXT NOT NULL,

  CONSTRAINT "BlogTemple_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPooja" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "poojaId" TEXT NOT NULL,

  CONSTRAINT "BlogPooja_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");
CREATE INDEX "Blog_status_idx" ON "Blog"("status");
CREATE INDEX "Blog_publishedAt_idx" ON "Blog"("publishedAt");
CREATE INDEX "Blog_deletedAt_idx" ON "Blog"("deletedAt");
CREATE UNIQUE INDEX "BlogBlock_blogId_order_key" ON "BlogBlock"("blogId", "order");
CREATE INDEX "BlogBlock_blogId_idx" ON "BlogBlock"("blogId");
CREATE UNIQUE INDEX "BlogTemple_blogId_templeId_key" ON "BlogTemple"("blogId", "templeId");
CREATE INDEX "BlogTemple_templeId_idx" ON "BlogTemple"("templeId");
CREATE UNIQUE INDEX "BlogPooja_blogId_poojaId_key" ON "BlogPooja"("blogId", "poojaId");
CREATE INDEX "BlogPooja_poojaId_idx" ON "BlogPooja"("poojaId");

ALTER TABLE "BlogBlock" ADD CONSTRAINT "BlogBlock_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogTemple" ADD CONSTRAINT "BlogTemple_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogTemple" ADD CONSTRAINT "BlogTemple_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPooja" ADD CONSTRAINT "BlogPooja_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPooja" ADD CONSTRAINT "BlogPooja_poojaId_fkey" FOREIGN KEY ("poojaId") REFERENCES "Pooja"("id") ON DELETE CASCADE ON UPDATE CASCADE;