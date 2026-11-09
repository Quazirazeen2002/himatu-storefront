"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit2, RefreshCw } from "lucide-react";
import type { CategoryDto, CategoryKind, FranchiseFamily } from "@himatu/shared";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { getAdminCategories, createAdminCategory, updateAdminCategory, uploadCategoryImage } from "@/lib/commerce-api";
import { categoryHref, familyLabels } from "@/lib/taxonomy";
import { Modal } from "../ui/Modal";

function previewable(value: string) {
  if (value.startsWith("/images/")) return true;
  try { const url=new URL(value); return url.protocol === "https:" && Boolean(url.hostname); } catch { return false; }
}

const emptyForm = { name: "", slug: "", description: "", imageUrl: "", imageIsDemo: false, kind: "PRODUCT_TYPE" as CategoryKind, family: "ANIME" as FranchiseFamily, displayOrder: 0, isActive: true };
export function CategoryManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState("");
  const previewSource = preview || (previewable(form.imageUrl) ? form.imageUrl : "");
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  useEffect(() => {
    let active = true;
    authService.getSession().then(async current => {
      if (!active) return;
      setSession(current);
      if (current?.accessToken) { const result = await getAdminCategories(current.accessToken); if (active) setCategories(result); }
    }).catch(() => { if (active) setFeedback("Categories could not be loaded. Please refresh."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const refresh = async () => {
    if (!session?.accessToken) return;
    try { setCategories(await getAdminCategories(session.accessToken)); }
    catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Categories could not be loaded."); }
  };
  const resetFile = () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = null; setPreview(""); setFile(null); };
  const edit = (category?: CategoryDto) => {
    setEditing(category || null); resetFile(); setError("");
    setForm(category ? { name:category.name, slug:category.slug, description:category.description || "", imageUrl:category.imageUrl || "", imageIsDemo:category.imageIsDemo || false, kind:category.kind || "FRANCHISE", family:category.family || "ANIME", displayOrder:category.displayOrder, isActive:category.isActive } : { ...emptyForm, displayOrder:categories.length });
    setOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!session?.accessToken || saving) return;
    setSaving(true); setError(""); let saved = false;
    try {
      const payload = { ...form, name:form.name.trim(), slug:form.slug.trim(), description:form.description.trim() || null, imageUrl:form.imageUrl.trim() || null, family:form.kind === "PRODUCT_TYPE" ? null : form.family };
      const category = editing ? await updateAdminCategory(session.accessToken, editing.id, payload) : await createAdminCategory(session.accessToken, payload);
      saved = true; setEditing(category);
      if (file) await uploadCategoryImage(session.accessToken, category.id, file, form.imageIsDemo);
      await refresh(); setOpen(false); resetFile(); setFeedback(`Saved “${category.name}”. It is ${category.isActive ? "available in the storefront" : "hidden from the storefront"}.`);
    } catch (reason) { setError(`${saved ? "Category saved; the image was not uploaded. " : ""}${reason instanceof Error ? reason.message : "Please try again."}`); }
    finally { setSaving(false); }
  };
  const toggle = async (category: CategoryDto) => {
    if (!session?.accessToken) return;
    try { await updateAdminCategory(session.accessToken, category.id, { isActive:!category.isActive }); await refresh(); }
    catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Status could not be updated."); }
  };
  if (loading) return <p role="status">Loading categories…</p>;
  if (!session?.accessToken) return <p>Sign in to manage categories. <Link href="/sign-in?next=/admin/categories">Sign in</Link></p>;
  return <div>
    <div className="admin-page-header"><div><h1>Categories & Franchises</h1><p>Manage product categories separately from anime, comic-book and movie collections.</p></div><div className="admin-page-actions"><button className="admin-btn admin-btn--secondary" onClick={refresh} type="button"><RefreshCw size={15} />Refresh</button><button className="admin-btn admin-btn--primary" onClick={() => edit()} type="button"><Plus size={15} />Add category or franchise</button></div></div>
    {feedback && <p className="feedback" role="status">{feedback}</p>}
    <div className="admin-card admin-table-wrap"><table className="admin-table"><thead><tr><th>Cover / Name</th><th>Dimension</th><th>Family</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {categories.map(category => <tr key={category.id}><td><div className="admin-category-name">{category.imageUrl && <Image src={category.imageUrl} alt={`${category.name} category cover`} width={56} height={68} unoptimized />}<div><strong>{category.name}</strong><small>{category.slug}{category.imageIsDemo ? " · Demo artwork" : ""}</small></div></div></td><td>{category.kind === "PRODUCT_TYPE" ? "Product category" : "Franchise"}</td><td>{category.family ? familyLabels[category.family] : "—"}</td><td>{category.productCount || 0}</td><td>{category.isActive ? "Active" : "Hidden"}</td><td><div className="admin-category-actions"><button type="button" className="admin-btn admin-btn--secondary" onClick={() => edit(category)} aria-label={`Edit ${category.name}`}><Edit2 size={13} />Edit</button><button type="button" className="admin-btn admin-btn--secondary" onClick={() => toggle(category)}>{category.isActive ? "Hide" : "Show"}</button><Link href={categoryHref(category)}>View</Link></div></td></tr>)}
      {!categories.length && <tr><td colSpan={6}>Create your first category to begin.</td></tr>}
    </tbody></table></div>
    <Modal open={open} onClose={() => { if (!saving) setOpen(false); }} title={editing ? "Edit category or franchise" : "Create category or franchise"} className="admin-category-modal">
      <form onSubmit={submit} className="admin-category-form">
        <label className="field"><span>Category name</span><input required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name:event.target.value, ...(editing ? {} : { slug:event.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }) })} placeholder="e.g. Hoodies or Pokémon" /></label>
        <label className="field"><span>URL slug</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} value={form.slug} onChange={event => setForm({ ...form, slug:event.target.value })} /></label>
        <div className="admin-category-fields"><label className="field"><span>Dimension</span><select value={form.kind} disabled={Boolean(editing?.productCount)} onChange={event => setForm({ ...form, kind:event.target.value as CategoryKind })}><option value="PRODUCT_TYPE">Product category (T-shirts, Keychains…)</option><option value="FRANCHISE">Franchise / universe (Naruto, Marvel…)</option></select></label>{form.kind === "FRANCHISE" && <label className="field"><span>Collection family</span><select value={form.family} onChange={event => setForm({ ...form, family:event.target.value as FranchiseFamily })}>{Object.entries(familyLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}</div>
        <label className="field"><span>Description</span><textarea rows={3} value={form.description} onChange={event => setForm({ ...form, description:event.target.value })} /></label>
        <label className="field"><span>Cover image URL or local /images/ path</span><input value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl:event.target.value })} placeholder="https://… or /images/categories/…" /></label>
        <label className="field"><span>Or upload a cover (JPEG, PNG, WebP · max 10MB)</span><input key={editing?.id || "create"} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
          const selected = event.target.files?.[0]; resetFile(); if (!selected) return;
          if (!["image/jpeg","image/png","image/webp"].includes(selected.type) || selected.size > 10*1024*1024) { setError("Choose a JPEG, PNG or WebP up to 10MB."); return; }
          setError(""); setFile(selected); const url=URL.createObjectURL(selected); previewRef.current=url; setPreview(url);
        }} /></label>
        {previewSource && <Image className="admin-category-preview" src={previewSource} width={160} height={180} alt="Category cover preview" unoptimized />}
        <label className="admin-category-check"><input type="checkbox" checked={form.imageIsDemo} onChange={event => setForm({ ...form, imageIsDemo:event.target.checked })} />Label image as demo / illustrative artwork</label>
        <div className="admin-category-fields"><label className="field"><span>Display order</span><input type="number" value={form.displayOrder} onChange={event => setForm({ ...form, displayOrder:Number(event.target.value) })} /></label><label className="admin-category-check"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive:event.target.checked })} />Visible on storefront</label></div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="admin-category-actions"><button type="button" className="admin-btn admin-btn--secondary" disabled={saving} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? "Saving…" : "Save category"}</button></div>
      </form>
    </Modal>
  </div>;
}
