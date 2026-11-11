"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { lockBodyScroll } from "@/lib/scroll-lock";
import { X } from "lucide-react";
import { IconButton } from "./Primitives";
export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      const unlock = lockBodyScroll();
      return () => {
        unlock();
        dialog.close();
      };
    }
    dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      style={{ margin: "auto" }}
      aria-label={title}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="drawer-header">
          <h2>{title}</h2>
          <IconButton label={`Close ${title}`} onClick={onClose}>
            <X />
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}
