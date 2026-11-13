"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { InvoiceReview } from "./InvoiceReview";
import { getAllAdminProducts, commerceRequest } from "@/lib/commerce-api";
import type {
  ConfirmSocialOrderInput,
  SocialRequestInput,
  ProductDto,
} from "@himatu/shared";
type RequestRow = {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  customer: SocialRequestInput["customer"];
  items: SocialRequestInput["items"];
  orderId: string | null;
  order?: { orderNumber: string; totalAmount: number };
};
const emptyCustomer = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  area: "",
  district: "Dhaka",
  postalCode: "",
  orderNotes: "",
};
const blank = (): ConfirmSocialOrderInput => ({
  customer: { ...emptyCustomer },
  items: [
    { name: "", slug: "manual", quantity: 1, unitPrice: 0, productId: null },
  ],
  shippingCharge: 0,
  discountAmount: 0,
  paid: false,
});
export function SocialOrderManagement() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [manualReference, setManualReference] = useState("");
  const [session, setSession] = useState<CustomerSession | null>(null),
    [rows, setRows] = useState<RequestRow[]>([]),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [active, setActive] = useState<RequestRow | null>(null),
    [manual, setManual] = useState(false),
    [draft, setDraft] = useState(blank),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmed, setConfirmed] = useState<{
      id: string;
      orderNumber: string;
    } | null>(null);
  const load = async (token: string, p = page) => {
    const data = await commerceRequest<{
      items: RequestRow[];
      totalPages: number;
    }>(`/admin/social-orders?page=${p}`, { token });
    setRows(data.items);
    setPages(data.totalPages);
  };
  useEffect(() => {
    authService
      .getSession()
      .then(async (s) => {
        setSession(s);
        if (s?.accessToken) {
          await load(s.accessToken, page);
          setProducts(await getAllAdminProducts(s.accessToken));
        }
      })
      .catch((e) => setError(e.message));
  }, [page]);
  const open = (r: RequestRow) => {
    setActive(r);
    setManual(false);
    setDraft({
      customer: r.customer,
      items: r.items,
      shippingCharge: 0,
      discountAmount: 0,
      paid: false,
    });
    setConfirmed(null);
    setError("");
  };
  const save = async () => {
    if (!session?.accessToken || busy) return;
    setBusy(true);
    setError("");
    try {
      const order = await commerceRequest<{ id: string; orderNumber: string }>(
        manual
          ? "/admin/social-orders/manual"
          : `/admin/social-orders/${active!.id}/confirm`,
        {
          method: "POST",
          token: session.accessToken,
          body: JSON.stringify({
            ...draft,
            ...(manual
              ? { clientReference: manualReference, channel: "manual" }
              : {}),
          }),
        },
      );
      setConfirmed(order);
      setActive(null);
      setManual(false);
      await load(session.accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enroll order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="social-admin">
      <div className="admin-page-header">
        <div>
          <h1>Order requests</h1>
          <p>
            Review website and social requests, confirm prices and arrange delivery.
          </p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setManualReference(crypto.randomUUID());
            setManual(true);
            setActive(null);
            setDraft(blank());
            setConfirmed(null);
            setError("");
          }}
        >
          Enroll chat order
        </button>
      </div>
      {error && (
        <p role="alert" className="staff-error">
          {error}
        </p>
      )}
      {(active || manual) && (
        <section className="admin-card">
          <h2>{manual ? "Enroll a confirmed chat order" : "Review request"}</h2>
          <p>
            Use the customer’s registered email. Prices below become the final
            order prices.
          </p>
          <div className="staff-form-grid">
            {Object.entries(draft.customer).map(([key, value]) => (
              <label className="field" key={key}>
                <span>{key.replace(/([A-Z])/g, " $1")}</span>
                <input
                  value={value}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      customer: { ...draft.customer, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <h3>Order items</h3>
          {draft.items.map((item, i) => (
            <div className="staff-line" key={i}>
              <label className="field">
                <span>Product</span>
                <select
                  aria-label={`Catalogue item ${i + 1}`}
                  value={item.productId || ""}
                  onChange={(e) => {
                    const chosen = products.find(
                      (p) => p.id === e.target.value,
                    );
                    setDraft({
                      ...draft,
                      items: draft.items.map((x, j) =>
                        j === i
                          ? chosen
                            ? {
                                ...x,
                                productId: chosen.id,
                                slug: chosen.slug,
                                name: chosen.name,
                                unitPrice: chosen.salePrice || chosen.price,
                                originalUnitPrice: chosen.price,
                              }
                            : { ...x, productId: null }
                          : x,
                      ),
                    });
                  }}
                >
                  <option value="">Custom / reference item</option>
                  {products
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <input
                  aria-label={`Product name ${i + 1}`}
                  value={item.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      items: draft.items.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      items: draft.items.map((x, j) =>
                        j === i
                          ? { ...x, quantity: Number(e.target.value) }
                          : x,
                      ),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Unit price · BDT</span>
                <input
                  type="number"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      items: draft.items.map((x, j) =>
                        j === i
                          ? { ...x, unitPrice: Number(e.target.value) }
                          : x,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() =>
                  setDraft({
                    ...draft,
                    items: draft.items.filter((_, j) => j !== i),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="admin-btn admin-btn--secondary"
            onClick={() =>
              setDraft({
                ...draft,
                items: [
                  ...draft.items,
                  {
                    name: "",
                    slug: "manual",
                    quantity: 1,
                    unitPrice: 0,
                    productId: null,
                  },
                ],
              })
            }
          >
            Add item
          </button>
          <div className="staff-form-grid">
            <div className="admin-order-savings"><strong>Product savings</strong><span>BDT {draft.items.reduce((sum,item) => sum + Math.max(0, (item.originalUnitPrice ?? item.unitPrice) - item.unitPrice) * item.quantity, 0).toLocaleString()}</span></div>
            {(["shippingCharge", "discountAmount"] as const).map((key) => (
              <label className="field" key={key}>
                <span>
                  {key === "shippingCharge" ? "Delivery charge" : "Discount"} ·
                  BDT
                </span>
                <input
                  type="number"
                  min="0"
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          {session?.user.role === "ADMIN" && (
            <label>
              <input
                type="checkbox"
                checked={draft.paid}
                onChange={(e) => setDraft({ ...draft, paid: e.target.checked })}
              />{" "}
              Payment has been received
            </label>
          )}
          <p>
            <strong>
              Total: BDT{" "}
              {draft.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0) +
                draft.shippingCharge -
                draft.discountAmount}
            </strong>
          </p>
          <div className="staff-actions">
            <button
              className="admin-btn admin-btn--primary"
              disabled={busy}
              onClick={save}
            >
              Confirm details & enroll order
            </button>
            <button
              className="admin-btn admin-btn--secondary"
              onClick={() => {
                setActive(null);
                setManual(false);
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
      {confirmed && (
        <section className="admin-card">
          <h2>Enrolled · {confirmed.orderNumber}</h2>
          <p>
            The confirmed order now appears in Orders and analytics. Unpaid
            totals remain pending revenue.
          </p>
        </section>
      )}
      {confirmed && session?.user.role === "ADMIN" && session.accessToken && (
        <InvoiceReview
          key={confirmed.id}
          orderId={confirmed.id}
          token={session.accessToken}
        />
      )}

      {rows.map((r) => (
        <article className="admin-card" key={r.id}>
          <div className="staff-actions">
            <strong>
              {r.customer.fullName} · {r.channel.toUpperCase()}
            </strong>
            <span>{r.status}</span>
            <time>{new Date(r.createdAt).toLocaleString()}</time>
          </div>
          <p>
            {r.customer.phone} · {r.customer.email}
          </p>
          <p>{r.items.map((i) => `${i.quantity} × ${i.name}`).join(" · ")}</p>
          <small>Request {r.id}</small>
          <div className="staff-actions">
            {r.status === "PENDING" && (
              <>
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={() => open(r)}
                >
                  Review & enroll
                </button>
                <button
                  className="admin-btn admin-btn--secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (!session?.accessToken) return;
                    try {
                      await commerceRequest(
                        `/admin/social-orders/${r.id}/dismiss`,
                        { method: "POST", token: session.accessToken },
                      );
                      await load(session.accessToken);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Dismiss failed",
                      );
                    }
                  }}
                >
                  Dismiss request
                </button>
              </>
            )}
            {r.order && (
              <span>
                {r.order.orderNumber} · BDT {r.order.totalAmount}
              </span>
            )}
            {r.orderId && session?.user.role === "ADMIN" && (
              <Link className="admin-btn admin-btn--secondary" href={`/admin/invoices/${encodeURIComponent(r.orderId!)}`}>Review invoice</Link>
            )}
          </div>
        </article>
      ))}
      {!rows.length && <p>No order requests yet.</p>}
      <div className="staff-actions">
        <button
          className="admin-btn admin-btn--secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          {page} / {pages}
        </span>
        <button
          className="admin-btn admin-btn--secondary"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
        <button
          className="admin-btn admin-btn--secondary"
          onClick={() =>
            session?.accessToken &&
            load(session.accessToken).catch((e) => setError(e.message))
          }
        >
          Refresh requests
        </button>
      </div>
    </div>
  );
}
