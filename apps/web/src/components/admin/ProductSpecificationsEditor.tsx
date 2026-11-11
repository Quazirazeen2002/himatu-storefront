"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export function ProductSpecificationsEditor({ value, onChange }: {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  function add() {
    const name = label.trim();
    if (!name) { setError("Enter a specification name."); return; }
    if (Object.keys(value).some(key => key.toLowerCase() === name.toLowerCase())) {
      setError("That specification already exists. Edit its value below."); return;
    }
    onChange({ ...value, [name]: "" });
    setLabel(""); setError("");
  }
  return <fieldset className="admin-spec-editor">
    <legend>Product specifications</legend>
    <p>Edit the details shown on the product page. Blank values are hidden.</p>
    <div className="admin-spec-fields">
      {Object.entries(value).map(([key, text]) => <div className="admin-spec-row" key={key}>
        <label className="field"><span>{key}</span><input type="text" maxLength={1000} value={text} onChange={event => onChange({ ...value, [key]: event.target.value })} /></label>
        <button className="admin-btn admin-btn--secondary" type="button" aria-label={`Remove ${key} specification`} onClick={() => { const next = { ...value }; delete next[key]; onChange(next); }}><Trash2 size={16} /></button>
      </div>)}
    </div>
    <div className="admin-spec-add"><label className="field"><span>New specification name</span><input type="text" maxLength={100} placeholder="e.g. Edition or Packaging" value={label} onChange={event => setLabel(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /></label><button className="admin-btn admin-btn--secondary" type="button" onClick={add}><Plus size={15} /> Add specification</button></div>
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
