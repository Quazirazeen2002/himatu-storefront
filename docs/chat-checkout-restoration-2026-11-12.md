# Chat checkout restored — 12 November 2026

Restored WhatsApp, Instagram, Facebook and TikTok choices at the end of checkout. The black order button names the selected platform. Authentication, address validation, original/sale prices, product savings and request idempotency remain.

The request is saved first with its actual selected channel. Only then does the reserved chat window navigate. The message includes its request reference, products, quantities, prices, discount, totals, customer and delivery details. WhatsApp supports a prefilled message. Instagram/Facebook open their messaging destinations and copying is attempted; TikTok opens the profile with instructions to tap Message. These platforms do not provide a reliable website link that prefills a customer chat message. A copy button, selectable full message and reopen link remain available if browser clipboard/window permissions block the automatic steps. The customer sends the message.

If saving fails, the blank window closes and no customer details are handed off. If the window is blocked or closed, the saved request remains visible and the user can reopen the chosen destination without submitting it again.

Validation: strict frontend TypeScript, production frontend build and 126 frontend tests passed. Targeted checkout/formatter lint passed. Isolated Playwright fixtures verified all four saved channels and destinations, message contents and discounts, save-before-handoff, save failure, blocked-popup fallback and all six requested responsive widths. No real orders or social messages were sent. Screenshot: `output/playwright/nov12/restored-chat-checkout.png`.

Only the frontend package changes for this restoration; use the latest existing backend package. No database migration or environment change is required. Earlier direct-checkout documentation describes the previous version and is superseded by this restoration.
