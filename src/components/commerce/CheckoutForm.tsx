"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./StoreProvider";
import { getTotals } from "@/lib/demo-store";
import { products, formatPrice } from "@/lib/config";
import {
  validate,
  focusError,
  type FormErrors,
  type FieldRule,
} from "@/lib/validation";
import { Button, ButtonLink, DemoNotice, Input } from "../ui/Primitives";
const steps = ["Customer", "Address", "Delivery", "Payment", "Review"];
const customer: Record<string, FieldRule> = {
  fullName: { label: "Full name", required: true, max: 120 },
  phone: { label: "Phone", required: true, kind: "phone" },
  email: { label: "Email", required: true, kind: "email" },
};
const address: Record<string, FieldRule> = {
  district: { label: "District", required: true, max: 100 },
  area: { label: "Area", required: true, max: 150 },
  address: { label: "Full address", required: true, max: 500 },
};
export function CheckoutForm() {
  const store = useStore();
  const { count, subtotal } = getTotals(store.bag);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    fullName: "",
    phone: "",
    email: "",
    district: "",
    area: "",
    address: "",
    delivery: "",
    payment: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const move = (value: number) => {
    setStep(value);
    setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  };
  const set = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  if (!count)
    return (
      <div className="empty-state">
        <h2>Your demo bag is empty.</h2>
        <p>
          Add a sample figure to explore the delivery, payment selection and
          review experience.
        </p>
        <ButtonLink href="/shop">EXPLORE FIGURES</ButtonLink>
      </div>
    );
  const fields = step === 0 ? customer : address;
  return (
    <form
      noValidate
      className="checkout-form"
      onSubmit={(e) => {
        e.preventDefault();
        let next: FormErrors = {};
        if (step < 2) next = validate(values, fields);
        if (step === 2 && !values.delivery)
          next.delivery = "Select the demonstration delivery method.";
        if (step === 3 && !values.payment)
          next.payment = "Select a demonstration payment method.";
        setErrors(next);
        if (Object.keys(next).length) {
          focusError(next);
          return;
        }
        if (step < 4) move(step + 1);
        else router.push("/order-confirmation?demo=reviewed");
      }}
    >
      <ol className="checkout-steps" aria-label="Checkout progress">
        {steps.map((name, index) => (
          <li key={name} aria-current={step === index ? "step" : undefined}>
            <span>{index + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1}>
        {steps[step]} {step < 4 ? "details" : ""}
      </h2>
      <DemoNotice>
        Frontend demonstration. Use example information. No data is sent or
        saved, no delivery is booked and no payment is processed.
      </DemoNotice>
      {step < 2 && (
        <>
          {Object.entries(fields).map(([key, rule]) => (
            <Input
              key={key}
              id={key}
              label={rule.label}
              type={
                key === "email" ? "email" : key === "phone" ? "tel" : "text"
              }
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              error={errors[key]}
              maxLength={rule.max || 150}
            />
          ))}
          {step === 1 && (
            <p className="muted">
              Country: Bangladesh. Delivery coverage will be confirmed before
              launch.
            </p>
          )}
        </>
      )}
      {step === 2 && (
        <fieldset className="option-fieldset">
          <legend>Demonstration delivery method</legend>
          <label className="choice">
            <input
              id="delivery"
              type="radio"
              name="delivery"
              checked={values.delivery === "standard"}
              onChange={() => set("delivery", "standard")}
              aria-describedby={errors.delivery ? "delivery-error" : undefined}
            />
            <span>
              Standard delivery · demo only
              <small>Fees, availability and timings are not confirmed.</small>
            </span>
          </label>
          {errors.delivery && (
            <p id="delivery-error" role="alert" className="field-error">
              {errors.delivery}
            </p>
          )}
        </fieldset>
      )}
      {step === 3 && (
        <fieldset className="option-fieldset">
          <legend>Payment method · demonstration only</legend>
          {["Cash on Delivery", "bKash", "Card payment"].map(
            (method, index) => (
              <label className="choice" key={method}>
                <input
                  id={index === 0 ? "payment" : `payment-${index}`}
                  type="radio"
                  name="payment"
                  checked={values.payment === method}
                  onChange={() => set("payment", method)}
                  aria-describedby={
                    errors.payment ? "payment-error" : undefined
                  }
                />
                <span>
                  {method}
                  <small>Interface preview. No transaction will occur.</small>
                </span>
              </label>
            ),
          )}
          {errors.payment && (
            <p id="payment-error" role="alert" className="field-error">
              {errors.payment}
            </p>
          )}
        </fieldset>
      )}
      {step === 4 && (
        <div className="checkout-review">
          <section>
            <h3>Customer & delivery address</h3>
            <p>
              {values.fullName}
              <br />
              {values.email}
              <br />
              {values.phone}
              <br />
              {values.address}, {values.area}, {values.district}, Bangladesh
            </p>
          </section>
          <section>
            <h3>Delivery & payment selection</h3>
            <p>
              Standard delivery · fee not calculated
              <br />
              {values.payment} · demo selection
            </p>
          </section>
          <section>
            <h3>{count} demo items</h3>
            {products
              .filter((p) => store.bag[p.id])
              .map((p) => (
                <div className="summary-line" key={p.id}>
                  <span>
                    {p.name} × {store.bag[p.id]}
                  </span>
                  <span>{formatPrice(p.price * store.bag[p.id])}</span>
                </div>
              ))}
            <p>
              <strong>Illustrative item total: {formatPrice(subtotal)}</strong>
            </p>
            <p>Delivery is excluded. No complete payable total is available.</p>
          </section>
        </div>
      )}
      {Object.values(errors).some(Boolean) && (
        <p className="feedback" role="alert">
          Check the highlighted fields before continuing.
        </p>
      )}
      <div className="checkout-controls">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => move(step - 1)}
          >
            BACK
          </Button>
        )}
        <Button type="submit">
          {step === 4 ? "VIEW DEMO CONFIRMATION" : "CONTINUE"}
        </Button>
      </div>
      {step === 4 && (
        <Button disabled>REAL ORDER SUBMISSION UNAVAILABLE</Button>
      )}
    </form>
  );
}
