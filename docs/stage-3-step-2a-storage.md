# HIMATU — Stage 3 Step 2A: Supabase Storage & Product Photographs

## 1. Bucket Configuration
- **Bucket ID**: `product-images`
- **Access Level**: Public Read (`public: true`)
- **Write Policy**: Server-side only via NestJS backend using Supabase Service Role key (`SUPABASE_SECRET_KEY`).
- **File Size Limit**: 10MB (10,485,760 bytes).
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`.

---

## 2. Security & Upload Pipeline

### 2.1 Binary Magic Number Verification
In addition to checking browser-provided `content-type` headers, `StorageService` inspects the initial byte sequences to prevent spoofed or malicious payloads:
- **JPEG**: `0xFF, 0xD8, 0xFF`
- **PNG**: `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`
- **WebP**: `RIFF` header at byte offset 0..3 and `WEBP` tag at byte offset 8..11.

### 2.2 Storage Hierarchy
Images are partitioned predictably under:
```
product-images/products/<productId>/<random-uuid>.<ext>
```
Public CDN URLs are resolved via:
```
https://<project-ref>.supabase.co/storage/v1/object/public/product-images/products/<productId>/<filename>
```

### 2.3 Database Synchronization & Primary Image Logic
- Multiple photographs per figure are supported.
- If a product currently has no images, the first uploaded photograph is automatically designated `isPrimary: true`.
- When an administrator designates an image as primary, a transactional batch update resets `isPrimary: false` across all other images for that product.
- Deleting an image removes the physical object from the Supabase Storage bucket and deletes the corresponding row from PostgreSQL. If the primary image was deleted, the next image in sort order is automatically promoted to primary.

