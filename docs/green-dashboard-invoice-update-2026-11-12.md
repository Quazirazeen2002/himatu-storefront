# Green dashboard, product deletion and PDF review — 12 November 2026

## Interface colours

Positive and neutral accents now use green, including dashboard owner badges, featured/primary markers, savings, new-feature badges, active pagination and storefront accents. Light backgrounds use a darker green for readable text and green surfaces with white text use a darker fill token. Error text, invalid fields, unavailable stock, low-stock alerts, cancellation and destructive buttons retain red. Pre-order labels now use green rather than the unavailable-stock colour.

The Add Product button contains one plus icon and no duplicated plus character.

## Product removal

Both administrators and moderators have a visible **Delete** action for active and archived products. It displays a native confirmation popup naming the product and explaining the permanent removal. Cancelling performs no request. Confirming calls `DELETE /api/v1/admin/products/:id/permanent`; the button disables during the request, the product list refreshes and storefront listeners are notified. The existing reversible Archive option is retained separately.

The API enforces the ADMIN/MODERATOR boundary. Customers and unsigned requests cannot delete products. Deletion removes the product and cascading catalogue-image metadata, inventory, cart and wishlist records. Existing order item names, prices, image references and quantities remain; the existing `ON DELETE SET NULL` relationship detaches their product ID. Original local photographs and image-storage files are retained, preserving historical image links. No real product was deleted during validation.

No database schema change or migration is required for this update.

## Invoice review

“Review invoice” in Order Requests now navigates directly to `/admin/invoices/[orderId]`. Order details have a “Review invoice PDF” link to the same workspace. The workspace automatically prepares the reviewed invoice, retrieves its authenticated PDF and displays the PDF viewer. There is no additional prepare step. It retains Open PDF, Download PDF, Refresh invoice and explicit Approve & email controls. Mobile browsers without an embedded PDF viewer can use Open PDF or Download PDF.

Only administrators can review/download/send invoices, preserving the established role split. Existing reviewed-snapshot checks, duplicate-email protection and manual sender-log unlock remain. Browser object URLs are revoked on refresh/unmount. No customer email was sent during validation.

## Collection covers

The supplied nine images were retained. Wide cover frames now use a 16:9 composition with contain sizing, showing the complete original image rather than cropping heads at the top. Portrait katana and square keychain covers have additional responsive frame sizes. The layout change applies to all category/collection detail covers; genuine product images are unchanged. Existing Supabase cover URLs remain valid and no additional external images were needed.

## Validation

- Monorepo build and TypeScript checks passed.
- 224 tests passed: 98 API and 126 frontend; one opt-in database test skipped.
- New API tests verify ADMIN and MODERATOR deletion, customer/unsigned rejection and a readable already-deleted response.
- Isolated Playwright checks verified cancellation sends no deletion, confirmation sends one request, both active and archived products can be deleted by the permitted roles, and Add Product has one plus icon.
- Dashboard savings were verified green and the Delete control remained red.
- Invoice review links opened the PDF workspace automatically; PDF download passed. A valid generated PDF was used in browser fixtures. No real deletion or email was performed.
- All nine covers loaded with contain sizing and no document overflow at 320, 375, 390, 768, 1024 and 1440px. Desktop One Piece and mobile keychain screenshots were visually reviewed.
- New invoice workspace/review and collection/stock components pass targeted lint. Repository-wide lint retains the existing baseline: 16 API errors; 89 frontend errors and 148 warnings.
- Both flattened Hostinger source packages build successfully. ZIP integrity, source matches and credential exclusion were checked.

Evidence is in `output/playwright/nov12/`: `dashboard-green.png`, `invoice-auto-pdf.png`, `collection-uncropped.png` and `keychains-uncropped-mobile.png`.

Upload the new frontend and backend ZIPs to their existing Hostinger apps. Existing environment variables remain required. The agent has not deployed either app to Hostinger.
