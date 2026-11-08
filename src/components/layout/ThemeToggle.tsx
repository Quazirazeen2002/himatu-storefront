"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "../ui/Primitives";

export function ThemeToggle() {
  return (
    <IconButton
      label="Toggle light and dark theme"
      title="Switch between light and dark theme"
      onClick={() => {
        const theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        try {
          localStorage.setItem("himatu-theme", theme);
        } catch {
          // The selection still works when browser storage is unavailable.
        }
      }}
    >
      <Sun className="theme-light-icon" size={20} aria-hidden="true" />
      <Moon className="theme-dark-icon" size={20} aria-hidden="true" />
    </IconButton>
  );
}
