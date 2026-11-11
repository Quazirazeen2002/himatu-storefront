/** Temporarily inactive operations for the current social-order workflow. */
export const inactiveAdminModules = [
  {
    path: "/admin/payments",
    label: "Payments",
    reason:
      "Online payment processing is not active. Review payment details and confirmed orders in Orders.",
  },
  {
    path: "/admin/3d-printing/production",
    label: "Production Kanban",
    reason:
      "Production scheduling is currently unavailable. Review customer enquiries in Custom 3D Printing.",
  },
] as const;
export function inactiveAdminModule(path: string) {
  return inactiveAdminModules.find(
    (module) => path === module.path || path.startsWith(`${module.path}/`),
  );
}
