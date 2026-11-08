"use client";
import { useStore } from "./StoreProvider";
import { getTotals } from "@/lib/demo-store";
import { products, formatPrice } from "@/lib/config";
export function DemoConfirmation() {
  const { bag } = useStore();
  const { count, subtotal } = getTotals(bag);
  return (
    <div className="preview-panel">
      <h2>Your Selection Summary</h2>
      <p>Items currently reserved in your session.</p>
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
            {count} items · {formatPrice(subtotal)} item total
            <br />
            Cash on Delivery available inside and outside Dhaka.
          </p>
        </>
      ) : (
        <p>Add a figure from our collection to review your bag.</p>
      )}
    </div>
  );
}
