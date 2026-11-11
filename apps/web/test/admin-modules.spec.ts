import { inactiveAdminModule } from "../src/lib/admin-modules";
it("marks inactive payments and production sections, including nested URLs",()=>{
 expect(inactiveAdminModule("/admin/payments")?.label).toBe("Payments");
 expect(inactiveAdminModule("/admin/3d-printing/production/order-1")?.label).toBe("Production Kanban");
});
it("keeps current shopping operations and printing enquiries active",()=>{
 for(const path of ["/admin","/admin/products","/admin/inventory","/admin/orders","/admin/social-orders","/admin/analytics","/admin/content","/admin/staff","/admin/3d-printing"])expect(inactiveAdminModule(path)).toBeUndefined();
});
