// Shared by drawers and modals so closing one overlay never leaves the page locked.
const locks = new Set<symbol>();
let previousOverflow = "";
export function lockBodyScroll() {
  const token = Symbol("scroll-lock");
  if (!locks.size) previousOverflow = document.body.style.overflow;
  locks.add(token);
  document.body.style.overflow = "hidden";
  return () => {
    if (!locks.delete(token)) return;
    if (!locks.size) document.body.style.overflow = previousOverflow;
  };
}
