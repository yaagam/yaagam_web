"use client";

import { type SubmitEvent, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { createPrivacyRequest, type PrivacyRequestType } from "@/lib/api/privacy/privacy.api";
import { getErrorMessage } from "@/lib/utils";

const REQUEST_TYPES: Array<{ value: PrivacyRequestType; label: string }> = [
  { value: "ACCESS", label: "Access my personal data" },
  { value: "CORRECTION", label: "Correct or complete my personal data" },
  { value: "ERASURE", label: "Erase personal data no longer required" },
  { value: "WITHDRAW_CONSENT", label: "Withdraw consent" },
  { value: "ACCOUNT_DELETION", label: "Delete my account" },
  { value: "NOMINATION", label: "Register or update a nominee" },
  { value: "GRIEVANCE", label: "Raise a privacy grievance" },
];

export function PrivacyRequestForm() {
  const { language } = useLanguage();
  const [requestType, setRequestType] = useState<PrivacyRequestType>("ACCESS");
  const [details, setDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error: boolean; message: string } | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = details.trim();
    if (value.length < 10 || value.length > 2000 || !confirmed) {
      setResult({ error: true, message: "Complete the confirmation and provide 10–2,000 characters without OTPs, passwords or payment credentials." });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const response = await createPrivacyRequest({ requestType, details: value, preferredLanguage: language });
      setDetails("");
      setConfirmed(false);
      setResult({ error: false, message: `Request received. Reference: ${response.reference || "pending assignment"}. Identity verification may be required.` });
    } catch (error: unknown) {
      setResult({ error: true, message: getErrorMessage(error, "Unable to submit your request.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7" noValidate>
      <div>
        <label htmlFor="privacy-request-type" className="text-sm font-bold text-text-primary">Request type</label>
        <select id="privacy-request-type" value={requestType} onChange={(event) => setRequestType(event.target.value as PrivacyRequestType)} className="mt-2 h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-sm" required>
          {REQUEST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="privacy-request-details" className="text-sm font-bold text-text-primary">Request details</label>
        <textarea id="privacy-request-details" value={details} onChange={(event) => setDetails(event.target.value)} minLength={10} maxLength={2000} rows={6} className="mt-2 w-full rounded-lg border border-black/15 bg-white p-3 text-sm leading-6" placeholder="Describe the data, correction, consent, nominee or grievance involved." required />
        <p className="mt-1 text-xs text-text-primary/60">{details.length}/2,000 characters</p>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-text-primary/75">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required className="mt-1 h-4 w-4 accent-saffron" />
        <span>I confirm this request concerns me or someone I am lawfully authorised to represent.</span>
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Submitting securely…" : "Submit privacy request"}</Button>
      <p aria-live="polite" className={result?.error ? "text-sm font-semibold text-red-700" : "text-sm font-semibold text-green-700"}>{result?.message}</p>
    </form>
  );
}
