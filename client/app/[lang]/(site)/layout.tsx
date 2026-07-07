import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";

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
        <Footer />
      </div>
      <SupportChatWidget />
    </>
  );
}
