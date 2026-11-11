import { commerceRequest } from "./commerce-api";
import type { SocialRequestInput } from "@himatu/shared";
export const socialOrderChannels = [
  { id: "whatsapp", name: "WhatsApp", url: "https://wa.me/8801714546809" },
  { id: "instagram", name: "Instagram", url: "https://ig.me/m/himatuofficial" },
  { id: "facebook", name: "Facebook", url: "https://m.me/Himatuofficial" },
  {
    id: "tiktok",
    name: "TikTok",
    url: "https://www.tiktok.com/@otaku.vault.bd",
  },
] as const;
export type SocialOrderChannel = (typeof socialOrderChannels)[number]["id"];
export const channelLink = (channel: SocialOrderChannel, message: string) =>
  channel === "whatsapp"
    ? `https://wa.me/8801714546809?text=${encodeURIComponent(message)}`
    : socialOrderChannels.find((c) => c.id === channel)!.url;
export async function registerSocialOrder(
  token: string,
  input: Omit<SocialRequestInput, "clientReference">,
) {
  const data = JSON.stringify(input),
    digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(data),
    );
  const fingerprint = Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
  const key = "himatu-social-request-reference";
  let reference: { fingerprint: string; id: string } | null = null;
  try {
    reference = JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {}
  if (reference?.fingerprint !== fingerprint) {
    reference = { fingerprint, id: crypto.randomUUID() };
    try {
      sessionStorage.setItem(key, JSON.stringify(reference));
    } catch {}
  }
  const send = (id:string) => commerceRequest<{id:string;status?:string}>("/social-orders", {method:"POST",token,body:JSON.stringify({...input,clientReference:id})});
  const result = await send(reference!.id);
  // A later purchase of the same selection is a new request after staff close the old one.
  if(result.status && result.status !== "PENDING") {
    reference = {fingerprint,id:crypto.randomUUID()};
    try {sessionStorage.setItem(key,JSON.stringify(reference));} catch {}
    return send(reference.id);
  }
  return result;
}
