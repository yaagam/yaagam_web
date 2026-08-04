import type React from "react";

type LegalPolicyPageProps = {
  title: string;
  description: string;
  body: string;
  effectiveDate?: string;
};

function isSectionHeading(line: string) {
  return /^\d+\.\s+/.test(line);
}

function getBulletContent(line: string) {
  if (line.startsWith("- ")) return line.slice(2);
  if (line.startsWith("\u2022 ")) return line.slice(2);

  return null;
}

function formatLine(line: string) {
  const bulletContent = getBulletContent(line);

  if (bulletContent) {
    return (
      <li key={line} className="pl-1">
        {bulletContent}
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

function formatLegalFrameworkBox(text: string) {
  return (
    <section
      key="legal-framework"
      className="rounded-lg border border-dashed border-text-primary/25 bg-white px-4 py-3 shadow-sm"
    >
      <h2 className="text-base font-extrabold leading-6 text-text-primary">
        Legal framework
      </h2>
      <p className="mt-1 text-wrap-safe text-sm leading-6 text-text-primary/85 md:text-base md:leading-7">
        {text}
      </p>
    </section>
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("PART ")) continue;

    if (line === "Legal framework") {
      flushBullets();
      content.push(formatLegalFrameworkBox(lines[index + 1] ?? ""));
      index += 1;
      continue;
    }

    if (getBulletContent(line)) {
      bulletItems.push(formatLine(line));
      continue;
    }

    flushBullets();
    content.push(formatLine(line));
  }

  flushBullets();
  return content;
}

export function LegalPolicyPage({
  title,
  body,
  effectiveDate = "24 July 2026",
}: LegalPolicyPageProps) {
  return (
    <article className="bg-white py-14 font-[family-name:var(--font-english-family)] md:py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <header className="border-b border-black/10 pb-8">
          <h1 className="text-wrap-safe text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm font-semibold text-text-primary/60">
            Effective / Last Updated: {effectiveDate}
          </p>
        </header>
        <div className="mt-8 space-y-5 text-base md:text-lg">
          {renderLegalBody(body)}
        </div>
      </div>
    </article>
  );
}