import type { Metadata } from "next";
import { Inter, Montserrat, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/index.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  // F-211: explicit metadataBase so OG/Twitter image URLs resolve to
  // picklers.ph on every deployment (Vercel preview URLs would otherwise
  // be embedded in shared link previews).
  metadataBase: new URL('https://picklers.ph'),
  title: {
    template: '%s | PICKLERS',
    default: 'PICKLERS | Find & Book Pickleball Courts in the Philippines',
  },
  description: 'Discover premium pickleball facilities, join open play sessions, and connect with players across the Philippines. Book courts instantly and split payments with friends.',
  applicationName: 'PICKLERS',
  keywords: ['pickleball', 'Philippines', 'court booking', 'open play', 'tournaments', 'BGC', 'Makati', 'Quezon City'],
  authors: [{ name: 'PICKLERS' }],
  creator: 'PICKLERS',
  publisher: 'PICKLERS',
  // F-211: theme-color matches the actual surface tokens. The PWA team
  // can later wire this to a `meta` driven by next-themes, but a static
  // pair (light + dark media query) is the standard cross-platform setup.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1628' },
  ],
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    title: 'PICKLERS | Find & Book Pickleball Courts in the Philippines',
    description: 'Discover premium pickleball facilities, join open play sessions, and connect with players across the Philippines. Book courts instantly and split payments with friends.',
    url: 'https://picklers.ph',
    siteName: 'PICKLERS',
    // F-211: og-image.jpg was referenced but never created in /public,
    // causing every shared link preview to 404 the image. Falling back to
    // the real brand mark SVG that ships in /public. A designed 1200x630
    // PNG is a follow-up design task tracked separately.
    images: [
      {
        url: '/PICKLERS_OFFICIAL_LOGO.svg',
        width: 1200,
        height: 630,
        alt: 'PICKLERS - Find and Book Pickleball Courts',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PICKLERS | Find & Book Pickleball Courts in the Philippines',
    description: 'Discover premium pickleball facilities, join open play sessions, and connect with players across the Philippines. Book courts instantly and split payments with friends.',
    images: ['/PICKLERS_OFFICIAL_LOGO.svg'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/PICKLERS_OFFICIAL_LOGO.svg',
  },
  robots: {
    // The root marketing page is indexable. The /app/* route groups opt
    // out individually via their own layouts (see player/owner/admin
    // layouts). We keep the root permissive so the marketing funnel
    // gets crawled.
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://picklers.ph',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // F-211: the previous markup declared a `LocalBusiness` with a fake
  // Manila address, fake phone, hardcoded geo (14.5995/120.9842), and
  // claimed to be open every day 08:00-22:00. That is structurally wrong
  // for a multi-venue marketplace spanning the Philippines and would be
  // rejected by Google's structured-data review. We now emit an
  // `Organization` (no physical address required) plus a `WebSite`
  // (the standard pair for a SaaS marketplace).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PICKLERS",
    url: "https://picklers.ph",
    logo: "https://picklers.ph/PICKLERS_OFFICIAL_LOGO.svg",
    sameAs: [
      "https://facebook.com/picklersph",
      "https://instagram.com/picklersph",
      "https://x.com/picklersph",
    ],
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PICKLERS",
    url: "https://picklers.ph",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${montserrat.variable} ${outfit.variable} ${plusJakarta.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}