import { redirect } from "next/navigation";
import { AUTH_ENTRY_PATH } from "@/lib/routes";

export default function RootPage() {
  redirect(AUTH_ENTRY_PATH);
}