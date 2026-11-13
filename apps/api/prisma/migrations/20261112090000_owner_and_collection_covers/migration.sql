-- Keep the original cover configuration available for recovery.
INSERT INTO "SiteContent" (key,value,"updatedAt")
SELECT 'covers-before-20261112', COALESCE(jsonb_agg(jsonb_build_object('id',id,'slug',slug,'imageUrl',"imageUrl",'imageIsDemo',"imageIsDemo")), '[]'::jsonb), NOW()
FROM "Category" WHERE slug IN ('naruto','attack-on-titan','demon-slayer','one-piece','katanas','keychains','jujutsu-kaisen','dragon-ball','blue-lock')
ON CONFLICT (key) DO NOTHING;
UPDATE "Category" SET "imageUrl"='/images/collections/' || slug || '-cover.webp', "imageIsDemo"=false, "updatedAt"=NOW()
WHERE slug IN ('naruto','attack-on-titan','demon-slayer','one-piece','katanas','keychains','jujutsu-kaisen','dragon-ball','blue-lock');
-- The owner is pinned to a stable profile UUID, so changing email later cannot transfer ownership.
INSERT INTO "SiteContent" (key,value,"updatedAt")
SELECT 'store-owner', jsonb_build_object('userId',id), NOW() FROM "UserProfile"
WHERE lower(email)='davejoty009@gmail.com' AND role='ADMIN'
ON CONFLICT (key) DO NOTHING;
