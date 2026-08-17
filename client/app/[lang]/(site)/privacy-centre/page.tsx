import type { Metadata } from "next";

import { PrivacyRequestForm } from "@/components/privacy/PrivacyRequestForm";

export const metadata: Metadata = {
  title: "Privacy Centre | Yaagam",
  description:
    "Submit a personal data request, consent withdrawal, account deletion request, nomination, or privacy grievance to Yaagam.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return (
    <main className="bg-[#fffaf4] py-12 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-saffron">
            Your data, your choices
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-text-primary md:text-4xl">
            Privacy Centre
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-primary/70">
            Use this form to request access, correction, or erasure of your
            personal data, withdraw consent, delete your account, register a
            nominee, or raise a privacy grievance. We may ask you to verify
            your identity before completing the request.
          </p>
        </header>

        <PrivacyRequestForm />
      </div>
    </main>
  );
}
