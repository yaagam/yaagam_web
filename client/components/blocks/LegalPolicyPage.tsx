import type React from "react";

type LegalPolicyPageProps = {
  title: string;
  description: string;
  body: string;
};

function isSectionHeading(line: string) {
  return /^\d+\.\s+/.test(line);
}

function formatLine(line: string) {
  if (line.startsWith("- ")) {
    return (
      <li key={line} className="pl-1">
        {line.slice(2)}
      </li>
    );
  }

  if (isSectionHeading(line)) {
    return (
      <h2
        key={line}
        className="mt-10 text-wrap-safe text-2xl font-extrabold leading-tight text-text-primary"
      >
        {line}
      </h2>
    );
  }

  return (
    <p key={line} className="text-wrap-safe leading-8 text-text-primary/78">
      {line}
    </p>
  );
}

function renderLegalBody(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const content: React.ReactNode[] = [];
  let bulletItems: React.ReactNode[] = [];

  function flushBullets() {
    if (bulletItems.length === 0) return;

    content.push(
      <ul
        key={`bullets-${content.length}`}
        className="list-disc space-y-3 pl-5 text-text-primary/78"
      >
        {bulletItems}
      </ul>,
    );
    bulletItems = [];
  }

  for (const line of lines) {
    if (line.startsWith("PART ")) continue;

    if (line.startsWith("- ")) {
      bulletItems.push(formatLine(line));
      continue;
    }

    flushBullets();
    content.push(formatLine(line));
  }

  flushBullets();
  return content;
}

export function LegalPolicyPage({ title, description, body }: LegalPolicyPageProps) {
  return (
    <article className="bg-white py-14 md:py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <header className="border-b border-black/10 pb-8">
          <p className="mb-3 text-wrap-safe text-sm font-bold uppercase tracking-wide text-saffron">
            Legal
          </p>
          <h1 className="text-wrap-safe text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-wrap-safe text-base leading-7 text-text-primary/70 md:text-lg">
            {description}
          </p>
        </header>
        <div className="mt-8 space-y-5 text-base md:text-lg">
          {renderLegalBody(body)}
        </div>
      </div>
    </article>
  );
}