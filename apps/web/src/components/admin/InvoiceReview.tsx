"use client";
import { useEffect, useState } from "react";
import { commerceRequest, downloadInvoicePdf, getInvoicePdfUrl } from "@/lib/commerce-api";
type ReviewedInvoice = {sentAt?:string|null;snapshot:{totalAmount:number;paidAmount?:number;paymentStatus:string}};
export function InvoiceReview({orderId,token}:{orderId:string;token:string}) {
  const [invoice,setInvoice]=useState<ReviewedInvoice|null>(null);
  const [paidAmount,setPaidAmount]=useState(0);
  const [pdfUrl,setPdfUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(true);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true;let url="";
    async function prepare(){
      try {
        const reviewed=await commerceRequest<ReviewedInvoice>(`/admin/invoices/${encodeURIComponent(orderId)}/review`,{method:"POST",token});
        if(!active)return;
        url=await getInvoicePdfUrl(token,orderId);
        if(!active){URL.revokeObjectURL(url);return;}
        setInvoice(reviewed);setPaidAmount(reviewed.snapshot.paidAmount ?? (reviewed.snapshot.paymentStatus === "PAID" ? reviewed.snapshot.totalAmount : 0));setPdfUrl(url);setError("");
      }catch(reason){if(active)setError(reason instanceof Error?reason.message:"The invoice could not be loaded.");}
      finally{if(active)setBusy(false);}
    }
    void prepare();
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[orderId,token,revision]);
  const refresh=()=>{setBusy(true);setError("");setPdfUrl("");setInvoice(null);setRevision(value=>value+1);};
  const savedPaid=invoice?.snapshot.paidAmount ?? (invoice?.snapshot.paymentStatus === "PAID" ? invoice.snapshot.totalAmount : 0);
  const dirty=paidAmount!==savedPaid;
  return <section className="admin-card invoice-pdf-review">
    <h2>Invoice PDF</h2>
    {invoice&&<div className="staff-form-grid">
      <p><strong>Total: BDT {invoice.snapshot.totalAmount.toLocaleString()}</strong></p>
      <label className="field"><span>Paid amount · BDT</span><input type="number" min="0" max={invoice.snapshot.totalAmount} step="1" value={paidAmount} disabled={busy||!!invoice.sentAt} onChange={e=>setPaidAmount(Number(e.target.value))}/></label>
      <p><strong>Amount due: BDT {Math.max(0,invoice.snapshot.totalAmount-paidAmount).toLocaleString()}</strong></p>
      <button type="button" className="admin-btn admin-btn--secondary" disabled={busy||!!invoice.sentAt||!dirty||!Number.isSafeInteger(paidAmount)||paidAmount<0||paidAmount>invoice.snapshot.totalAmount} onClick={async()=>{
        setBusy(true);setError("");try{await commerceRequest(`/admin/invoices/${encodeURIComponent(orderId)}/payment`,{method:"PATCH",token,body:JSON.stringify({paidAmount})});refresh();}catch(reason){setError(reason instanceof Error?reason.message:"Payment could not be saved");setBusy(false);}
      }}>Save paid amount & update PDF</button>
    </div>}
    {error&&<p role="alert" className="staff-error">{error}</p>}
    {error.includes("delivery")&&<button type="button" className="admin-btn admin-btn--secondary" disabled={busy} onClick={async()=>{
      if(!window.confirm("Have you checked the sender delivery log and confirmed that this invoice was NOT delivered?"))return;
      try{await commerceRequest(`/admin/invoices/${encodeURIComponent(orderId)}/unlock`,{method:"POST",token,body:JSON.stringify({deliveryChecked:true})});refresh();}
      catch(reason){setError(reason instanceof Error?reason.message:"Unlock failed");}
    }}>Sender log checked: allow retry</button>}
    <div className="staff-actions">
      <button type="button" className="admin-btn admin-btn--secondary" disabled={busy} onClick={refresh}>Refresh invoice</button>
      {pdfUrl&&<>
        <a className="admin-btn admin-btn--secondary" href={pdfUrl} target="_blank" rel="noopener noreferrer">Open PDF</a>
        <button type="button" className="admin-btn admin-btn--secondary" disabled={busy} onClick={async()=>{
          setBusy(true);try{await downloadInvoicePdf(token,orderId);}catch(reason){setError(reason instanceof Error?reason.message:"Download failed");}finally{setBusy(false);}
        }}>Download PDF</button>
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy||!!invoice?.sentAt||dirty} onClick={async()=>{
          setBusy(true);setError("");
          try{await commerceRequest(`/admin/invoices/${encodeURIComponent(orderId)}/send`,{method:"POST",token});setInvoice(current=>current?{...current,sentAt:new Date().toISOString()}:null);}
          catch(reason){setError(reason instanceof Error?reason.message:"Email failed");}
          finally{setBusy(false);}
        }}>{invoice?.sentAt?"Invoice emailed":"Approve & email invoice to customer"}</button>
      </>}
    </div>
    {busy&&!pdfUrl&&<p role="status">Preparing invoice PDF…</p>}
    {pdfUrl&&<iframe title="Customer invoice PDF" src={`${pdfUrl}#toolbar=1&navpanes=0`} className="invoice-pdf-frame" />}
  </section>;
}
