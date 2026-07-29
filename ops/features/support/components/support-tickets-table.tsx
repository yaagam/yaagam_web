"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Headphones, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { formatDate } from "@/lib/utils";
import { getSupportTickets, updateSupportTicketStatus } from "@/services/ops.service";
import type { SupportTicket, SupportTicketStatus } from "@/types/ops";

const supportStatuses: { value: SupportTicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" }
];

function formatStatus(status: SupportTicketStatus) {
  return supportStatuses.find((item) => item.value === status)?.label ?? status;
}

function formatContactMethod(method: SupportTicket["contactMethod"]) {
  return method === "CALL" ? "Call" : "WhatsApp";
}

export function SupportTicketsTable() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | SupportTicketStatus>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["support-tickets", page, search, status],
    queryFn: () => getSupportTickets({ page, limit: 20, search, status })
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: SupportTicketStatus }) => updateSupportTicketStatus(id, nextStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      success("Support ticket status updated successfully.");
    }
  });

  const totalPages = data?.meta.totalPages ?? 1;

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatusFilter(value: string) {
    setStatus(value as "" | SupportTicketStatus);
    setPage(1);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          Support Tickets
        </CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search tickets" className="pl-9" />
          </label>
          <select value={status} onChange={(event) => updateStatusFilter(event.target.value)} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
            <option value="">All statuses</option>
            {supportStatuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Ticket</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Problem</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={7}>Loading support tickets</td></tr>}
            {data?.items.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-5 py-4 font-semibold text-primary">{ticket.ticketNumber}</td>
                <td className="px-5 py-4">
                  <div className="font-medium">{ticket.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{ticket.phoneNumber}</div>
                </td>
                <td className="px-5 py-4">{formatContactMethod(ticket.contactMethod)}</td>
                <td className="max-w-md px-5 py-4 leading-6 text-muted-foreground">{ticket.problem}</td>
                <td className="px-5 py-4">{formatDate(ticket.createdAt)}</td>
                <td className="px-5 py-4"><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{formatStatus(ticket.status)}</span></td>
                <td className="px-5 py-4">
                  <select
                    value={ticket.status}
                    disabled={statusMutation.isPending}
                    onChange={(event) => statusMutation.mutate({ id: ticket.id, nextStatus: event.target.value as SupportTicketStatus })}
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm disabled:opacity-50"
                  >
                    {supportStatuses.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={7}>No support tickets found.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}{isFetching && !isLoading ? " - Refreshing" : ""}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}