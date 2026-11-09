-- Add independent product categories while retaining all existing franchise assignments.
CREATE TYPE "CategoryKind" AS ENUM ('PRODUCT_TYPE', 'FRANCHISE');
CREATE TYPE "FranchiseFamily" AS ENUM ('ANIME', 'MARVEL', 'DC', 'MOVIES', 'OTHER');
ALTER TABLE "Category"
  ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'FRANCHISE',
  ADD COLUMN "family" "FranchiseFamily" DEFAULT 'ANIME',
  ADD COLUMN "imageIsDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "productTypeId" UUID;
ALTER TABLE "Product" ADD CONSTRAINT "Product_productTypeId_fkey"
  FOREIGN KEY ("productTypeId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Product_productTypeId_isActive_idx" ON "Product"("productTypeId", "isActive");
