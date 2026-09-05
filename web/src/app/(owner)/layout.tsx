import type { Metadata } from "next";

/**
 * Parent server-component layout for the (owner) route group.
 *
 * F-211: every page inside /app/owner/* shows owner-private data
 * (earnings, courts, messages, applications). Those pages must not be
 * indexed by Google. This layout exports a noindex robots meta for the
 * entire route group, which Next.js applies to every nested route
 * unless a child overrides it.
 *
 * The actual app chrome (sidebar, header, demo banner) lives in the
 * client `app/(owner)/app/owner/layout.tsx`, which is a child of this
 * server component. Children are passed through unchanged.
 */
export const metadata: Metadata = {
  title: {
    template: "%s | Picklers Owner",
    default: "Owner Dashboard | PICKLERS",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OwnerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
