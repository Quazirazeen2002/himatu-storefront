"use client";
import { whatsappLink } from "@/lib/whatsapp";
import { useState } from "react";
import { Button, Input } from "../ui/Primitives";
import { validate, focusError, type FormErrors } from "@/lib/validation";
export function ContactForm() {
  const [values, setValues] = useState({
    contactName: "",
    contactEmail: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [draft, setDraft] = useState("");
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
        setDraft("");
        if (Object.keys(next).length) {
          focusError(next);
          return;
        }
        const message = `*HIMATU — CUSTOMER ENQUIRY*
Name: ${values.contactName.trim()}
Email: ${values.contactEmail.trim()}

${values.message.trim()}`;
        const link = whatsappLink(message);
        setDraft(link);
        window.open(link, "_blank", "noopener,noreferrer");
      }}
    >
      <h2>Start a conversation.</h2>
      <p>Tell us what you have in mind. Review your message in WhatsApp before sending.</p>
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
      <Button>CONTINUE IN WHATSAPP</Button>
      {draft && <p className="feedback" role="status">Your message is ready. <a href={draft} target="_blank" rel="noopener noreferrer">Open WhatsApp to review and send</a>.</p>}
    </form>
  );
}
