-- AlterTable: optional banner carousel images for the public store page
ALTER TABLE "stores" ADD COLUMN "bannerUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
