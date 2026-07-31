import { PreProductionNoticeSession } from "@/components/layout/PreProductionNoticeSession";

export default function SiteTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PreProductionNoticeSession />
      {children}
    </>
  );
}
