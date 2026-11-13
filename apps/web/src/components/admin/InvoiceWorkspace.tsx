"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { InvoiceReview } from "./InvoiceReview";
export function InvoiceWorkspace({orderId}:{orderId:string}) {
  const [session,setSession]=useState<CustomerSession|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;authService.getSession().then(value=>{if(active)setSession(value);}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  if(loading)return <p role="status">Loading invoice…</p>;
  if(session?.user.role!=="ADMIN"||!session.accessToken)return <p role="alert">Administrator access is required to review invoices.</p>;
  return <div><div className="admin-page-header"><h1>Review invoice</h1><Link href="/admin/social-orders" className="admin-btn admin-btn--secondary">Back to order requests</Link></div><InvoiceReview key={orderId} orderId={orderId} token={session.accessToken}/></div>;
}
