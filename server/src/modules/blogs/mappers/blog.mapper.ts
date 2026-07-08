import type { Prisma } from '@prisma/client';
import type { BlogEntity } from '../entities/blog.entity';

export type BlogWithRelations = Prisma.BlogGetPayload<{
  include: {
    blocks: true;
    translations: true;
    templeRelations: {
      include: { temple: { include: { translations: true } } };
    };
    poojaRelations: { include: { pooja: { include: { translations: true } } } };
  };
}>;

export class BlogMapper {
  static toEntity(blog: BlogWithRelations): BlogEntity {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      featuredImageKey: blog.featuredImageKey,
      author: blog.author,
      status: blog.status,
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      deletedAt: blog.deletedAt,
      translations: blog.translations.map((translation) => ({
        id: translation.id,
        blogId: translation.blogId,
        language: translation.language,
        title: translation.title,
        excerpt: translation.excerpt,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
      })),
      blocks: blog.blocks.map((block) => ({
        id: block.id,
        order: block.order,
        type: block.type,
        data: block.data,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      })),
      relatedTemples: blog.templeRelations.map((relation) => relation.temple),
      relatedPoojas: blog.poojaRelations.map((relation) => relation.pooja),
    };
  }
}
