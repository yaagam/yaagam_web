import { Loader2, Lock } from "lucide-react";

export default function PoojaBookingLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Preparing booking"
      className="min-h-screen bg-[#fbfbfd] px-4 py-6 text-[#061b4d] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b border-[#e3e7ef] pb-5">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-[#e9edf5]" />
          <div className="flex items-center gap-2 text-xs font-semibold text-[#657087]">
            <Lock className="h-4 w-4 text-emerald-600" />
            Secure booking
          </div>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-[#e3e7ef] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-saffron" />
              <div>
                <h1 className="text-lg font-extrabold">Preparing your pooja booking</h1>
                <p className="mt-1 text-sm font-medium text-[#657087]">
                  Loading pooja details and available offerings…
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-5">
              <div className="h-12 animate-pulse rounded-xl bg-[#f0f2f7]" />
              <div className="h-12 animate-pulse rounded-xl bg-[#f0f2f7]" />
              <div className="h-12 animate-pulse rounded-xl bg-[#f0f2f7]" />
              <div className="h-28 animate-pulse rounded-xl bg-[#f0f2f7]" />
            </div>
          </section>
          <aside className="h-72 animate-pulse rounded-2xl border border-[#e3e7ef] bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}