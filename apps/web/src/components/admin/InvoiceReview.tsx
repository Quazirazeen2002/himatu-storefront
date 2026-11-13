"use client";
import { useEffect, useState } from "react";
import { commerceRequest, downloadInvoicePdf, getInvoicePdfUrl } from "@/lib/commerce-api";
export function InvoiceReview({orderId,token}:{orderId:string;token:string}) {
  const [invoice,setInvoice]=useState<{sentAt?:string|null}|null>(null);
  const [pdfUrl,setPdfUrl]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(true);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true;let url="";
    async function prepare(){
      try {
        const reviewed=await commerceRequest<{sentAt?:string|null}>(`/admin/invoices/${encodeURIComponent(orderId)}/review`,{method:"POST",token});
        if(!active)return;
        url=await getInvoicePdfUrl(token,orderId);
        if(!active){URL.revokeObjectURL(url);return;}
        setInvoice(reviewed);setPdfUrl(url);setError("");
      }catch(reason){if(active)setError(reason instanceof Error?reason.message:"The invoice could not be loaded.");}
      finally{if(active)setBusy(false);}
    }
    void prepare();
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[orderId,token,revision]);
  const refresh=()=>{setBusy(true);setError("");setPdfUrl("");setInvoice(null);setRevision(value=>value+1);};
  return <section className="admin-card invoice-pdf-review">
    <h2>Invoice PDF</h2>
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
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy||!!invoice?.sentAt} onClick={async()=>{
          setBusy(true);setError("");
          try{await commerceRequest(`/admin/invoices/${encodeURIComponent(orderId)}/send`,{method:"POST",token});setInvoice({...invoice,sentAt:new Date().toISOString()});}
          catch(reason){setError(reason instanceof Error?reason.message:"Email failed");}
          finally{setBusy(false);}
        }}>{invoice?.sentAt?"Invoice emailed":"Approve & email invoice to customer"}</button>
      </>}
    </div>
    {busy&&!pdfUrl&&<p role="status">Preparing invoice PDF…</p>}
    {pdfUrl&&<iframe title="Customer invoice PDF" src={`${pdfUrl}#toolbar=1&navpanes=0`} className="invoice-pdf-frame" />}
  </section>;
}
