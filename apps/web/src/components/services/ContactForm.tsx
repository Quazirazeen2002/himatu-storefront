"use client";
import { useState } from "react";
import { Button, Input, DemoNotice } from "../ui/Primitives";
import { validate, focusError, type FormErrors } from "@/lib/validation";
export function ContactForm() {
  const [values, setValues] = useState({
    contactName: "",
    contactEmail: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState("");
  return (
    <form
      className="contact-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const next = validate(values, {
          contactName: { label: "Name", required: true, max: 120 },
          contactEmail: { label: "Email", required: true, kind: "email" },
          message: { label: "Message", required: true, max: 2000 },
        });
        setErrors(next);
        setStatus("");
        if (Object.keys(next).length) {
          focusError(next);
          return;
        }
        setStatus(
          "Message checked locally. It was not sent to HIMATU. Official contact channels will be published when confirmed.",
        );
      }}
    >
      <h2>Start a conversation.</h2>
      <DemoNotice>
        Form demonstration only. Use example details; no message is transmitted.
      </DemoNotice>
      <Input
        id="contactName"
        label="Name"
        value={values.contactName}
        error={errors.contactName}
        onChange={(e) => setValues({ ...values, contactName: e.target.value })}
      />
      <Input
        id="contactEmail"
        label="Email"
        type="email"
        value={values.contactEmail}
        error={errors.contactEmail}
        onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
      />
      <label className="field" htmlFor="message">
        <span>Message</span>
        <textarea
          id="message"
          rows={5}
          maxLength={2000}
          value={values.message}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
        />
        {errors.message && (
          <span id="message-error" className="field-error">
            {errors.message}
          </span>
        )}
      </label>
      <Button>CHECK MESSAGE · DEMO</Button>
      {status && (
        <p className="feedback" role="status">
          {status}
        </p>
      )}
    </form>
  );
}
