# HIMATU — Custom 3D Printing Requests Specification
## Stage 3 Step 2C: Bespoke Anime Collectible Ingestion & Private Storage

---

## 1. Overview

Customers can submit custom anime figure commissions via the public `/3d-printing` landing page and inquiry workbench. The system accepts character details, dynamic pose preferences, scale choices, material configurations, artistic finishes, and reference artwork.

---

## 2. Technical Specifications

1. **Inquiry Identifier**: Human-readable unique identifier formatted as `PR-YYYY-XXXX` (e.g. `PR-2026-8933`).
2. **Configuration Attributes**:
   - `sizePreference`: Scale choices (1/10 Scale ~18cm, 1/7 Scale ~24cm, 1/6 Scale ~30cm, 1/4 Scale ~45cm, Custom).
   - `materialPreference`: Resin selections (8K Micro-Resin 0.02mm, Tough ABS-Like Resin, Clear Translucent Photopolymer).
   - `finishPreference`: Hand-painted finishing (Fully Hand-Painted Master Level, Base Coat Primed & Pre-Shaded, Raw Cleaned & UV Cured Assembly).
   - `budgetEstimate`: Optional customer BDT budget expectation.
   - `description`: Detailed costume, hair, dynamic effects, and base requirements.
3. **Private Reference Storage**:
   - Customer reference photos and sketches are stored in private Supabase Storage bucket `custom-print-references`.
   - Magic numbers (file signatures) are validated on the server for JPEG (`FF D8 FF`), PNG (`89 50 4E 47...`), and WebP (`RIFF...WEBP`).
   - Photos are served to customers and staff strictly via short-lived signed URLs (1-hour TTL) to guarantee intellectual property privacy.
4. **Staff & Customer Privacy Quarantine**:
   - Internal manufacturing notes, resin slicing formulas, and staff comments are quarantined on the server and stripped from customer responses.

