# HIMATU Business Intelligence Center — Metric Definitions & Calculations
## Stage 3 Step 2D.1: Financial, Operational & Catalogue Mathematics

---

## 1. Financial Metrics

### 1.1 Gross Order Value (GOV)
- **Definition**: The gross financial commitment of all customer orders placed during the reporting period, excluding orders that have been cancelled.
- **SQL Logic**:
  ```sql
  SELECT SUM("totalAmount") FROM "Order"
  WHERE "createdAt" >= :start AND "createdAt" <= :end
    AND "orderStatus" != 'CANCELLED';
  ```
- **Currency**: Bangladeshi Taka (৳ BDT).

### 1.2 Collected Revenue
- **Definition**: Confirmed collected funds that have settled into HIMATU accounts. Includes orders with `paymentStatus = 'PAID'` and orders with `orderStatus = 'DELIVERED'` (representing completed cash collection by courier partners).
- **Policy**: Never blends pending Cash on Delivery orders into collected revenue.
- **SQL Logic**:
  ```sql
  SELECT SUM("totalAmount") FROM "Order"
  WHERE "createdAt" >= :start AND "createdAt" <= :end
    AND "orderStatus" != 'CANCELLED'
    AND ("paymentStatus" = 'PAID' OR "orderStatus" = 'DELIVERED');
  ```

### 1.3 Pending Cash on Delivery (COD) Amount
- **Definition**: Financial commitments on open shipments awaiting doorstep courier delivery and cash collection.
- **Formula**:
  $$\text{Pending COD} = \sum_{\text{open orders}} \text{totalAmount}$$
  where `paymentMethod = 'COD'`, `paymentStatus != 'PAID'`, and `orderStatus != 'DELIVERED'`.

### 1.4 Average Order Value (AOV)
- **Definition**: Average gross spend per valid non-cancelled customer order.
- **Formula**:
  $$\text{AOV} = \frac{\text{Gross Order Value}}{\text{Valid Non-Cancelled Orders Count}}$$

---

## 2. Anime Collection Metrics

- **Universe Allocation**: Derived by joining `OrderItem` $\rightarrow$ `Product` $\rightarrow$ `Category`.
- **Categories Tracked**: `One Piece`, `Naruto`, `Dragon Ball`, `Jujutsu Kaisen`, `Demon Slayer`, `Other Anime`.
- **Units Sold**: $\sum \text{quantity}$ across line items belonging to the universe.
- **Realized Revenue**: $\sum \text{lineTotal}$ from authentic purchase records.
- **Universe Share (%)**:
  $$\text{Share} = \frac{\text{Collection Revenue}}{\text{Total Catalogue Revenue}} \times 100$$

---

## 3. Inventory Health Classifications

Inventory states are deterministically evaluated:
- **In Stock (Healthy)**: $\text{Quantity} > 5$ units.
- **Low Stock (Warning)**: $1 \le \text{Quantity} \le 5$ units.
- **Out of Stock (Depleted)**: $\text{Quantity} = 0$ units.
- **Available vs. Reserved**:
  - `Available Units` represents unencumbered inventory on the showroom floor.
  - `Reserved Units` represents items held in active customer orders undergoing courier packaging.

---

## 4. Order Lifecycle & Fulfilment Rates

Stages tracked:
1. `PENDING`: Placed by customer, awaiting store owner review.
2. `CONFIRMED`: Verified with customer (phone confirmation for COD).
3. `PROCESSING`: Figurine picked from warehouse, packaged with protective bubble wrap.
4. `SHIPPED`: Handed over to courier (Pathao / Steadfast) in active transit.
5. `DELIVERED`: Handed to collector; payment settled.
6. `CANCELLED`: Order aborted; inventory automatically restored to physical count.

### Cancellation Rate
$$\text{Cancellation Rate} = \frac{\text{Cancelled Orders}}{\text{Total Placed Orders}} \times 100$$

---

## 5. Collector & Geographic Insights

- **Paying Customers**: Distinct count of `userId` in non-cancelled `Order` records.
- **Repeat Purchase Rate**: Percentage of paying collectors with more than 1 completed order.
- **Geographic Breakdown**: Aggregated counts and revenue extracted from `Order.addressSnapshot -> district`. Exact street addresses, names, and phone numbers are strictly scrubbed to guarantee consumer privacy.

