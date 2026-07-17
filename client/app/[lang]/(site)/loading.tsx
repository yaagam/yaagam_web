import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center bg-white px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-saffron" />
        <p className="text-sm font-extrabold text-text-primary/65">Loading</p>
      </div>
    </main>
  );
}