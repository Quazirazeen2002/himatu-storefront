import { lockBodyScroll } from "../src/lib/scroll-lock";
it("restores scrolling after overlapping modal and drawer lifetimes", () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,"document");
  const style={overflow:"auto"};
  Object.defineProperty(globalThis,"document",{configurable:true,value:{body:{style}}});
  const closeModal=lockBodyScroll(),closeDrawer=lockBodyScroll();
  try {
    expect(style.overflow).toBe("hidden");
    closeModal();expect(style.overflow).toBe("hidden");
    closeDrawer();expect(style.overflow).toBe("auto");
    closeDrawer();expect(style.overflow).toBe("auto");
  } finally {closeModal();closeDrawer();if(original)Object.defineProperty(globalThis,"document",original);else Reflect.deleteProperty(globalThis,"document");}
});
