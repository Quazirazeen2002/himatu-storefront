# Hero media upload repair

The admin Content page now requests a signed upload URL from `POST /api/v1/admin/content/hero/upload`, sends the selected MP4, WebM, JPEG, PNG, or WebP file directly to Supabase Storage, and calls `/complete` only after the upload succeeds. The API verifies the stored file before publishing it as the homepage hero. Both endpoints require the admin role. A new path is issued for every upload, so an admin can replace the hero whenever needed.

The `hero-media` public Supabase bucket is configured in the connected HIMATU project for those media types. The storefront and API must both be deployed for this route to work. The storefront needs `API_URL=https://api.himatu.com`; the API needs `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY`. No storage key is included in deployment archives.

The application imposes no separate video-size limit or request-body upload proxy. Supabase Free currently limits an individual file to 50 MB. Uploads above the project's Storage limit require a higher storage limit or another media provider. A failed upload does not change the live hero.

Verification: a temporary MP4 was uploaded using the same signed-URL method, inspected in Storage, and deleted; browser CORS preflight allowed PUT from localhost; the API route authorization/completion tests passed; the monorepo build and typecheck passed. The repository's existing lint errors in large legacy files remain outside this repair.
