import { ArrowUpRight, Youtube } from "lucide-react";
import { videoSocialLinks } from "@/lib/social-links";

function TikTokIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 2h-3.3v13.7a3 3 0 1 1-2.6-3v-3.4a6.4 6.4 0 1 0 6 6.4V8.8a8.2 8.2 0 0 0 4.8 1.5V7a4.9 4.9 0 0 1-4.9-5Z" /></svg>;
}
export function VideoSocialLinks() {
  return videoSocialLinks.map(link => <a key={link.name} className={link.className} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Follow HIMATU on ${link.name} (opens in new tab)`}>{link.name === "YouTube" ? <Youtube size={22} aria-hidden="true" /> : <TikTokIcon />}<span>{link.name}<small>{link.handle}</small></span><ArrowUpRight size={16} aria-hidden="true" /></a>);
}
