import {
  FooterDetailsSection,
  FooterLegalSection,
} from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { PageFooterTransition } from "@/components/layout/PageFooterTransition";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="flex w-full flex-1 flex-col pb-20 md:pb-0">
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <PageFooterTransition />

        <div className="site-layout-footer">
          <FooterDetailsSection />
          <FooterLegalSection />
        </div>
      </div>
      <SupportChatWidget />
    </>
  );
}
