import localFont from "next/font/local";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StoreProvider } from "@/components/commerce/StoreProvider";
import "./globals.css";
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["Arial"],
});
const barlow = localFont({
  src: [
    {
      path: "./fonts/barlow-condensed-bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/barlow-condensed-extrabold-italic.woff2",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-barlow",
  display: "swap",
  fallback: ["Arial"],
});
const geistMono = localFont({
  src: "./fonts/geist-mono-latin-variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["monospace"],
});
export const metadata: Metadata = {
  title: {
    default: "HIMATU — Discover. Collect. Display.",
    template: "%s | HIMATU",
  },
  description:
    "Discover, collect and display authentic anime figures and collectibles in Bangladesh.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${barlow.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('himatu-theme')==='light'?'light':'dark'}catch{document.documentElement.dataset.theme='dark'}`,
          }}
        />
      </head>
      <body>
        <StoreProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
