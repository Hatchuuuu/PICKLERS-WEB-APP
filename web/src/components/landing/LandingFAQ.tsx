"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { LANDING_FAQS } from "./landingFaqs";

/**
 * LandingFAQ — extracted from app/page.tsx as part of P2.3 (landing page RSC
 * split). Before: the entire 1193-LOC landing page shipped as one client
 * component, so this small accordion hydrated with the rest. After: this is a
 * small self-contained client island. The static FAQ list is now sourced from
 * `./landingFaqs` (P2.10) so the visual accordion and the JSON-LD structured
 * data on the page stay in lockstep.
 */
export function LandingFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {LANDING_FAQS.map((faq, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: i * 0.05 }}
          className={`overflow-hidden rounded-2xl transition-colors duration-300 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            openFaq === i
              ? "bg-black/[0.04] border-black/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08]"
              : "bg-black/[0.02] border-black/[0.04] dark:bg-white/[0.02] dark:border-white/[0.04]"
          }`}
          onClick={() => setOpenFaq(openFaq === i ? null : i)}
          role="button"
          tabIndex={0}
          aria-expanded={openFaq === i}
          aria-controls={`faq-answer-${i}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenFaq(openFaq === i ? null : i);
            }
          }}
        >
          <div className="px-6 py-5 flex items-center justify-between">
            <h3
              className="text-base font-semibold tracking-tight pr-4 text-foreground"
              id={`faq-question-${i}`}
            >
              {faq.q}
            </h3>
            <motion.div
              animate={{ rotate: openFaq === i ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="text-emerald-500/70"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </div>
          <AnimatePresence initial={false}>
            {openFaq === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
              >
                <div
                  className="px-6 pb-5 pt-0 text-[15px] leading-relaxed"
                  style={{ color: "var(--ink-muted)" }}
                >
                  <motion.div
                    initial={{ y: -8 }}
                    animate={{ y: 0 }}
                    exit={{ y: -8 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {faq.a}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
