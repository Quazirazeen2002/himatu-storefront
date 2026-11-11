"use client";
import {
  registerSocialOrder,
  channelLink,
  socialOrderChannels,
  type SocialOrderChannel,
} from "@/lib/social-orders";
import { VideoSocialLinks } from "../layout/VideoSocialLinks";
import { pricing } from "@/lib/pricing";
import { formatWhatsAppOrder } from "@/lib/whatsapp";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Lock,
  CheckCircle2,
  Package,
  LoaderCircle,
  Sparkles,
  MessageCircle,
  Instagram,
  ArrowUpRight,
  Copy,
  AlertCircle,
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [, setFreeShippingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderChannel, setOrderChannel] =
    useState<SocialOrderChannel>("whatsapp");
  const [socialDraft, setSocialDraft] = useState<{
    channel: SocialOrderChannel;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load session & saved addresses
  useEffect(() => {
    authService
      .getSession()
      .then(async (data) => {
        if (data?.user) {
          setSession(data);
          setValues((prev) => ({
            ...prev,
            fullName: prev.fullName || data.user.fullName || "",
            email: prev.email || data.user.email || "",
            phone: prev.phone || data.user.phone || "",
          }));

          if (data.accessToken) {
            try {
              const addresses = await getAddresses(data.accessToken);
              setSavedAddresses(addresses);
              const def = addresses.find((a) => a.isDefault) || addresses[0];
              if (def) {
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
      .catch(() => {});
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

  const shippingPrice = 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);

  const handleChange = (key: keyof typeof values, val: string | boolean) => {
    setSocialDraft(null);
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSelectSavedAddress = (addr: AddressDto) => {
    setSocialDraft(null);
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

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setSocialDraft(null);
    const clean = promoCode.trim().toUpperCase();
    setFreeShippingPromo(clean === "FREESHIP");
    if (clean === "HIMATU10" || clean === "BANKAI" || clean === "ANIME") {
      setDiscountPercent(10);
      setPromoMessage("Promo code applied: 10% collector discount active!");
    } else if (clean === "FREESHIP") {
      setDiscountPercent(0);
      setPromoMessage("Free shipping promo applied!");
    } else if (!clean) {
      setPromoMessage("");
      setDiscountPercent(0);
    } else {
      setPromoMessage("Invalid code. Try HIMATU10 for 10% off your order.");
      setDiscountPercent(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (itemCount === 0) return;

    const validationErrors = validate(
      {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        district: values.district,
        area: values.area,
        address: values.address,
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

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusError(validationErrors);
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
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          area: values.area,
          district: values.district,
          postalCode: values.postalCode,
          orderNotes: values.orderNotes,
        },
        items: cartItems.map(({ product, quantity }) => ({
          productId: product.databaseId || null,
          slug: product.id,
          name: product.name,
          quantity,
          unitPrice: pricing(product).current,
        })),
      });
      const message =
        `Request reference: ${request.id}\n` +
        formatWhatsAppOrder({
          customer: values,
          items: cartItems.map(({ product, quantity }) => ({
            name: product.name,
            character: product.character,
            quantity,
            unitPrice: pricing(product).current,
            slug: product.id,
          })),
          subtotal,
          discount: discountAmount,
          shipping: 0,
          shippingPending: true,
          total: Math.max(0, subtotal - discountAmount),
          origin: window.location.origin,
        });
      setSocialDraft({ channel: orderChannel, message });
      setCopied(false);
      if (orderChannel !== "whatsapp") {
        try {
          await navigator.clipboard.writeText(message);
          setCopied(true);
        } catch {}
      }
      if (chat) chat.location.href = channelLink(orderChannel, message);
    } catch (error) {
      chat?.close();
      setServerError(
        error instanceof Error
          ? error.message
          : "Your order could not be registered. Please try again. Chat has not been opened.",
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
        {/* Security & Reassurance Header Banner */}
        <div className="checkout-reassurance-strip">
          <div className="reassurance-item">
            <Lock size={15} />
            <span>Review your order details</span>
          </div>
          <div className="reassurance-item">
            <ShieldCheck size={15} />
            <span>Confirm edition and availability</span>
          </div>
          <div className="reassurance-item">
            <Truck size={15} />
            <span>Delivery arranged with HIMATU</span>
          </div>
        </div>

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

        <section
          className="checkout-card checkout-channel"
          aria-labelledby="order-channel-heading"
        >
          <h2 id="order-channel-heading">HOW WOULD YOU LIKE TO ORDER?</h2>
          {socialOrderChannels.map((channel) => (
            <label
              key={channel.id}
              className={`option-card ${orderChannel === channel.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="orderChannel"
                disabled={submitting}
                checked={orderChannel === channel.id}
                onChange={() => {
                  setOrderChannel(channel.id);
                  setSocialDraft(null);
                }}
              />
              <MessageCircle size={20} />
              <span>
                <strong>{channel.name} order</strong>
                <small>
                  {channel.id === "whatsapp"
                    ? "Open WhatsApp with your order message ready to send."
                    : `Open ${channel.name} automatically. Your order details are copied for you to paste and send.`}
                </small>
              </span>
            </label>
          ))}
        </section>
        <section
          className="checkout-card"
          aria-labelledby="checkout-social-heading"
        >
          <h2 id="checkout-social-heading">FOLLOW THE COLLECTION.</h2>
          <div className="footer-socials checkout-video-socials">
            <VideoSocialLinks />
          </div>
        </section>
        {socialDraft && (
          <section
            className="checkout-card whatsapp-draft"
            aria-label={`${socialDraft.channel} order message`}
            role="status"
          >
            <h2>ORDER REQUEST RECEIVED.</h2>
            <p>
              Your order request has been received.{" "}
              {socialDraft.channel === "whatsapp"
                ? "Your message is ready in WhatsApp. Tap Send to continue with HIMATU."
                : copied
                  ? `Your details have been copied. Paste them into your ${socialDraft.channel} conversation and tap Send.`
                  : `Open ${socialDraft.channel}, then copy and paste the order details below to continue with HIMATU.`}
            </p>
            <details>
              <summary>Order message and contact link</summary>
              <textarea
                className="social-order-message"
                aria-label="Complete order message"
                readOnly
                value={socialDraft.message}
                rows={12}
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="social-draft-actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(socialDraft.message);
                      setCopied(true);
                    } catch {
                      setCopied(false);
                      setServerError(
                        "Select and copy the order message above, then paste it into the chat.",
                      );
                    }
                  }}
                >
                  <Copy size={15} />
                  {copied ? "DETAILS COPIED" : "COPY DETAILS"}
                </button>
                <a
                  className="button button--outline"
                  href={channelLink(socialDraft.channel, socialDraft.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {socialDraft.channel === "instagram" ? (
                    <Instagram size={16} />
                  ) : (
                    <MessageCircle size={16} />
                  )}{" "}
                  OPEN {socialDraft.channel.toUpperCase()}
                </a>
              </div>
            </details>
          </section>
        )}
        {/* Submit Action */}
        <div className="checkout-submit-block">
          <Button
            type="submit"
            disabled={submitting}
            className="button button-primary button-lg checkout-btn"
          >
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                <span>CONFIRMING COLLECTIBLE ORDER...</span>
              </>
            ) : (
              <>
                {orderChannel === "instagram" ? (
                  <Instagram size={19} />
                ) : (
                  <MessageCircle size={19} />
                )}
                <span>
                  {`ORDER VIA ${orderChannel.toUpperCase()}`} · ৳
                  {grandTotal.toLocaleString()} BDT
                </span>
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

          {/* Promo Code Input */}
          <form onSubmit={handleApplyPromo} className="promo-input-row">
            <input
              type="text"
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="promo-input"
              disabled={submitting}
            />
            <button type="submit" className="promo-button">
              APPLY
            </button>
          </form>

          {promoMessage && (
            <p
              className={`promo-message ${
                discountPercent > 0 || promoCode.toUpperCase() === "FREESHIP"
                  ? "success"
                  : "error"
              }`}
            >
              {promoMessage}
            </p>
          )}

          <div className="summary-divider" />

          {/* Financial Breakdown */}
          <div className="summary-totals-list">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {discountPercent > 0 && (
              <div className="summary-line discount-line">
                <span className="discount-label">
                  <Sparkles size={13} /> Collector Discount ({discountPercent}%)
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="summary-line">
              <span>Delivery</span>
              <span>Arranged in chat</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line grand-total-line">
              <span>Items estimate</span>
              <div className="grand-total-stack">
                <span className="grand-total-amount">
                  ৳{grandTotal.toLocaleString()}
                </span>
                <span className="grand-total-currency">BDT</span>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="summary-guarantees">
            <div className="guarantee-row">
              <ShieldCheck size={16} />
              <span>Confirm packaging and edition with HIMATU</span>
            </div>
            <div className="guarantee-row">
              <Truck size={16} />
              <span>Delivery details confirmed before dispatch</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
