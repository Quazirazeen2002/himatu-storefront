"use client";
import { pricing } from "@/lib/pricing";
import { formatWhatsAppOrder, whatsappLink } from "@/lib/whatsapp";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Wallet,
  Lock,
  CheckCircle2,
  Package,
  LoaderCircle,
  Clock,
  Sparkles,
  MessageCircle,
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
import {
  getAddresses,
  createAddress,
  getProducts,
  addCartItem,
  createOrder,
  initiatePayment,
} from "@/lib/commerce-api";
import type { AddressDto } from "@himatu/shared";

interface ShippingMethod {
  id: "dhaka-express" | "nationwide-standard" | "vault-pickup";
  title: string;
  price: number;
  time: string;
  description: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "dhaka-express",
    title: "Inside Dhaka Express Courier",
    price: 80,
    time: "1–2 Business Days",
    description: "Estimated local delivery. Confirm the final charge and service with HIMATU.",
  },
  {
    id: "nationwide-standard",
    title: "Outside Dhaka Standard Courier",
    price: 130,
    time: "2–4 Business Days",
    description: "Estimated delivery outside Dhaka. Confirm service coverage with HIMATU.",
  },
  {
    id: "vault-pickup",
    title: "Pickup enquiry",
    price: 0,
    time: "Arrange with HIMATU",
    description: "Ask our team whether pickup is available and confirm the location.",
  },
];

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
    shippingMethod: "dhaka-express" as ShippingMethod["id"],
    paymentMethod: "BKASH" as "COD" | "BKASH" | "SSLCOMMERZ",
    orderNotes: "",
    saveAddress: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [freeShippingPromo, setFreeShippingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderChannel, setOrderChannel] = useState<"whatsapp" | "website">("whatsapp");
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const lastWhatsAppOpen = useRef(0);
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
                  shippingMethod:
                    def.district.toLowerCase() === "dhaka"
                      ? "dhaka-express"
                      : "nationwide-standard",
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
    ([id, quantity]) => quantity > 0 && store.pricedProducts.some((p) => p.id === id),
  );

  const cartItems = bagEntries.map(([id, quantity]) => {
    const product = store.pricedProducts.find((p) => p.id === id)!;
    return {
      product,
      quantity,
      lineTotal: pricing(product).current * quantity,
    };
  });

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const isFreeShipping = subtotal >= 15000 || freeShippingPromo;
  const selectedShipping =
    SHIPPING_METHODS.find((m) => m.id === values.shippingMethod) ||
    SHIPPING_METHODS[0];

  const shippingPrice = isFreeShipping ? 0 : selectedShipping.price;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);

  const handleChange = (key: keyof typeof values, val: string | boolean) => {
    setWhatsappDraft("");
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      // Auto-adjust shipping method when district changes
      if (key === "district") {
        const isDhaka = String(val).toLowerCase() === "dhaka";
        if (prev.shippingMethod !== "vault-pickup") {
          next.shippingMethod = isDhaka ? "dhaka-express" : "nationwide-standard";
        }
      }
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSelectSavedAddress = (addr: AddressDto) => {
    setWhatsappDraft("");
    setSelectedAddressId(addr.id);
    setValues((prev) => ({
      ...prev,
      fullName: addr.recipientName,
      phone: addr.phone,
      district: addr.district,
      area: addr.area,
      address: addr.fullAddress,
      postalCode: addr.postalCode || "",
      shippingMethod:
        addr.district.toLowerCase() === "dhaka"
          ? "dhaka-express"
          : "nationwide-standard",
    }));
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappDraft("");
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
        email: { label: "Email address", required: true, kind: "email", max: 254 },
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

    if (orderChannel === "whatsapp") {
      const now = Date.now();
      if (now - lastWhatsAppOpen.current < 1500) return;
      lastWhatsAppOpen.current = now;
      const message = formatWhatsAppOrder({
        customer: values,
        items: cartItems.map(({ product, quantity }) => ({ name: product.name, character: product.character, quantity, unitPrice: pricing(product).current, slug: product.id })),
        subtotal, discount: discountAmount, shipping: shippingPrice, total: grandTotal,
        shippingMethod: selectedShipping.title,
        paymentMethod: values.paymentMethod === "COD" ? "Cash on delivery (subject to confirmation)" : values.paymentMethod === "BKASH" ? "bKash (arrange with HIMATU)" : "Card / bank (arrange with HIMATU)",
        origin: window.location.origin,
      });
      setWhatsappDraft(message);
      setCopied(false);
      window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
      return;
    }
    setSubmitting(true);

    try {
      const activeSession = session || (await authService.getSession());
      if (!activeSession?.accessToken) {
        router.push("/sign-in?next=/checkout");
        return;
      }

      const token = activeSession.accessToken;

      // 1. Resolve or Create Address
      let finalAddressId = selectedAddressId;
      if (selectedAddressId === "new" || !savedAddresses.some((a) => a.id === selectedAddressId)) {
        const newAddress = await createAddress(token, {
          recipientName: values.fullName,
          phone: values.phone,
          district: values.district,
          area: values.area,
          fullAddress: values.address,
          postalCode: values.postalCode || null,
          isDefault: true,
        });
        finalAddressId = newAddress.id;
      }

      // 2. Synchronize Items into PostgreSQL Cart
      const dbProducts = await getProducts({ limit: 50 });
      for (const item of cartItems) {
        const matchingDbProduct = dbProducts.items.find(
          (p) => p.slug === item.product.id || p.name === item.product.name,
        );
        if (matchingDbProduct) {
          await addCartItem(token, matchingDbProduct.id, item.quantity);
        }
      }

      // 3. Atomically Create Order
      const mappedMethod = values.paymentMethod === "SSLCOMMERZ" ? "CARD" : values.paymentMethod;
      const order = await createOrder(token, {
        addressId: finalAddressId,
        paymentMethod: mappedMethod,
        customerNotes: values.orderNotes || undefined,
      });

      // 4. Initiate Payment
      const payResult = await initiatePayment(
        {
          orderId: order.id,
          provider: values.paymentMethod,
        },
        token,
      );

      // 5. Clear client cart state
      bagEntries.forEach(([id]) => {
        store.setQuantity(id, 0);
      });

      // 6. Navigate to payment or confirmation
      if (values.paymentMethod === "COD") {
        router.push(`/order-confirmation?orderNumber=${encodeURIComponent(order.orderNumber)}`);
      } else if (payResult.paymentUrl) {
        window.location.href = payResult.paymentUrl;
      } else {
        router.push(
          `/checkout/payment-result?provider=${values.paymentMethod}&trxRef=${encodeURIComponent(
            payResult.transactionRef,
          )}&orderNumber=${encodeURIComponent(order.orderNumber)}&status=PENDING`,
        );
      }
    } catch (err: unknown) {
      console.error("Checkout submission failed:", err);
      setServerError(err instanceof Error ? err.message : "Order placement failed. Please verify your details and try again.");
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
      <form noValidate className="onepage-checkout-main" onSubmit={handleSubmit}>
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
                Ordering as <strong>{session.user.fullName || "Member"}</strong> (
                {session.user.email})
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
        <section className="checkout-card" aria-labelledby="shipping-address-heading">
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
                      {addr.isDefault && <span className="default-tag">DEFAULT</span>}
                    </div>
                    <p className="saved-addr-text">
                      {addr.recipientName} · {addr.phone}
                      <br />
                      {addr.fullAddress}, {addr.area}, {addr.district}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAddressId("new")}
                  className={`saved-addr-card ${selectedAddressId === "new" ? "selected" : ""}`}
                >
                  <div className="saved-addr-top">
                    <strong>+ New Address</strong>
                  </div>
                  <p className="saved-addr-text">Enter another delivery destination</p>
                </button>
              </div>
            </div>
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
                <label htmlFor="orderNotes">Delivery Instructions (Optional)</label>
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

        {/* SECTION 3: Shipping Method Selection */}
        <section className="checkout-card" aria-labelledby="shipping-method-heading">
          <div className="checkout-card-header">
            <div className="step-number">3</div>
            <div>
              <h2 id="shipping-method-heading">SHIPPING METHOD</h2>
              <p className="card-subtext">
                Choose a delivery preference. Charges and timing will be confirmed by HIMATU.
              </p>
            </div>
          </div>

          <div className="shipping-methods-list" role="radiogroup">
            {SHIPPING_METHODS.map((method) => {
              const isSelected = values.shippingMethod === method.id;
              const displayPrice =
                isFreeShipping && method.price > 0 ? (
                  <span className="free-shipping-tag">FREE (applied)</span>
                ) : method.price === 0 ? (
                  "FREE"
                ) : (
                  `৳${method.price}`
                );

              return (
                <label
                  key={method.id}
                  className={`option-card ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={method.id}
                    checked={isSelected}
                    onChange={() => handleChange("shippingMethod", method.id)}
                    className="option-radio"
                    disabled={submitting}
                  />
                  <div className="option-body">
                    <div className="option-title-row">
                      <span className="option-title">{method.title}</span>
                      <span className="option-price">{displayPrice}</span>
                    </div>
                    <span className="option-time">
                      <Clock size={12} /> {method.time}
                    </span>
                    <p className="option-description">{method.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: Payment Method (Cash on Delivery) */}
        <section className="checkout-card" aria-labelledby="payment-heading">
          <div className="checkout-card-header">
            <div className="step-number">4</div>
            <div>
              <h2 id="payment-heading">PAYMENT METHOD</h2>
              <p className="card-subtext">
                Choose your preferred payment method. WhatsApp orders are arranged directly with our team.
              </p>
            </div>
          </div>

          <div className="payment-methods-list">
            {/* bKash DIRECT */}
            <label className={`option-card ${values.paymentMethod === "BKASH" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="BKASH"
                checked={values.paymentMethod === "BKASH"}
                onChange={() => handleChange("paymentMethod", "BKASH")}
                className="option-radio"
                disabled={submitting}
              />
              <div className="option-body">
                <div className="option-title-row">
                  <div className="option-flex-title">
                    <Wallet size={17} />
                    <span className="option-title">bKash Direct Checkout</span>
                  </div>
                  <span className="payment-tag active-tag">PAYMENT PREFERENCE</span>
                </div>
                <p className="option-description">
                  {orderChannel === "whatsapp" ? "Request bKash payment details from HIMATU after availability and the final total are confirmed." : "Continue through the configured bKash checkout flow."}
                </p>
              </div>
            </label>

            {/* SSLCOMMERZ HOSTED GATEWAY */}
            <label className={`option-card ${values.paymentMethod === "SSLCOMMERZ" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="SSLCOMMERZ"
                checked={values.paymentMethod === "SSLCOMMERZ"}
                onChange={() => handleChange("paymentMethod", "SSLCOMMERZ")}
                className="option-radio"
                disabled={submitting}
              />
              <div className="option-body">
                <div className="option-title-row">
                  <div className="option-flex-title">
                    <CreditCard size={17} />
                    <span className="option-title">Credit / Debit Card & NetBanking</span>
                  </div>
                  <span className="payment-tag active-tag">VISA · MC · AMEX · BANKS</span>
                </div>
                <p className="option-description">
                  {orderChannel === "whatsapp" ? "Ask HIMATU which card or bank options are available for your order." : "Continue through the configured hosted payment flow."}
                </p>
              </div>
            </label>

            {/* CASH ON DELIVERY */}
            <label className={`option-card ${values.paymentMethod === "COD" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={values.paymentMethod === "COD"}
                onChange={() => handleChange("paymentMethod", "COD")}
                className="option-radio"
                disabled={submitting}
              />
              <div className="option-body">
                <div className="option-title-row">
                  <div className="option-flex-title">
                    <Truck size={17} />
                    <span className="option-title">Cash on Delivery (COD)</span>
                  </div>
                  <span className="payment-tag active-tag">PAY AT DOORSTEP</span>
                </div>
                <p className="option-description">
                  Request cash on delivery. Our team will confirm eligibility and delivery arrangements.
                </p>
              </div>
            </label>
          </div>
        </section>

        <section className="checkout-card checkout-channel" aria-labelledby="order-channel-heading">
          <h2 id="order-channel-heading">HOW WOULD YOU LIKE TO ORDER?</h2>
          <label className="option-card"><input type="radio" name="orderChannel" checked={orderChannel === "whatsapp"} onChange={() => setOrderChannel("whatsapp")} /><span><strong>WhatsApp order</strong><small>One message with your bag and delivery details. Review and tap Send in WhatsApp.</small></span></label>
          <label className="option-card"><input type="radio" name="orderChannel" checked={orderChannel === "website"} onChange={() => setOrderChannel("website")} /><span><strong>Website checkout</strong><small>Continue with the existing account and payment flow.</small></span></label>
        </section>
        {whatsappDraft && <section className="checkout-card whatsapp-draft" aria-label="WhatsApp order message" role="status">
          <h2>YOUR MESSAGE IS READY.</h2><p>WhatsApp opens with your order details. Press Send there to contact HIMATU. Your bag stays saved until the order is confirmed.</p>
          <pre>{whatsappDraft}</pre><a className="button button--primary" href={whatsappLink(whatsappDraft)} target="_blank" rel="noopener noreferrer">OPEN WHATSAPP <MessageCircle size={16} /></a>
          <button type="button" className="text-link" onClick={async () => { try { await navigator.clipboard.writeText(whatsappDraft); setCopied(true); } catch { setServerError("Copy is unavailable. Select the message above or use Open WhatsApp."); } }}><Copy size={15} />{copied ? "COPIED" : "COPY MESSAGE"}</button>
        </section>}
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
                <MessageCircle size={16} />
                <span>{orderChannel === "whatsapp" ? "ORDER VIA WHATSAPP" : "CONFIRM ORDER"} · ৳{grandTotal.toLocaleString()} BDT</span>
              </>
            )}
          </Button>

          <p className="checkout-terms-note">
            By confirming this order, you agree to HIMATU&apos;s{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>. {orderChannel === "whatsapp" ? "Your name, contact and delivery details will be included in a message to 01797725697. Review it before sending. Stock and delivery estimates require confirmation." : "Please review your order before proceeding."}
          </p>
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
                  <AssetImage asset={assets.product(p)} className="summary-thumbnail" />
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
              <span>Shipping ({selectedShipping.title})</span>
              <span>
                {isFreeShipping ? (
                  <span className="free-shipping-text">FREE</span>
                ) : (
                  `৳${shippingPrice}`
                )}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line grand-total-line">
              <span>Total Payable</span>
              <div className="grand-total-stack">
                <span className="grand-total-amount">৳{grandTotal.toLocaleString()}</span>
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
