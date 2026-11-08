"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button, DemoNotice, IconButton, Input } from "../ui/Primitives";
import {
  validate,
  focusError,
  type FieldRule,
  type FormErrors,
} from "@/lib/validation";
const rules: Record<string, FieldRule> = {
  customerName: { label: "Customer name", required: true, max: 120 },
  inquiryEmail: { label: "Email", required: true, kind: "email" },
  inquiryPhone: { label: "Phone", required: true, kind: "phone" },
  characterName: { label: "Character name", required: true, max: 120 },
  franchise: { label: "Franchise", required: true, max: 120 },
  dimensions: { label: "Preferred dimensions", required: true, max: 100 },
  quantity: { label: "Quantity", required: true, kind: "quantity" },
  requirements: { label: "Additional requirements", max: 2000 },
};
export function PrintingInquiry() {
  const [values, setValues] = useState<Record<string, string>>({
    customerName: "",
    inquiryEmail: "",
    inquiryPhone: "",
    characterName: "",
    franchise: "",
    dimensions: "",
    quantity: "1",
    requirements: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const set = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setStatus("");
  };
  return (
    <form
      id="quotation"
      className="inquiry-form"
      noValidate
      aria-busy={pending}
      onSubmit={async (e) => {
        e.preventDefault();
        const next = validate(values, rules);
        setErrors(next);
        setStatus("");
        if (Object.keys(next).length || fileError) {
          focusError(next);
          return;
        }
        setPending(true);
        await new Promise((resolve) => setTimeout(resolve, 250));
        setPending(false);
        setStatus(
          "Your inquiry has been validated locally. Nothing was sent to HIMATU and no quotation was requested. This is a frontend demonstration.",
        );
      }}
    >
      <div>
        <p className="eyebrow">AN IDEA WORTH EXPLORING</p>
        <h2>Request a quotation.</h2>
        <DemoNotice>
          Local form preview. Please use example contact details. No inquiry or
          file is sent to the business.
        </DemoNotice>
      </div>
      <div className="inquiry-fields">
        {Object.entries(rules)
          .filter(([key]) => key !== "requirements")
          .map(([key, rule]) => (
            <Input
              key={key}
              id={key}
              label={rule.label}
              type={
                rule.kind === "email"
                  ? "email"
                  : rule.kind === "phone"
                    ? "tel"
                    : rule.kind === "quantity"
                      ? "number"
                      : "text"
              }
              min={rule.kind === "quantity" ? 1 : undefined}
              max={rule.kind === "quantity" ? 100 : undefined}
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              error={errors[key]}
              maxLength={rule.max || 150}
            />
          ))}
        <label className="field inquiry-wide" htmlFor="requirements">
          <span>Additional requirements (optional)</span>
          <textarea
            id="requirements"
            rows={4}
            maxLength={2000}
            value={values.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            aria-invalid={!!errors.requirements}
          />
          {errors.requirements && (
            <span className="field-error">{errors.requirements}</span>
          )}
        </label>
        <div className="upload-field inquiry-wide">
          <label className="field" htmlFor="reference">
            <span>
              <Upload size={16} /> Reference image (optional)
            </span>
            <span className="muted">
              JPEG, PNG or WebP · maximum 5 MB · stays in your browser
            </span>
            <input
              id="reference"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="reference-help"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setStatus("");
                setPreview("");
                setFileName("");
                setFileError("");
                if (!file) return;
                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) ||
                  !/\.(jpe?g|png|webp)$/i.test(file.name)
                ) {
                  setFileError("Choose a JPEG, PNG or WebP image.");
                  e.target.value = "";
                  return;
                }
                if (file.size > 5 * 1024 * 1024 || file.size === 0) {
                  setFileError("Choose a non-empty image no larger than 5 MB.");
                  e.target.value = "";
                  return;
                }
                setPreview(URL.createObjectURL(file));
                setFileName(file.name);
              }}
            />
          </label>
          <p id="reference-help" className="demo-note">
            Selecting a file does not upload it.
          </p>
          {fileError && (
            <p className="field-error" role="alert">
              {fileError}
            </p>
          )}
          {preview && (
            <div className="upload-preview">
              <Image
                src={preview}
                alt={`Local reference preview: ${fileName}`}
                width={220}
                height={180}
                unoptimized
                onError={() => {
                  setPreview("");
                  setFileError(
                    "This file could not be decoded as an image. Choose another file.",
                  );
                }}
              />
              <p>{fileName}</p>
              <IconButton
                label="Remove reference image"
                onClick={() => {
                  setPreview("");
                  setFileName("");
                  const input = document.getElementById(
                    "reference",
                  ) as HTMLInputElement;
                  if (input) input.value = "";
                }}
              >
                <X size={17} />
              </IconButton>
            </div>
          )}
        </div>
      </div>
      {Object.values(errors).some(Boolean) && (
        <p className="feedback" role="alert">
          Check the highlighted inquiry fields.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "CHECKING INQUIRY…" : "VALIDATE INQUIRY · DEMO"}
      </Button>
      {status && (
        <p className="feedback" role="status">
          {status}
        </p>
      )}
    </form>
  );
}
