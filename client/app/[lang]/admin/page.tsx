import { CheckCircle2, Users } from "lucide-react";
import {
  ADMIN_DASHBOARD_BOOKINGS,
  ADMIN_DASHBOARD_SCHEDULE,
  ADMIN_DASHBOARD_STATS,
} from "@/constants/admin-dashboard.const";
export default function AdminPage() {
  return (
    <div className="w-full pb-16">
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">
              Dashboard
            </h1>
            <p className="mt-3 text-base leading-7 text-text-primary/70 sm:text-lg">
              Monitor bookings, pooja schedules, prasad dispatch, and devotee
              service tasks from one place.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_DASHBOARD_STATS.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-5 text-text-primary/60">
                      {stat.label}
                    </p>
                    <strong className="mt-2 block text-3xl font-extrabold leading-9 text-text-primary">
                      {stat.value}
                    </strong>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-5 text-text-primary/55">
                  {stat.change}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div
          id="booking-queue"
          className="rounded-lg border border-black/10 bg-white shadow-sm"
        >
          <div className="border-b border-black/10 p-5">
            <h2 className="text-xl font-extrabold leading-7 text-text-primary">
              Booking Queue
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-primary/65">
              Recent devotee requests waiting for admin review.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            {ADMIN_DASHBOARD_BOOKINGS.map((booking) => (
              <article
                key={`${booking.devotee}-${booking.pooja}`}
                className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-center"
              >
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold leading-6 text-text-primary">
                    {booking.devotee}
                  </h3>
                  <p className="text-sm leading-6 text-text-primary/65">
                    {booking.pooja}
                  </p>
                </div>
                <p className="text-sm font-semibold leading-6 text-text-primary/70">
                  {booking.temple}
                </p>
                <span className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-extrabold text-[#207a3c]">
                  {booking.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <section id="schedule" className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-saffron" />
              <h2 className="text-lg font-extrabold leading-7 text-text-primary">
                Admin Tasks
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {ADMIN_DASHBOARD_SCHEDULE.map((task) => (
                <div key={task} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                  <p className="text-sm font-semibold leading-6 text-text-primary/75">
                    {task}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="dispatch" className="rounded-lg border border-saffron/25 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold leading-7 text-text-primary">
              Dispatch Summary
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-primary/65">
              Track prasad packages, address checks, and ceremony completion
              updates for confirmed bookings.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
