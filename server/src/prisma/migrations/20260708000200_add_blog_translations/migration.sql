CREATE TABLE "BlogTranslation" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "language" "Language" NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "metaTitle" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL,

  CONSTRAINT "BlogTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogTranslation_blogId_language_key" ON "BlogTranslation"("blogId", "language");
CREATE INDEX "BlogTranslation_language_idx" ON "BlogTranslation"("language");

ALTER TABLE "BlogTranslation" ADD CONSTRAINT "BlogTranslation_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;