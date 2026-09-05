/**
 * Single source of truth for the landing-page FAQ list.
 *
 * Used by:
 * - `LandingFAQ` (the visual accordion on the landing page)
 * - the JSON-LD `FAQPage` structured data in `app/page.tsx`
 *   (consumed by Google for rich-result eligibility)
 *
 * F-206: before this file existed, the two surfaces hardcoded the same
 * four Q/A pairs in two places. Updating one and forgetting the other
 * would silently break Google's structured-data contract. Now both
 * consumers import this constant.
 */
export type LandingFaq = {
  q: string;
  a: string;
};

export const LANDING_FAQS: readonly LandingFaq[] = [
  {
    q: "Is Picklers free to use?",
    a: "Yes, joining the platform and browsing venues is completely free. You only pay for the courts you book or the open play sessions you join, plus a small platform fee.",
  },
  {
    q: "How do cancellations work?",
    a: "You can cancel any booking up to 24 hours in advance for a full refund. Cancellations made within 24 hours are subject to the venue's specific policy.",
  },
  {
    q: "Can I host my own private matches?",
    a: "Absolutely. You can book a court and keep it private for your group, or open it up for others to join and split the cost.",
  },
  {
    q: "Are there skill levels for open play?",
    a: "Yes! Every open play session displays the target skill level (Beginner, Intermediate, Advanced), so you'll always find a match that fits your competitive level.",
  },
] as const;
