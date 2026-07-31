"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PreProductionNotice() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-amber-200 bg-amber-50">
        <DialogHeader className="items-center">
          <span className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </span>
          <DialogTitle className="text-amber-950">
            Testing Phase — Do Not Make Payments
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-6 text-amber-900/80 sm:text-center">
            This website is currently under testing and is not ready for
            production use. Please do not book any poojas or make any payments
            through this website.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200 bg-white/70 p-4 text-sm font-semibold leading-6 text-amber-950">
          Any booking or payment options visible on the website are for testing
          purposes only.
        </div>

        <Button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 bg-amber-700 font-bold hover:bg-amber-800"
        >
          I Understand
        </Button>
      </DialogContent>
    </Dialog>
  );
}
