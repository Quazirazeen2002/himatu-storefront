"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Wallet,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Package,
  LoaderCircle,
  Clock,
  Sparkles,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useStore } from "./StoreProvider";
import { products, formatPrice } from "@/lib/config";
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
  clearCart,
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
    description: "Hand-to-hand insured courier with corner-guard protective box.",
  },
  {
    id: "nationwide-standard",
    title: "Outside Dhaka Standard Courier",
    price: 130,
    time: "2–4 Business Days",
    description: "Priority nationwide shipping across all 64 districts via insured courier.",
  },
  {
    id: "vault-pickup",
    title: "HIMATU Collector Vault Pickup",
    price: 0,
    time: "Ready within 24 Hours",
    description: "Free in-person pickup from HIMATU Vault (Dhanmondi, Dhaka).",
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
  const [promoMessage, setPromoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    ([id, quantity]) => quantity > 0 && products.some((p) => p.id === id),
  );

  const cartItems = bagEntries.map(([id, quantity]) => {
    const product = products.find((p) => p.id === id)!;
    return {
      product,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const isFreeShipping = subtotal >= 15000;
  const selectedShipping =
    SHIPPING_METHODS.find((m) => m.id === values.shippingMethod) ||
    SHIPPING_METHODS[0];

  const shippingPrice = isFreeShipping ? 0 : selectedShipping.price;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);

  const handleChange = (key: keyof typeof values, val: string | boolean) => {
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
    const clean = promoCode.trim().toUpperCase();
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
    } catch (err: any) {
      console.error("Checkout submission failed:", err);
      setServerError(err.message || "Order placement failed. Please verify your details and try again.");
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
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <div className="reassurance-item">
            <ShieldCheck size={15} />
            <span>100% Genuine Japanese Collectibles</span>
          </div>
          <div className="reassurance-item">
            <Truck size={15} />
            <span>Insured Corner-Protected Packaging</span>
          </div>
        </div>

        {/* SECTION 1: Customer Contact Information */}
        <section className="checkout-card" aria-labelledby="contact-heading">
          <div className="checkout-card-header">
            <div className="step-number">1</div>
            <div>
              <h2 id="contact-heading">CONTACT INFORMATION</h2>
              <p className="card-subtext">
                Order confirmation and tracking updates will be sent here.
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
                  className="checkout-textarea"
                  placeholder="e.g. Please leave with building security, call upon gate arrival, fragile resin care..."
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
                Every collectible is packaged with custom shock-absorbent corner guards.
              </p>
            </div>
          </div>

          <div className="shipping-methods-list" role="radiogroup">
            {SHIPPING_METHODS.map((method) => {
              const isSelected = values.shippingMethod === method.id;
              const displayPrice =
                isFreeShipping && method.price > 0 ? (
                  <span className="free-shipping-tag">FREE (Order &gt; ৳15k)</span>
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
                Inspect your collectible figure upon arrival and pay cash directly to the courier rider.
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
                  <span className="payment-tag active-tag">INSTANT VERIFICATION</span>
                </div>
                <p className="option-description">
                  Pay instantly via bKash Merchant Gateway. Direct server-to-server confirmation locks your collectible immediately.
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
                  Secure hosted payment portal supporting Visa, Mastercard, American Express, and Bangladeshi internet banking portals.
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
                  Inspect the collectible seal and package condition upon delivery before handing cash in BDT to the courier rider.
                </p>
              </div>
            </label>
          </div>
        </section>

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
                <Lock size={16} />
                <span>CONFIRM ORDER · ৳{grandTotal.toLocaleString()} BDT (COD)</span>
              </>
            )}
          </Button>

          <p className="checkout-terms-note">
            By confirming this order, you agree to HIMATU&apos;s{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>. Authenticity and packaging guarantee included.
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
              placeholder="Promo code (e.g. HIMATU10)"
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
              <span>Official Manufacturer Box &amp; Hologram Seal</span>
            </div>
            <div className="guarantee-row">
              <Truck size={16} />
              <span>Double-box corner-guard courier dispatch</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
