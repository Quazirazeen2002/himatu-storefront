"use client";
import { useCallback, useEffect, useState } from "react";
import { Boxes, Edit2, RefreshCw } from "lucide-react";
import { Modal } from "../ui/Modal";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { getAllAdminProducts, adjustAdminInventory } from "@/lib/commerce-api";
import { availableStock, inventoryGroups, type InventoryGrouping, type StockFilter } from "@/lib/inventory";
import type { ProductDto } from "@himatu/shared";

export function InventoryManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [grouping, setGrouping] = useState<InventoryGrouping>("product-type");
  const [category, setCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const load = useCallback(async (token: string) => {
    setError("");
    try { setProducts(await getAllAdminProducts(token)); }
    catch (err) { setError(err instanceof Error ? err.message : "Inventory could not be loaded. Please retry."); }
  }, []);
  useEffect(() => {
    let active = true;
    authService.getSession().then(async current => {
      if (!active) return;
      setSession(current);
      if (current?.accessToken && ["ADMIN", "MODERATOR"].includes(current.user.role)) await load(current.accessToken);
    }).catch(() => { if (active) setError("Your session could not be loaded. Please sign in again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);
  useEffect(() => {
    if (!selectedProduct) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !adjusting) setSelectedProduct(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedProduct, adjusting]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProduct || !session?.accessToken || adjusting) return;
    if (!Number.isSafeInteger(newStock) || newStock < (selectedProduct.inventory?.reservedQuantity || 0)) {
      setError("Stock must be a whole number at least as large as the reserved quantity."); return;
    }
    setAdjusting(true); setError("");
    try {
      await adjustAdminInventory(session.accessToken, selectedProduct.id, newStock);
      setFeedback(`Stock updated for ${selectedProduct.name}: ${newStock} total units.`);
      setSelectedProduct(null);
      window.dispatchEvent(new Event("himatu:catalogue-updated"));
      await load(session.accessToken);
    } catch (err) { setError(err instanceof Error ? err.message : "Stock could not be saved. Please retry."); }
    finally { setAdjusting(false); }
  }
  const allGroups = inventoryGroups(products, grouping);
  const groups = inventoryGroups(products, grouping, search, stockFilter).filter(group => category === "all" || group.id === category);
  const low = products.filter(product => availableStock(product) > 0 && availableStock(product) <= 5).length;
  const out = products.filter(product => availableStock(product) === 0).length;
  const count = groups.reduce((sum, group) => sum + group.products.length, 0);
  if (loading) return <p role="status">Loading inventory…</p>;
  if (!session || !["ADMIN", "MODERATOR"].includes(session.user.role)) return <p>Administrator access is required.</p>;
  return <div className="inventory-workspace">
    <div className="admin-page-header"><div className="admin-page-title-group"><h1>Inventory & Stock Control</h1><p>Your products, organised by category. Track available units and update stock.</p></div><button className="admin-btn admin-btn--secondary" type="button" disabled={!session.accessToken} onClick={() => session.accessToken && load(session.accessToken)}><RefreshCw size={16} /> Refresh inventory</button></div>
    {feedback && <p className="inventory-feedback" role="status">{feedback}</p>}
    {error && !selectedProduct && <p className="inventory-error" role="alert">{error}</p>}
    <div className="admin-card inventory-controls">
      <div className="inventory-stock-tabs" aria-label="Stock status">{([['all', `All products (${products.length})`],['low', `Low stock (${low})`],['out', `Out of stock (${out})`]] as const).map(([value,label]) => <button key={value} className="admin-btn admin-btn--secondary" type="button" aria-pressed={stockFilter === value} onClick={() => setStockFilter(value)}>{label}</button>)}</div>
      <div className="inventory-filter-grid">
        <label className="field"><span>Group products by</span><select aria-label="Group products by" value={grouping} onChange={event => { setGrouping(event.target.value as InventoryGrouping); setCategory("all"); }}><option value="product-type">Product category</option><option value="franchise">Franchise / Universe</option></select></label>
        <label className="field"><span>{grouping === "product-type" ? "Product category" : "Franchise"}</span><select aria-label={grouping === "product-type" ? "Product category" : "Franchise"} value={category} onChange={event => setCategory(event.target.value)}><option value="all">Show all</option>{allGroups.map(group => <option key={group.id} value={group.id}>{group.name} ({group.products.length})</option>)}</select></label>
        <label className="field"><span>Search inventory</span><input type="search" placeholder="Name, SKU or franchise" value={search} onChange={event => setSearch(event.target.value)} /></label>
      </div>
    </div>
    <p className="inventory-result-count" role="status">{count} products · {groups.length} {grouping === "product-type" ? "categories" : "franchises"}</p>
    {!groups.length && <div className="admin-card inventory-empty"><Boxes size={28} /><h2>No matching products</h2><p>Try another category, stock status or search.</p><button className="admin-btn admin-btn--secondary" type="button" onClick={() => { setSearch(""); setCategory("all"); setStockFilter("all"); }}>Clear filters</button></div>}
    {groups.map(group => <section className="admin-card inventory-group" key={group.id} aria-labelledby={`inventory-${group.id}`}>
      <div className="inventory-group-heading"><div><p>{grouping === "product-type" ? "Product category" : "Franchise"}</p><h2 id={`inventory-${group.id}`}>{group.name}</h2></div><span>{group.products.length} products · {group.products.reduce((sum,p) => sum + availableStock(p), 0)} available units</span></div>
      <div className="admin-table-wrap"><table className="admin-table inventory-table"><thead><tr><th>Product</th><th>Franchise</th><th>Total</th><th>Reserved</th><th>Available</th><th>Status</th><th>Action</th></tr></thead><tbody>{group.products.map(product => {
        const available = availableStock(product), primary = product.images.find(image => image.isPrimary) || product.images[0];
        return <tr key={product.id}><td data-label="Product"><div className="inventory-product">{primary && <img src={primary.imageUrl} alt="" width={44} height={52} loading="lazy" />}<div><strong>{product.name}</strong><small>{product.sku}{!product.isActive ? " · Archived" : ""}</small></div></div></td><td data-label="Franchise">{product.category?.name || "Unassigned"}</td><td data-label="Total">{product.inventory?.quantity || 0}</td><td data-label="Reserved">{product.inventory?.reservedQuantity || 0}</td><td data-label="Available"><strong>{available}</strong></td><td data-label="Status"><span className={`admin-badge admin-badge--${available === 0 ? "red" : available <= 5 ? "amber" : "green"}`}>{available === 0 ? "Out of stock" : available <= 5 ? "Low stock" : "In stock"}</span></td><td data-label="Action"><button className="admin-btn admin-btn--secondary" type="button" aria-label={`Update stock for ${product.name}`} onClick={() => { setError(""); setSelectedProduct(product); setNewStock(product.inventory?.quantity || 0); }}><Edit2 size={14} /> Update stock</button></td></tr>;
      })}</tbody></table></div>
    </section>)}
    <Modal open={Boolean(selectedProduct)} onClose={() => { if (!adjusting) setSelectedProduct(null); }} title="Update inventory stock" className="inventory-stock-modal">
      {selectedProduct && <form onSubmit={save}><div className="admin-modal-body"><h4>{selectedProduct.name}</h4><label className="field"><span>Warehouse quantity (units)</span><input autoFocus type="number" required min={selectedProduct.inventory?.reservedQuantity || 0} step={1} value={newStock} onChange={event => setNewStock(Number(event.target.value))} /></label><p>{selectedProduct.inventory?.reservedQuantity || 0} units reserved. Available after saving: {Math.max(0, newStock - (selectedProduct.inventory?.reservedQuantity || 0))}.</p>{error && <p className="inventory-error" role="alert">{error}</p>}</div><div className="admin-modal-footer"><button className="admin-btn admin-btn--secondary" disabled={adjusting} type="button" onClick={() => setSelectedProduct(null)}>Cancel</button><button className="admin-btn admin-btn--primary" disabled={adjusting} type="submit">{adjusting ? "Saving…" : "Confirm stock level"}</button></div></form>}
    </Modal>
  </div>;
}
