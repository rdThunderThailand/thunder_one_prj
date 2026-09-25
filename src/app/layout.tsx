import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const SITE_NAME = "ThunderOne";
const TAGLINE = "Empowered People. Connected Organization.";
const DESCRIPTION =
  "ThunderOne รวมทุก Workspace ขององค์กรไว้ในที่เดียว — บุคลากร สินทรัพย์ สื่อและจอแสดงผล งานบริการ และลูกค้า เพื่อให้ทุกทีมทำงานร่วมกันได้อย่างไม่มีสะดุด";

// Absolute URLs for Open Graph/Twitter images and canonical links. Set
// NEXT_PUBLIC_SITE_URL per environment; on Vercel the production domain is
// picked up automatically when it isn't set.
function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

// Tab titles read "ThunderOne | Empowered People. Connected Organization."
// on pages without their own title, and "<page> | ThunderOne" everywhere
// else (each App's layout and the shell pages set theirs).
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE_NAME} | ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["ThunderOne", "Thunder One", "workspace", "HR", "asset management", "digital signage", "DOOH", "Thunder"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${TAGLINE}`,
    description: DESCRIPTION,
    locale: "th_TH",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${TAGLINE}`,
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#075df7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${manrope.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
