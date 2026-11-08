# HIMATU — Security & Financial Integrity Specification
## Stage 3 Step 2C: Payment Security, Token Authentication & Data Privacy

---

## 1. Zero Trust on Client Data

1. **Server-Calculated Amounts**: Order amounts and quotation totals are computed exclusively on the server using verified unit prices, material rates, and shipping policies. Client-submitted prices are rejected.
2. **Gateway Response Integrity**: Browser callback query parameters (e.g. `status=success`) are never trusted directly. The server calls gateway validation APIs (`/tokenized/checkout/execute` or `/validator/api/validationserverAPI.php`) over encrypted server-to-server TLS before crediting any order.
3. **Refund Authorizations**: Only authenticated store administrators (`Role.ADMIN`) with valid Supabase Auth JWTs can issue refunds.

---

## 2. File Upload Security & IP Protection

1. **Magic Number Verification**: All uploads validate byte signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP). Spoofed file extensions are blocked with HTTP 400.
2. **File Size Limits**: 15MB limit enforced per image buffer.
3. **Private Bucket Storage**: Reference photos are quarantined inside private Supabase bucket `custom-print-references`. Direct public URL access is disabled. Signed URLs with 3600-second TTL are generated on demand.
4. **Internal Staff Isolation**: Technician notes and internal cost calculations are quarantined in server memory and stripped from customer responses.

