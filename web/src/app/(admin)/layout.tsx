import type { Metadata } from "next";

/**
 * Parent server-component layout for the (admin) route group.
 *
 * F-211: every page inside /app/admin/* is internal console tooling
 * (user management, applications, audit log). Those pages must not be
 * indexed by Google. This layout exports a noindex robots meta for the
 * entire route group, which Next.js applies to every nested route
 * unless a child overrides it.
 *
 * The actual app chrome (sidebar, command palette, header) lives in
 * the client `app/(admin)/app/admin/layout.tsx`, which is a child of
 * this server component. Children are passed through unchanged.
 */
export const metadata: Metadata = {
  title: {
    template: "%s | Picklers Admin",
    default: "Admin Console | PICKLERS",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noarchive: true, nosnippet: true },
  },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
