import Image from "next/image";
import type {
  BlogContentBlock,
  BlogGalleryBlock,
  BlogHeadingBlock,
  BlogImageBlock,
  BlogListBlock,
  BlogParagraphBlock,
  BlogQuoteBlock,
  BlogYoutubeBlock,
} from "@/lib/api/admin/blog/blogs.api";

type BlogBlockRendererProps = {
  blocks: BlogContentBlock[];
};

type BlockRenderer<TBlock extends BlogContentBlock> = (props: {
  block: TBlock;
}) => React.ReactNode;

function getYoutubeEmbedUrl(url: string) {
  const trimmedUrl = url.trim();

  try {
    const parsed = new URL(trimmedUrl);
    const id =
      parsed.hostname.includes("youtu.be")
        ? parsed.pathname.replace("/", "")
        : parsed.searchParams.get("v") ?? parsed.pathname.split("/").pop();

    return id ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function ResponsiveImage({
  alt,
  caption,
  src,
}: {
  alt?: string;
  caption?: string;
  src: string;
}) {
  if (!src) return null;

  return (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black/5">
        <Image
          src={src}
          alt={alt || caption || "Blog image"}
          fill
          unoptimized
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm font-semibold leading-6 text-text-primary/50">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

const blockRenderers = {
  heading: ({ block }: { block: BlogHeadingBlock }) => {
    const className =
      block.level === 2
        ? "mt-12 text-3xl md:text-4xl"
        : block.level === 3
          ? "mt-10 text-2xl md:text-3xl"
          : "mt-8 text-xl md:text-2xl";

    const HeadingTag = `h${block.level}` as "h2" | "h3" | "h4";

    return (
      <HeadingTag
        className={`${className} font-extrabold leading-tight text-text-primary`}
      >
        {block.text}
      </HeadingTag>
    );
  },
  paragraph: ({ block }: { block: BlogParagraphBlock }) => (
    <p className="mt-6 text-lg font-medium leading-9 text-text-primary/75 md:text-xl md:leading-10">
      {block.text}
    </p>
  ),
  image: ({ block }: { block: BlogImageBlock }) => (
    <ResponsiveImage
      src={block.imageUrl || block.previewUrl || ""}
      alt={block.alt}
      caption={block.caption}
    />
  ),
  gallery: ({ block }: { block: BlogGalleryBlock }) => (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {block.images.map((image) => (
        <ResponsiveImage
          key={image.id}
          src={image.imageUrl || image.previewUrl || ""}
          alt={image.alt}
          caption={image.caption}
        />
      ))}
    </div>
  ),
  quote: ({ block }: { block: BlogQuoteBlock }) => (
    <figure className="my-10 rounded-lg border-l-4 border-saffron bg-saffron/10 px-6 py-5">
      <blockquote className="text-2xl font-extrabold leading-10 text-text-primary">
        {block.quote}
      </blockquote>
      {block.author && (
        <figcaption className="mt-3 text-sm font-extrabold uppercase tracking-[0.14em] text-saffron">
          {block.author}
        </figcaption>
      )}
    </figure>
  ),
  "ordered-list": ({ block }: { block: BlogListBlock }) => (
    <ol className="mt-6 list-decimal space-y-3 pl-6 text-lg font-semibold leading-8 text-text-primary/75">
      {block.items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ol>
  ),
  "unordered-list": ({ block }: { block: BlogListBlock }) => (
    <ul className="mt-6 list-disc space-y-3 pl-6 text-lg font-semibold leading-8 text-text-primary/75">
      {block.items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  ),
  divider: () => <hr className="my-12 border-black/10" />,
  youtube: ({ block }: { block: BlogYoutubeBlock }) => {
    const embedUrl = getYoutubeEmbedUrl(block.url);

    if (!embedUrl) return null;

    return (
      <div className="my-8 aspect-video overflow-hidden rounded-lg bg-black/5">
        <iframe
          title="YouTube video"
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
        />
      </div>
    );
  },
} satisfies {
  [Type in BlogContentBlock["type"]]: BlockRenderer<
    Extract<BlogContentBlock, { type: Type }>
  >;
};

export function BlogBlockRenderer({ blocks }: BlogBlockRendererProps) {
  return (
    <div className="blog-content">
      {blocks.map((block) => {
        const Renderer = blockRenderers[block.type] as BlockRenderer<
          typeof block
        >;

        return <Renderer key={block.id} block={block} />;
      })}
    </div>
  );
}
