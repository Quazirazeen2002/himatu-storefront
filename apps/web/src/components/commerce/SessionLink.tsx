"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  authService,
  accountHref,
  type CustomerSession,
} from "@/lib/auth-service";
export function SessionLink({ className }: { className?: string }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const path = usePathname();
  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return (
    <Link href={accountHref(session)} className={className}>
      {session ? "MY ACCOUNT" : "SIGN IN"}
    </Link>
  );
}
