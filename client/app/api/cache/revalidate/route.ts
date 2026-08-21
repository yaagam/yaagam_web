import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 4096;
const MIN_SECRET_LENGTH = 32;
const SLUG_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

const BASE_TAGS = {
  pooja: ["poojas"],
  temple: ["temples", "poojas"],
  offering: ["offerings", "poojas"],
  benifit: ["benifits", "poojas"],
  benefit: ["benifits", "poojas"],
} as const;

type CacheEntity = keyof typeof BASE_TAGS;

type RevalidationPayload = {
  entity?: unknown;
  slug?: unknown;
};

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function isCacheEntity(value: unknown): value is CacheEntity {
  return typeof value === "string" && value in BASE_TAGS;
}

function tagsFor(entity: CacheEntity, slug?: string) {
  const tags = [...BASE_TAGS[entity]] as string[];

  if (slug) {
    const tagEntity = entity === "benefit" ? "benifit" : entity;
    tags.push(`${tagEntity}:${slug}`);
  }

  return [...new Set(tags)];
}

export async function POST(request: NextRequest) {
  const secret = process.env.CACHE_REVALIDATION_SECRET?.trim();

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    console.error(
      `[cache-revalidate] CACHE_REVALIDATION_SECRET must contain at least ${MIN_SECRET_LENGTH} characters.`,
    );
    return json({ message: "Cache revalidation is not configured." }, 503);
  }

  const token = bearerToken(request);
  if (!token || !safeEqual(token, secret)) {
    return json({ message: "Unauthorized." }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ message: "Request body is too large." }, 413);
  }

  let payload: RevalidationPayload;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return json({ message: "Request body is too large." }, 413);
    }
    payload = JSON.parse(body) as RevalidationPayload;
  } catch {
    return json({ message: "A valid JSON body is required." }, 400);
  }

  if (!isCacheEntity(payload.entity)) {
    return json({ message: "Unsupported cache entity." }, 400);
  }

  if (
    payload.slug !== undefined &&
    (typeof payload.slug !== "string" || !SLUG_PATTERN.test(payload.slug))
  ) {
    return json({ message: "Invalid slug." }, 400);
  }

  const tags = tagsFor(payload.entity, payload.slug);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  revalidatePath("/", "layout");

  return json(
    {
      revalidated: true,
      entity: payload.entity,
      slug: payload.slug ?? null,
      tags,
      paths: ["/"],
    },
    200,
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
