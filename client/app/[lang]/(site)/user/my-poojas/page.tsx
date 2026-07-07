import type { Metadata } from "next";

import { MyPoojasPage } from "@/components/blocks/my-poojas/MyPoojasPage";

export const metadata: Metadata = {
  title: "My Poojas | Yaagam",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <MyPoojasPage />;
}