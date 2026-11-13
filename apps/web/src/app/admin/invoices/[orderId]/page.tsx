import { InvoiceWorkspace } from "@/components/admin/InvoiceWorkspace";
export const metadata={title:"Review invoice · HIMATU"};
export default async function InvoicePage({params}:{params:Promise<{orderId:string}>}){
  const {orderId}=await params;
  return <InvoiceWorkspace orderId={orderId}/>;
}
