"use client";
import { useStore } from "./StoreProvider";
import { getTotals } from "@/lib/demo-store";
import { products, formatPrice } from "@/lib/config";
export function DemoConfirmation() {
  const { bag } = useStore();
  const { count, subtotal } = getTotals(bag);
  return (
    <div className="preview-panel">
      <h2>Your demo selection</h2>
      <p>No order number, payment or delivery booking was created.</p>
      {count > 0 ? (
        <>
          {products
            .filter((p) => bag[p.id])
            .map((p) => (
              <div className="summary-line" key={p.id}>
                <span>
                  {p.name} × {bag[p.id]}
                </span>
                <strong>{formatPrice(p.price * bag[p.id])}</strong>
              </div>
            ))}
          <p>
            {count} demo items · {formatPrice(subtotal)} item total
            <br />
            Delivery excluded. Your demo bag has been kept.
          </p>
        </>
      ) : (
        <p>Add a sample figure to explore the checkout review flow.</p>
      )}
    </div>
  );
}
