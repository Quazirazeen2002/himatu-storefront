"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, X, CheckCircle2, FileText, ArrowRight, LoaderCircle } from "lucide-react";
import { Button, Input } from "../ui/Primitives";
import { authService } from "@/lib/auth-service";
import { createPrintingRequest, uploadPrintingImage } from "@/lib/commerce-api";
import type { CreatePrintingRequestDto } from "@himatu/shared";

const SCALES = [
  "1/7 Scale (~24cm) - Collector Standard",
  "1/6 Scale (~30cm) - Premium Showcase",
  "1/4 Scale (~45cm) - Monumental Scale",
  "1/10 Scale (~18cm) - Compact Desktop",
  "Custom / Life-Size Prop",
];

const MATERIALS = [
  "8K Micro-Resin (Ultra-Fine Layer Height 0.02mm)",
  "Tough ABS-Like Resin (High Impact Strength)",
  "Clear Translucent Photopolymer (Aura / Elemental Effects)",
];

const FINISHES = [
  "Fully Hand-Painted (Master Level - Anime Eyes & Shading)",
  "Base Coat Primed & Pre-Shaded (Ready for Collector DIY)",
  "Raw Cleaned & UV Cured Assembly (Unpainted Resin)",
];

export function PrintingInquiry() {
  const [session, setSession] = useState<any>(null);
  const [values, setValues] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    title: "",
    animeName: "",
    characterName: "",
    description: "",
    sizePreference: SCALES[0],
    materialPreference: MATERIALS[0],
    finishPreference: FINISHES[0],
    budgetEstimate: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);

  useEffect(() => {
    authService.getSession().then((s) => {
      if (s?.user) {
        setSession(s);
        setValues((prev) => ({
          ...prev,
          customerName: prev.customerName || s.user.fullName || "",
          customerEmail: prev.customerEmail || s.user.email || "",
          customerPhone: prev.customerPhone || s.user.phone || "",
        }));
      }
    });
  }, []);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected].slice(0, 5)); // up to 5 photos
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!values.characterName || !values.animeName || !values.customerName || !values.customerEmail || !values.customerPhone) {
      setErrorMessage("Please complete all required fields including character, anime title, and contact details.");
      return;
    }

    setSubmitting(true);

    try {
      const activeSession = session || (await authService.getSession());
      const token = activeSession?.accessToken;

      const dto: CreatePrintingRequestDto = {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        title: values.title || `${values.characterName} (${values.animeName})`,
        animeName: values.animeName,
        characterName: values.characterName,
        description: values.description || `Custom 3D print request for ${values.characterName} from ${values.animeName}.`,
        sizePreference: values.sizePreference,
        materialPreference: values.materialPreference,
        finishPreference: values.finishPreference,
        budgetEstimate: values.budgetEstimate ? parseInt(values.budgetEstimate, 10) : undefined,
      };

      const requestResult = await createPrintingRequest(dto, token);

      // Upload reference images if any
      if (files.length > 0) {
        for (const f of files) {
          try {
            await uploadPrintingImage(requestResult.id, f, "Customer reference photo", token);
          } catch (uploadErr) {
            console.error("Failed uploading reference photo:", uploadErr);
          }
        }
      }

      setSubmittedRequest(requestResult);
    } catch (err: any) {
      console.error("Inquiry submission error:", err);
      setErrorMessage(err.message || "Failed to submit request. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <div
        id="quotation"
        style={{
          border: "1px solid var(--border)",
          background: "var(--card-bg, #ffffff)",
          padding: "48px 32px",
          textAlign: "center",
          borderRadius: "4px",
          margin: "40px 0",
        }}
      >
        <div style={{ color: "#16a34a", marginBottom: "16px" }}>
          <CheckCircle2 size={52} style={{ margin: "0 auto" }} />
        </div>
        <p className="eyebrow" style={{ letterSpacing: "0.15em", marginBottom: "8px" }}>
          CUSTOM PRINT INQUIRY REGISTERED
        </p>
        <h2 style={{ fontSize: "26px", fontWeight: 900, margin: "0 0 12px" }}>
          {submittedRequest.requestNumber}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "15px", maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Thank you, <strong>{values.customerName}</strong>. Our digital sculptors and modelers are reviewing your reference specifications for <strong>{values.characterName}</strong>. We will generate a formal BDT quotation with deposit terms within 24–48 hours.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href={`/account/printing-requests/${submittedRequest.id}`}
            className="button button--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            VIEW QUOTATION TRACKER <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setSubmittedRequest(null);
              setFiles([]);
              setValues({
                customerName: "",
                customerEmail: "",
                customerPhone: "",
                title: "",
                animeName: "",
                characterName: "",
                description: "",
                sizePreference: SCALES[0],
                materialPreference: MATERIALS[0],
                finishPreference: FINISHES[0],
                budgetEstimate: "",
              });
            }}
          >
            SUBMIT ANOTHER FIGURE
          </button>
        </div>
      </div>
    );
  }

  return (
    <form id="quotation" className="inquiry-form" noValidate onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">BESPOKE ANIME COLLECTIBLE COMMISSIONS</p>
        <h2>Request a 3D Print Quotation.</h2>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "6px" }}>
          From digital sculpting to 8K SLA curing and hand-painted master finishing.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #f87171",
            color: "#991b1b",
            fontSize: "13px",
            borderRadius: "4px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div className="inquiry-fields">
        <Input
          id="characterName"
          label="Character Name *"
          required
          maxLength={120}
          placeholder="e.g. Gojo Satoru, Roronoa Zoro, Makima"
          value={values.characterName}
          onChange={(e) => handleChange("characterName", e.target.value)}
          disabled={submitting}
        />

        <Input
          id="animeName"
          label="Anime / Manga Franchise *"
          required
          maxLength={120}
          placeholder="e.g. Jujutsu Kaisen, One Piece, Chainsaw Man"
          value={values.animeName}
          onChange={(e) => handleChange("animeName", e.target.value)}
          disabled={submitting}
        />

        <Input
          id="title"
          label="Custom Pose / Project Concept"
          maxLength={160}
          placeholder="e.g. Hollow Purple Awakening, Enma Three-Sword Pose"
          value={values.title}
          onChange={(e) => handleChange("title", e.target.value)}
          disabled={submitting}
        />

        <div className="field">
          <label htmlFor="sizePreference">Desired Figure Scale *</label>
          <select
            id="sizePreference"
            value={values.sizePreference}
            onChange={(e) => handleChange("sizePreference", e.target.value)}
            disabled={submitting}
            style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", background: "transparent" }}
          >
            {SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="materialPreference">Material Spec *</label>
          <select
            id="materialPreference"
            value={values.materialPreference}
            onChange={(e) => handleChange("materialPreference", e.target.value)}
            disabled={submitting}
            style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", background: "transparent" }}
          >
            {MATERIALS.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="finishPreference">Artistic Finish *</label>
          <select
            id="finishPreference"
            value={values.finishPreference}
            onChange={(e) => handleChange("finishPreference", e.target.value)}
            disabled={submitting}
            style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", background: "transparent" }}
          >
            {FINISHES.map((fin) => (
              <option key={fin} value={fin}>
                {fin}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="budgetEstimate"
          label="Estimated Budget (BDT optional)"
          type="number"
          placeholder="e.g. 15000"
          value={values.budgetEstimate}
          onChange={(e) => handleChange("budgetEstimate", e.target.value)}
          disabled={submitting}
        />

        <Input
          id="customerName"
          label="Your Full Name *"
          required
          maxLength={120}
          value={values.customerName}
          onChange={(e) => handleChange("customerName", e.target.value)}
          disabled={submitting}
        />

        <Input
          id="customerEmail"
          label="Email Address *"
          type="email"
          required
          maxLength={254}
          value={values.customerEmail}
          onChange={(e) => handleChange("customerEmail", e.target.value)}
          disabled={submitting}
        />

        <Input
          id="customerPhone"
          label="Bangladeshi Mobile Phone *"
          type="tel"
          required
          maxLength={20}
          placeholder="017xxxxxxxx"
          value={values.customerPhone}
          onChange={(e) => handleChange("customerPhone", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="field" style={{ marginTop: "16px" }}>
        <label htmlFor="description">Character Details & Posing Instructions</label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          placeholder="Describe costume details, dynamic effects (e.g. fire/lightning), diorama base preferences, or facial expression..."
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={submitting}
          style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", background: "transparent" }}
        />
      </div>

      {/* Reference Image Upload */}
      <div style={{ marginTop: "24px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
          Reference Photos / Artwork (Up to 5 images, max 15MB each)
        </label>
        <div
          style={{
            border: "2px dashed var(--border)",
            padding: "24px",
            textAlign: "center",
            borderRadius: "4px",
            background: "#fafafa",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <Upload size={24} style={{ margin: "0 auto 8px", color: "var(--muted)" }} />
          <p style={{ margin: 0, fontSize: "13px" }}>
            Drag and drop reference images here, or <strong>browse files</strong>
          </p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={submitting}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </div>

        {files.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            {files.map((file, i) => (
              <div
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <FileText size={14} />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px" }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px" }}
        >
          {submitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> SUBMITTING INQUIRY…
            </>
          ) : (
            <>
              SUBMIT 3D PRINT INQUIRY <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
