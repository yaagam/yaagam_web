import Link from "next/link";

import { APP_ROUTES } from "@/constants/route.const";

export function CollectionPrivacyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs leading-5 text-text-primary/60">
      {children} We use this information only for that purpose and related security or legal obligations. You may withdraw consent or request access, correction or deletion through{" "}
      <Link className="font-semibold text-saffron underline underline-offset-2" href={APP_ROUTES.privacyPolicy}>
        our Privacy Policy
      </Link>{" "}
      or support@yaagam.in.
    </p>
  );
}
