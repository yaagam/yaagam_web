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
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <Footer />
      <SupportChatWidget />
    </>
  );
}
