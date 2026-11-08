# HIMATU — Production Kanban & Workshop Tracking Specification
## Stage 3 Step 2C: 10-Stage Figure Fabrication Pipeline

---

## 1. 10 Sequential Manufacturing Stages

Every custom figure commission passes through 10 manufacturing milestones:

| Step | Stage Identifier | Stage Description | Customer Notification |
|---|---|---|---|
| **01** | `3D_MODELING` | Digital Character Topology Sculpting | Sculptors are preparing character CAD geometry |
| **02** | `MODEL_SLICING` | Orientation & Support Structure Prep | Model slicing and layer exposure analysis underway |
| **03** | `PRINTING_STARTED` | 8K SLA Photopolymer Vat Printing | Figure is actively printing at 0.02mm layer height |
| **04** | `PRINT_CLEANUP_CURING` | Ultrasonic IPA Wash & UV Post-Curing | Uncured resin washed and multi-wavelength cured |
| **05** | `SURFACE_PRIMING` | Micromesh Sanding & Base Primer | Support scars eliminated and micro-primer applied |
| **06** | `AIRBRUSH_BASE` | Gradient Shading & Base Skin Tones | Precision airbrush base coats and highlights applied |
| **07** | `DETAIL_HAND_PAINTING` | Eyes, Hair, Accents & Costume Detailing | Master artist hand-painting face, eyes and costume |
| **08** | `CLEAR_COAT_FINISH` | Matte/Gloss UV Protective Sealer | Protective sealing applied to prevent UV discoloration |
| **09** | `QUALITY_INSPECTION` | Optical QA Audit & Balance Inspection | Figure balance, joints and paint finish certified |
| **10** | `PACKED_FOR_DELIVERY` | Velvet-Lined Box Packing & Dispatch | Parcel packaged with corner protectors for delivery |

---

## 2. Admin Kanban Workspace (`/admin/3d-printing/production`)

- Visual column for each of the 10 stages.
- Figure cards displaying character name, request number, linked order number, and last milestone log.
- "Advance Stage" button moves figure forward one step.
- "Post Progress Update" button allows workshop staff to publish customer-visible progress notes and preview photographs.
- Advancing to `PACKED_FOR_DELIVERY` automatically transitions the request to `COMPLETED` and the linked order to `DELIVERED`.

