ALTER TABLE "Category" ADD COLUMN "bannerImageUrl" TEXT;

-- Preserve the currently displayed wide banner independently from the card cover.
UPDATE "Category" SET "bannerImageUrl" = CASE slug
  WHEN 'action-figures' THEN '/images/collections/action-figures-shelf.jpeg'
  WHEN 'bleach' THEN '/images/collections/bleach-wallpaper.webp'
  WHEN 'hunter-x-hunter' THEN '/images/collections/hunter-x-hunter-wallpaper.webp'
  WHEN 'death-note' THEN '/images/collections/death-note-wallpaper.webp'
  WHEN 'marvel' THEN '/images/collections/marvel-wallpaper.webp'
  WHEN 'dc' THEN '/images/collections/dc-wallpaper.webp'
  WHEN 'movies' THEN '/images/collections/movies-wallpaper.webp'
  WHEN 'other-collections' THEN '/images/collections/other-collections-wallpaper.webp'
  WHEN 'solo-leveling' THEN '/images/collections/solo-leveling-banner.webp'
  ELSE COALESCE("imageUrl", '/images/categories/category-default.svg')
END;
