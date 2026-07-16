import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PicklersLogo } from "@/components/ui/PicklersLogo";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-ink-muted" />
            <span className="text-sm font-medium text-ink-muted">Back to Home</span>
          </Link>
          <Link href="/">
            <PicklersLogo size={32} />
          </Link>
          <div className="w-[100px]" /> {/* Spacer to center logo */}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-24 max-w-3xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-rajdhani font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-ink-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert prose-p:text-ink-muted prose-headings:font-rajdhani prose-headings:text-white max-w-none">
          <p>
            Welcome to PICKLERS. Please read these Terms of Service carefully before using our website and services.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            PICKLERS is a platform that allows users to discover, book, and participate in pickleball matches and court reservations at affiliated facilities.
          </p>

          <h2>3. Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>

          <h2>4. Bookings and Payments</h2>
          <p>
            All bookings made through the platform are subject to availability and the specific rules of the hosting facility. 
            Payments must be completed successfully to confirm a booking. Refunds and cancellations are governed by the specific 
            policy of the facility or match organizer.
          </p>

          <h2>5. Code of Conduct</h2>
          <p>
            Users agree to behave respectfully towards other players, facility staff, and the community. Any harassment, cheating, 
            or destructive behavior may lead to temporary or permanent bans from the platform and affiliated venues.
          </p>

          <h2>6. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            <strong>Email:</strong> support@picklers.ph
          </p>
        </div>
      </main>
    </div>
  );
}
