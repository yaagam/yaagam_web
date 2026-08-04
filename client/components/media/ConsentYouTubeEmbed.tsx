"use client";

import { Button } from "@/components/ui/button";
import {
  openCookieSettings,
  useCookieConsent,
} from "@/components/providers/CookieConsentProvider";

type ConsentYouTubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function ConsentYouTubeEmbed({
  videoId,
  title,
  className = "",
}: ConsentYouTubeEmbedProps) {
  const { mediaAllowed } = useCookieConsent();

  if (!mediaAllowed) {
    return (
      <div
        className={`flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-black/90 p-6 text-center text-white ${className}`}
      >
        <p className="max-w-lg text-sm leading-6 text-white/80">
          This video is hosted by YouTube. Allow optional cookies and media to
          load the player.
        </p>
        <Button type="button" onClick={openCookieSettings}>
          Review privacy choices
        </Button>
      </div>
    );
  }

  return (
    <iframe
      className={`aspect-video w-full rounded-xl ${className}`}
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
