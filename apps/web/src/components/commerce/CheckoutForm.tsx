"use client";
import { registerSocialOrder, channelLink, socialOrderChannels, type SocialOrderChannel } from "@/lib/social-orders";
import { formatWhatsAppOrder } from "@/lib/whatsapp";
import { pricing } from "@/lib/pricing";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Package,
  LoaderCircle,
  AlertCircle,
  MessageCircle,
  Copy,
} from "lucide-react";
import { useStore } from "./StoreProvider";
import { formatPrice } from "@/lib/config";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { Button, ButtonLink, Input } from "../ui/Primitives";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { validate, focusError, type FormErrors } from "@/lib/validation";
import { getAddresses } from "@/lib/commerce-api";
import type { AddressDto } from "@himatu/shared";

const BANGLADESH_DISTRICTS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Gazipur",
  "Narayanganj",
  "Bogra",
  "Cox's Bazar",
  "Jessore",
  "Dinajpur",
  "Other (All 64 Districts)",
];

export function CheckoutForm() {
  const store = useStore();
  const router = useRouter();

  // Session state to auto-fill logged-in customer info
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Form values
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    district: "Dhaka",
    area: "",
    address: "",
    postalCode: "",
    orderNotes: "",
    saveAddress: true,
  });
  const editedFields = useRef(new Set<keyof typeof values>());

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderChannel, setOrderChannel] = useState<SocialOrderChannel>("whatsapp");
  const [confirmation, setConfirmation] = useState<{id:string;channel:SocialOrderChannel;message:string}|null>(null);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load session & saved addresses
  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then(async (data) => {
        if (!active) return;
        if (data?.user) {
          setSession(data);
          setValues((prev) => ({
            ...prev,
            fullName: editedFields.current.has("fullName") ? prev.fullName : data.user.fullName || prev.fullName,
            email: editedFields.current.has("email") ? prev.email : data.user.email || prev.email,
            phone: editedFields.current.has("phone") ? prev.phone : data.user.phone || prev.phone,
          }));

          if (data.accessToken) {
            try {
              const addresses = await getAddresses(data.accessToken);
              if (!active) return;
              setSavedAddresses(addresses);
              const def = addresses.find((a) => a.isDefault) || addresses[0];
              const addressFields = ["fullName", "phone", "district", "area", "address", "postalCode"] as const;
              if (def && !addressFields.some((field) => editedFields.current.has(field))) {
                setSelectedAddressId(def.id);
                setValues((prev) => ({
                  ...prev,
                  fullName: def.recipientName,
                  phone: def.phone,
                  district: def.district,
                  area: def.area,
                  address: def.fullAddress,
                  postalCode: def.postalCode || "",
                }));
              }
            } catch (err) {
              console.error("Failed to load saved addresses:", err);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, []);

  // Items in bag
  const bagEntries = Object.entries(store.bag).filter(
    ([id, quantity]) =>
      quantity > 0 && store.bagProducts.some((p) => p.id === id),
  );

  const cartItems = bagEntries.map(([id, quantity]) => {
    const product = store.bagProducts.find((p) => p.id === id)!;
    return {
      product,
      quantity,
      lineTotal: pricing(product).current * quantity,
    };
  });

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.lineTotal ?? 0),
    0,
  );

  const originalSubtotal = cartItems.reduce((sum, { product, quantity }) => sum + pricing(product).original * quantity, 0);
  const productSavings = originalSubtotal - subtotal;
  const grandTotal = subtotal;

  const handleChange = (key: keyof typeof values, val: string | boolean) => {
    editedFields.current.add(key);
    if (["fullName", "phone", "district", "area", "address", "postalCode"].includes(key)) setSelectedAddressId("new");
    setConfirmation(null);
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSelectSavedAddress = (addr: AddressDto) => {
    for (const field of ["fullName", "phone", "district", "area", "address", "postalCode"] as const) editedFields.current.delete(field);
    setConfirmation(null);
    setSelectedAddressId(addr.id);
    setValues((prev) => ({
      ...prev,
      fullName: addr.recipientName,
      phone: addr.phone,
      district: addr.district,
      area: addr.area,
      address: addr.fullAddress,
      postalCode: addr.postalCode || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (itemCount === 0) return;
    // Read the actual form controls too: browser autofill may not fire React change events.
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const submittedValues = {
      ...values,
      fullName: String(form.get("fullName") ?? values.fullName).trim(),
      email: String(form.get("email") ?? values.email).trim(),
      phone: String(form.get("phone") ?? values.phone).trim(),
      district: String(form.get("district") ?? values.district).trim(),
      area: String(form.get("area") ?? values.area).trim(),
      address: String(form.get("address") ?? values.address).trim(),
      postalCode: String(form.get("postalCode") ?? values.postalCode).trim(),
      orderNotes: String(form.get("orderNotes") ?? values.orderNotes).trim(),
    };

    const validationErrors = validate(
      {
        fullName: submittedValues.fullName,
        email: submittedValues.email,
        phone: submittedValues.phone,
        district: submittedValues.district,
        area: submittedValues.area,
        address: submittedValues.address,
      },
      {
        fullName: { label: "Full name", required: true, max: 120 },
        email: {
          label: "Email address",
          required: true,
          kind: "email",
          max: 254,
        },
        phone: { label: "Phone number", required: true, kind: "phone" },
        district: { label: "District", required: true, max: 100 },
        area: { label: "Area / Thana", required: true, max: 150 },
        address: { label: "Delivery address", required: true, max: 500 },
      },
    );
    if (submittedValues.address.length > 0 && submittedValues.address.length < 5) {
      validationErrors.address = "Enter a complete delivery address (at least 5 characters).";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusError(validationErrors);
      return;
    }

    if (!sessionReady) {
      setServerError("Your account is still loading. Please try again in a moment.");
      return;
    }
    if (!session?.accessToken) {
      router.push("/sign-in?next=%2Fcheckout");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    const chat = window.open("about:blank", "_blank");
    if (chat) chat.opener = null;
    try {
      const request = await registerSocialOrder(session.accessToken, {
        channel: orderChannel,
        customer: {
          fullName: submittedValues.fullName,
          email: submittedValues.email,
          phone: submittedValues.phone,
          address: submittedValues.address,
          area: submittedValues.area,
          district: submittedValues.district,
          postalCode: submittedValues.postalCode,
          orderNotes: submittedValues.orderNotes,
        },
        items: cartItems.map(({ product, quantity }) => ({
          productId: product.databaseId || null,
          slug: product.id,
          name: product.name,
          quantity,
          unitPrice: pricing(product).current,
          originalUnitPrice: pricing(product).original,
        })),
      });
      const message = `Request reference: ${request.id}\n` + formatWhatsAppOrder({
        customer: submittedValues,
        items: cartItems.map(({product,quantity}) => ({name:product.name,character:product.character,quantity,unitPrice:pricing(product).current,slug:product.id})),
        subtotal:originalSubtotal,discount:productSavings,discountLabel:"Product discount",shipping:0,shippingPending:true,total:grandTotal,origin:window.location.origin,
      });
      setConfirmation({id:request.id,channel:orderChannel,message});
      setCopied(false);
      // Only hand off customer details once the request has been saved.
      try { if (chat && !chat.closed) chat.location.href = channelLink(orderChannel, message); } catch { /* The saved request can be reopened below if the window was closed. */ }
      if (orderChannel !== "whatsapp") {
        try { await navigator.clipboard.writeText(message); setCopied(true); } catch { /* A visible copy fallback remains available. */ }
      }
    } catch (error) {
      chat?.close();
      setServerError(
        error instanceof Error
          ? error.message
          : "Your order could not be placed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="checkout-empty-state">
        <Package size={48} className="checkout-empty-icon" />
        <h2>YOUR COLLECTOR BAG IS EMPTY.</h2>
        <p>
          Add Japanese scale figures, statues, or collectibles to proceed to
          checkout.
        </p>
        <ButtonLink href="/shop">EXPLORE FIGURES</ButtonLink>
      </div>
    );
  }

  return (
    <div className="onepage-checkout-container">
      {serverError && (
        <div className="checkout-server-error">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      {/* LEFT COLUMN: All Checkout Steps on One Cohesive Page */}
      <form
        noValidate
        className="onepage-checkout-main"
        onSubmit={handleSubmit}
      >
        {/* SECTION 1: Customer Contact Information */}
        <section className="checkout-card" aria-labelledby="contact-heading">
          <div className="checkout-card-header">
            <div className="step-number">1</div>
            <div>
              <h2 id="contact-heading">CONTACT INFORMATION</h2>
              <p className="card-subtext">
                Your contact details will be included in your order request.
              </p>
            </div>
          </div>

          {session && (
            <div className="checkout-member-pill">
              <CheckCircle2 size={16} className="text-accent" />
              <span>
                Ordering as <strong>{session.user.fullName || "Member"}</strong>{" "}
                ({session.user.email})
              </span>
            </div>
          )}

          <div className="checkout-fields-grid">
            <Input
              id="fullName"
              name="fullName"
              label="Full name"
              required
              maxLength={120}
              value={values.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              error={errors.fullName}
              disabled={submitting}
            />

            <Input
              id="email"
              name="email"
              label="Email address"
              type="email"
              inputMode="email"
              required
              maxLength={254}
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              disabled={submitting}
            />

            <div className="checkout-full-width">
              <Input
                id="phone"
                name="phone"
                label="Phone number (Bangladeshi mobile)"
                type="tel"
                inputMode="tel"
                required
                maxLength={20}
                placeholder="e.g. 01712345678"
                value={values.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={errors.phone}
                disabled={submitting}
              />
              <span className="field-subtext">
                Courier rider will call this number prior to parcel handover.
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: Shipping Destination */}
        <section
          className="checkout-card"
          aria-labelledby="shipping-address-heading"
        >
          <div className="checkout-card-header">
            <div className="step-number">2</div>
            <div>
              <h2 id="shipping-address-heading">DELIVERY ADDRESS</h2>
              <p className="card-subtext">
                Direct doorstep dispatch across all 64 districts of Bangladesh.
              </p>
            </div>
          </div>

          {savedAddresses.length > 0 && (
            <div className="saved-addresses-selector">
              <p className="field-subtext">Select from your saved addresses:</p>
              <div className="saved-address-cards-row">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`saved-addr-card ${selectedAddressId === addr.id ? "selected" : ""}`}
                  >
                    <div className="saved-addr-top">
                      <strong>{addr.label || "Address"}</strong>
                      {addr.isDefault && (
                        <span className="default-tag">DEFAULT</span>
                      )}
                    </div>
                    <p className="saved-addr-text">
                      {addr.recipientName} · {addr.phone}
                      <br />
                      {addr.fullAddress}, {addr.area}, {addr.district}
                    </p>
                  </button>
                ))}
                <Link
                  href="/account?tab=addresses&add=1&returnTo=checkout"
                  className="saved-addr-card"
                >
                  <div className="saved-addr-top">
                    <strong>+ New Address</strong>
                  </div>
                  <p className="saved-addr-text">
                    Manage your delivery address in your profile
                  </p>
                </Link>
              </div>
            </div>
          )}

          {!savedAddresses.length && (
            <Link
              className="checkout-address-link"
              href="/account?tab=addresses&add=1&returnTo=checkout"
            >
              + New address in your profile <ArrowUpRight size={16} />
            </Link>
          )}
          <div className="checkout-fields-grid">
            <div className="field">
              <label htmlFor="district">District *</label>
              <select
                id="district"
                name="district"
                value={values.district}
                onChange={(e) => handleChange("district", e.target.value)}
                className="checkout-select"
                disabled={submitting}
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="area"
              name="area"
              label="Area / Thana / Upazila"
              required
              maxLength={150}
              placeholder="e.g. Dhanmondi, Banani, Mirpur 10"
              value={values.area}
              onChange={(e) => handleChange("area", e.target.value)}
              error={errors.area}
              disabled={submitting}
            />

            <div className="checkout-full-width">
              <Input
                id="address"
                name="address"
                label="Full Street & House Address"
                required
                maxLength={500}
                placeholder="House #, Road #, Sector / Block, Apartment info"
                value={values.address}
                onChange={(e) => handleChange("address", e.target.value)}
                error={errors.address}
                disabled={submitting}
              />
            </div>

            <Input
              id="postalCode"
              name="postalCode"
              label="Postal Code (Optional)"
              maxLength={20}
              placeholder="e.g. 1205"
              value={values.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              disabled={submitting}
            />

            <div className="checkout-full-width">
              <div className="field">
                <label htmlFor="orderNotes">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  id="orderNotes"
                  name="orderNotes"
                  rows={2}
                  maxLength={1000}
                  className="checkout-textarea"
                  placeholder="e.g. Call before delivery or leave with building security..."
                  value={values.orderNotes}
                  onChange={(e) => handleChange("orderNotes", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="checkout-card checkout-channel" aria-labelledby="order-channel-heading">
          <h2 id="order-channel-heading">HOW WOULD YOU LIKE TO ORDER?</h2>
          <div className="checkout-channel-options">
            {socialOrderChannels.map(channel => <label key={channel.id} className={`option-card ${orderChannel === channel.id ? "selected" : ""}`}>
              <input type="radio" name="orderChannel" value={channel.id} checked={orderChannel === channel.id} disabled={submitting} onChange={() => {setOrderChannel(channel.id);setConfirmation(null);setServerError(null);}} />
              <span><strong>{channel.name}</strong><small>{channel.id === "whatsapp" ? "Open with your order message ready to send." : channel.id === "tiktok" ? "Open HIMATU’s profile, tap Message, then paste your order details." : "Open the conversation, then paste your copied order details."}</small></span>
            </label>)}
          </div>
        </section>
        {confirmation && (
          <section className="checkout-card order-confirmation" role="status" tabIndex={-1}>
            <CheckCircle2 size={32} aria-hidden="true" />
            <h2>YOUR ORDER REQUEST IS RECEIVED.</h2>
            <p>{confirmation.channel === "whatsapp" ? "Your message is ready in WhatsApp. Tap Send to continue with HIMATU." : copied ? confirmation.channel === "tiktok" ? "Your details are copied. Tap Message on HIMATU’s TikTok profile, then paste and send your order." : `Your details are copied. Paste them into your ${socialOrderChannels.find(channel => channel.id === confirmation.channel)?.name} conversation and tap Send.` : "Copy your order details below and paste them into the conversation to continue with HIMATU."}</p>
            <p className="order-reference">Reference: {confirmation.id}</p>
            <div className="social-draft-actions">
              <a className="button button--outline" href={channelLink(confirmation.channel,confirmation.message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>OPEN {confirmation.channel.toUpperCase()}</a>
              <button type="button" className="button button--outline" onClick={async()=>{try{await navigator.clipboard.writeText(confirmation.message);setCopied(true);}catch{setCopied(false);}}}><Copy size={16}/>{copied?"DETAILS COPIED":"COPY ORDER DETAILS"}</button>
            </div>
            <details><summary>View order message</summary><textarea className="social-order-message" aria-label="Complete order message" rows={12} readOnly value={confirmation.message} onFocus={event=>event.currentTarget.select()}/></details>
          </section>
        )}
        {/* Submit Action */}
        <div className="checkout-submit-block">
          <Button
            type="submit"
            disabled={!sessionReady || submitting || !!confirmation}
            className="button button-primary button-lg checkout-btn"
          >
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                <span>CONFIRMING COLLECTIBLE ORDER...</span>
              </>
            ) : (
              <>
                <span>{confirmation ? "ORDER RECEIVED" : `ORDER VIA ${orderChannel.toUpperCase()}`} · ৳{grandTotal.toLocaleString()} BDT</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* RIGHT COLUMN: Sticky Order Summary Sidebar */}
      <aside className="onepage-checkout-sidebar" aria-label="Order summary">
        <div className="sticky-summary-card">
          <div className="summary-header">
            <h3>ORDER SUMMARY</h3>
            <span className="summary-badge">{itemCount} ITEMS</span>
          </div>

          {/* Product Items List */}
          <div className="summary-items-scroll">
            {cartItems.map(({ product: p, quantity, lineTotal }) => (
              <div key={p.id} className="summary-product-item">
                <div className="summary-thumbnail-wrap">
                  <AssetImage
                    asset={assets.product(p)}
                    className="summary-thumbnail"
                  />
                  <span className="summary-quantity-pill">{quantity}</span>
                </div>
                <div className="summary-product-meta">
                  <h4 className="summary-product-name">{p.name}</h4>
                  <p className="summary-product-franchise">{p.franchise}</p>
                </div>
                <span className="summary-product-price">
                  {formatPrice(lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-divider" />

          {/* Financial Breakdown */}
          <div className="summary-totals-list">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{formatPrice(originalSubtotal)}</span>
            </div>

            {productSavings > 0 && (
              <div className="summary-line discount-line">
                <span className="discount-label">
                  Product discount
                </span>
                <span>-{formatPrice(productSavings)}</span>
              </div>
            )}

            <div className="summary-line">
              <span>Delivery</span>
              <span>Confirmed before dispatch</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line grand-total-line">
              <span>Total</span>
              <div className="grand-total-stack">
                <span className="grand-total-amount">
                  ৳{grandTotal.toLocaleString()}
                </span>
                <span className="grand-total-currency">BDT</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
}
