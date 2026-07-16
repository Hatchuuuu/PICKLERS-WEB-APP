import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PicklersLogo } from "@/components/ui/PicklersLogo";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl md:text-5xl font-rajdhani font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-ink-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert prose-p:text-ink-muted prose-headings:font-rajdhani prose-headings:text-white max-w-none">
          <p>
            Welcome to PICKLERS! We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our 
            website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
          </p>

          <h2>1. Important Information and Who We Are</h2>
          <p>
            This privacy policy aims to give you information on how PICKLERS collects and processes your 
            personal data through your use of this website, including any data you may provide through this 
            website when you sign up for an account, book a court, or take part in open play.
          </p>

          <h2>2. The Data We Collect About You</h2>
          <p>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul>
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of courts you have booked from us.</li>
            <li><strong>Profile Data</strong> includes your username and password, purchases or bookings made by you, your interests, preferences, feedback and survey responses.</li>
          </ul>

          <h2>3. How We Use Your Personal Data</h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul>
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g. processing a booking).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2>4. Authentication & Third Party Logins</h2>
          <p>
            If you choose to log in or sign up using a third-party authentication service (such as Google or Facebook), 
            we will collect your basic profile information (such as your name and email address) from that provider to create and manage your account on PICKLERS.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
            <br />
            <strong>Email:</strong> support@picklers.ph
          </p>
        </div>
      </main>
    </div>
  );
}
