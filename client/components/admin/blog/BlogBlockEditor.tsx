"use client";

import {
  Copy,
  GripVertical,
  Heading,
  ImageIcon,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Trash2,
  Video,
} from "lucide-react";
import { memo, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  BlogBlockType,
  BlogContentBlock,
  BlogGalleryImage,
  BlogImageBlock,
  BlogListBlock,
} from "@/lib/api/admin/blog/blogs.api";

type BlogBlockEditorProps = {
  blocks: BlogContentBlock[];
  onChange: (blocks: BlogContentBlock[]) => void;
};

const blockOptions = [
  { type: "heading", label: "Heading", icon: Heading },
  { type: "paragraph", label: "Paragraph", icon: List },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "gallery", label: "Gallery", icon: ImageIcon },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "ordered-list", label: "Ordered List", icon: ListOrdered },
  { type: "unordered-list", label: "Unordered List", icon: List },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "youtube", label: "YouTube", icon: Video },
] satisfies Array<{
  type: BlogBlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlock(type: BlogBlockType): BlogContentBlock {
  const id = createId();

  if (type === "heading") return { id, type, text: "", level: 2 };
  if (type === "paragraph") return { id, type, text: "" };
  if (type === "image") return { id, type, url: "", caption: "", alt: "" };
  if (type === "gallery") return { id, type, images: [] };
  if (type === "quote") return { id, type, quote: "", author: "" };
  if (type === "ordered-list" || type === "unordered-list") {
    return { id, type, items: [""] };
  }
  if (type === "youtube") return { id, type, url: "" };

  return { id, type: "divider" };
}

function duplicateBlock(block: BlogContentBlock): BlogContentBlock {
  return JSON.parse(JSON.stringify({ ...block, id: createId() }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function useImagePreview(url: string) {
  return useMemo(() => url.trim(), [url]);
}

function BlockShell({
  block,
  children,
  index,
  onDelete,
  onDuplicate,
  onDragStart,
  onDrop,
}: {
  block: BlogContentBlock;
  children: React.ReactNode;
  index: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
}) {
  const title = blockOptions.find((option) => option.type === block.type)?.label;

  return (
    <article
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(index)}
      className="rounded-lg border border-black/10 bg-white shadow-sm transition hover:border-saffron/40"
    >
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-text-primary/35" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-text-primary">{title}</p>
            <p className="text-xs font-bold text-text-primary/40">
              Block {index + 1}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-text-primary/60 hover:border-saffron hover:text-saffron"
            aria-label={`Duplicate ${title}`}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-red-500 hover:border-red-300 hover:bg-red-50"
            aria-label={`Delete ${title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="p-4">{children}</div>
    </article>
  );
}

function ImageFields({
  block,
  onChange,
}: {
  block: BlogImageBlock;
  onChange: (block: BlogImageBlock) => void;
}) {
  const preview = useImagePreview(block.url);

  return (
    <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-lg border border-black/10 bg-[#f8fafc]">
        <div className="aspect-video">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={block.alt || "Image preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-primary/35">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-3">
        <Input
          value={block.url}
          onChange={(event) => onChange({ ...block, url: event.target.value })}
          placeholder="Image URL"
        />
        <Input
          value={block.alt ?? ""}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
          placeholder="Alt text"
        />
        <Input
          value={block.caption ?? ""}
          onChange={(event) =>
            onChange({ ...block, caption: event.target.value })
          }
          placeholder="Caption"
        />
      </div>
    </div>
  );
}

const BlogBlockItem = memo(function BlogBlockItem({
  block,
  index,
  onChange,
  onDelete,
  onDuplicate,
  onDragStart,
  onDrop,
}: {
  block: BlogContentBlock;
  index: number;
  onChange: (block: BlogContentBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
}) {
  const [draggedGalleryImageIndex, setDraggedGalleryImageIndex] = useState<
    number | null
  >(null);
  const [draggedListItemIndex, setDraggedListItemIndex] = useState<
    number | null
  >(null);

  function updateGalleryImage(
    imageIndex: number,
    image: Partial<BlogGalleryImage>,
  ) {
    if (block.type !== "gallery") return;

    const images = block.images.map((currentImage, currentIndex) =>
      currentIndex === imageIndex ? { ...currentImage, ...image } : currentImage,
    );

    onChange({ ...block, images });
  }

  function updateListItem(itemIndex: number, value: string) {
    if (block.type !== "ordered-list" && block.type !== "unordered-list") {
      return;
    }

    onChange({
      ...block,
      items: block.items.map((item, currentIndex) =>
        currentIndex === itemIndex ? value : item,
      ),
    });
  }

  return (
    <BlockShell
      block={block}
      index={index}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      {block.type === "heading" && (
        <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
          <Input
            value={block.text}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            placeholder="Heading text"
          />
          <select
            value={block.level}
            onChange={(event) =>
              onChange({
                ...block,
                level: Number(event.target.value) as 2 | 3 | 4,
              })
            }
            className="h-12 rounded-xl border border-black/15 bg-white px-4 text-base font-semibold text-text-primary outline-none focus:border-saffron"
          >
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
            <option value={4}>Heading 4</option>
          </select>
        </div>
      )}

      {block.type === "paragraph" && (
        <textarea
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          rows={Math.max(4, block.text.split("\n").length + 2)}
          placeholder="Write a paragraph"
          className="w-full resize-none rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-semibold leading-7 text-text-primary outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10"
        />
      )}

      {block.type === "image" && (
        <ImageFields block={block} onChange={(nextBlock) => onChange(nextBlock)} />
      )}

      {block.type === "gallery" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {block.images.map((image, imageIndex) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => setDraggedGalleryImageIndex(imageIndex)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedGalleryImageIndex === null) return;
                  onChange({
                    ...block,
                    images: moveItem(
                      block.images,
                      draggedGalleryImageIndex,
                      imageIndex,
                    ),
                  });
                  setDraggedGalleryImageIndex(null);
                }}
                className="rounded-lg border border-black/10 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                    <GripVertical className="h-4 w-4" />
                    Image {imageIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        images: block.images.filter(
                          (_, currentIndex) => currentIndex !== imageIndex,
                        ),
                      })
                    }
                    className="text-xs font-extrabold text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <ImageFields
                  block={{ ...image, type: "image" }}
                  onChange={(nextImage) => updateGalleryImage(imageIndex, nextImage)}
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                images: [
                  ...block.images,
                  { id: createId(), url: "", caption: "", alt: "" },
                ],
              })
            }
            className="min-h-11 rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add image
          </Button>
        </div>
      )}

      {block.type === "quote" && (
        <div className="grid gap-3">
          <textarea
            value={block.quote}
            onChange={(event) =>
              onChange({ ...block, quote: event.target.value })
            }
            rows={3}
            placeholder="Quote"
            className="w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-semibold leading-7 text-text-primary outline-none focus:border-saffron"
          />
          <Input
            value={block.author ?? ""}
            onChange={(event) =>
              onChange({ ...block, author: event.target.value })
            }
            placeholder="Author"
          />
        </div>
      )}

      {(block.type === "ordered-list" || block.type === "unordered-list") && (
        <div className="space-y-3">
          {block.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              draggable
              onDragStart={() => setDraggedListItemIndex(itemIndex)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedListItemIndex === null) return;
                onChange({
                  ...(block as BlogListBlock),
                  items: moveItem(block.items, draggedListItemIndex, itemIndex),
                });
                setDraggedListItemIndex(null);
              }}
              className="flex items-center gap-2"
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-primary/35" />
              <Input
                value={item}
                onChange={(event) => updateListItem(itemIndex, event.target.value)}
                placeholder={`Item ${itemIndex + 1}`}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...(block as BlogListBlock),
                    items: block.items.filter(
                      (_, currentIndex) => currentIndex !== itemIndex,
                    ),
                  })
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 text-red-500 hover:bg-red-50"
                aria-label="Remove list item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({ ...(block as BlogListBlock), items: [...block.items, ""] })
            }
            className="min-h-11 rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>
      )}

      {block.type === "divider" && (
        <div className="rounded-lg bg-[#f8fafc] px-4 py-6">
          <hr className="border-black/15" />
        </div>
      )}

      {block.type === "youtube" && (
        <Input
          value={block.url}
          onChange={(event) => onChange({ ...block, url: event.target.value })}
          placeholder="Paste YouTube URL"
        />
      )}
    </BlockShell>
  );
});

export function BlogBlockEditor({ blocks, onChange }: BlogBlockEditorProps) {
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

  function updateBlock(index: number, block: BlogContentBlock) {
    onChange(
      blocks.map((currentBlock, currentIndex) =>
        currentIndex === index ? block : currentBlock,
      ),
    );
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary">
            Content Builder
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-text-primary/55">
            Build the article with reusable blocks. Drag cards to reorder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blockOptions.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onChange([...blocks, createBlock(option.type)])}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron"
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-black/15 bg-[#f8fafc] px-4 py-8 text-center">
            <p className="text-lg font-extrabold text-text-primary">
              Start with a block
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/55">
              Add headings, paragraphs, images, lists, quotes, and embeds to
              compose the blog.
            </p>
          </div>
        ) : (
          blocks.map((block, index) => (
            <BlogBlockItem
              key={block.id}
              block={block}
              index={index}
              onChange={(nextBlock) => updateBlock(index, nextBlock)}
              onDelete={() =>
                onChange(blocks.filter((_, currentIndex) => currentIndex !== index))
              }
              onDuplicate={() =>
                onChange([
                  ...blocks.slice(0, index + 1),
                  duplicateBlock(block),
                  ...blocks.slice(index + 1),
                ])
              }
              onDragStart={setDraggedBlockIndex}
              onDrop={(dropIndex) => {
                if (draggedBlockIndex === null) return;
                onChange(moveItem(blocks, draggedBlockIndex, dropIndex));
                setDraggedBlockIndex(null);
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}
