import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogStatus, Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { BlogMapper } from '../mappers/blog.mapper';
import type { GetBlogsQueryDto } from '../dtos/get-blogs-query.dto';
import type {
  BlogRepositoryCreateInput,
  BlogRepositoryUpdateInput,
  IBlogRepository,
  PaginatedBlogs,
} from './blog.repository.interface';

const BLOG_INCLUDE = {
  blocks: { orderBy: { order: 'asc' as const } },
  translations: true,
  templeRelations: {
    include: { temple: { include: { translations: true } } },
  },
  poojaRelations: {
    include: { pooja: { include: { translations: true } } },
  },
};

@Injectable()
export class PrismaBlogRepository implements IBlogRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async create(input: BlogRepositoryCreateInput) {
    const blog = await this._prismaService.blog.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        featuredImageKey: input.featuredImageKey ?? null,
        author: input.author,
        status: input.status,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        publishedAt: input.publishedAt ?? null,
        translations: input.translations?.length
          ? {
              create: input.translations.map((translation) => ({
                language: translation.language,
                title: translation.title,
                excerpt: translation.excerpt,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
              })),
            }
          : undefined,
        blocks: {
          create: input.blocks.map((block) => ({
            order: block.order,
            type: block.type,
            data: block.data,
          })),
        },
        templeRelations: input.relations?.templeIds
          ? {
              create: input.relations.templeIds.map((templeId) => ({
                templeId,
              })),
            }
          : undefined,
        poojaRelations: input.relations?.poojaIds
          ? { create: input.relations.poojaIds.map((poojaId) => ({ poojaId })) }
          : undefined,
      },
      include: BLOG_INCLUDE,
    });

    return BlogMapper.toEntity(blog);
  }

  async update(id: string, input: BlogRepositoryUpdateInput) {
    try {
      const blog = await this._prismaService.$transaction(async (prisma) => {
        await prisma.blog.update({
          where: { id, deletedAt: null },
          data: this._createBlogUpdateData(input),
        });

        if (input.relations?.templeIds) {
          await prisma.blogTemple.deleteMany({ where: { blogId: id } });
          await prisma.blogTemple.createMany({
            data: input.relations.templeIds.map((templeId) => ({
              blogId: id,
              templeId,
            })),
          });
        }

        if (input.relations?.poojaIds) {
          await prisma.blogPooja.deleteMany({ where: { blogId: id } });
          await prisma.blogPooja.createMany({
            data: input.relations.poojaIds.map((poojaId) => ({
              blogId: id,
              poojaId,
            })),
          });
        }

        if (input.translations) {
          await this._replaceTranslations(prisma, id, input.translations);
        }

        if (input.blocks) {
          await this._replaceBlocks(prisma, id, input.blocks);
        }

        return prisma.blog.findUniqueOrThrow({
          where: { id },
          include: BLOG_INCLUDE,
        });
      });

      return BlogMapper.toEntity(blog);
    } catch (error) {
      if (this._isRecordNotFoundError(error)) {
        throw new NotFoundException('Blog not found');
      }

      throw error;
    }
  }

  async softDelete(id: string) {
    try {
      const blog = await this._prismaService.blog.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
        include: BLOG_INCLUDE,
      });

      return BlogMapper.toEntity(blog);
    } catch (error) {
      if (this._isRecordNotFoundError(error)) {
        throw new NotFoundException('Blog not found');
      }

      throw error;
    }
  }

  async findById(id: string) {
    const blog = await this._prismaService.blog.findFirst({
      where: { id, deletedAt: null },
      include: BLOG_INCLUDE,
    });

    return blog ? BlogMapper.toEntity(blog) : null;
  }

  async findBySlug(slug: string) {
    const blog = await this._prismaService.blog.findFirst({
      where: { slug, deletedAt: null },
      include: BLOG_INCLUDE,
    });

    return blog ? BlogMapper.toEntity(blog) : null;
  }

  async findMany(query: GetBlogsQueryDto): Promise<PaginatedBlogs> {
    const where = this._createWhere(query);
    const skip = (query.page - 1) * query.limit;
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    } as Prisma.BlogOrderByWithRelationInput;
    const [blogs, total] = await Promise.all([
      this._prismaService.blog.findMany({
        where,
        include: BLOG_INCLUDE,
        orderBy,
        skip,
        take: query.limit,
      }),
      this._prismaService.blog.count({ where }),
    ]);
    const totalPages = Math.ceil(total / query.limit);

    return {
      items: blogs.map((blog) => BlogMapper.toEntity(blog)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const blog = await this._prismaService.blog.findFirst({
      where: {
        slug,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: { id: true },
    });

    return Boolean(blog);
  }

  countExistingTemples(ids: string[]): Promise<number> {
    return this._prismaService.temple.count({ where: { id: { in: ids } } });
  }

  countExistingPoojas(ids: string[]): Promise<number> {
    return this._prismaService.pooja.count({ where: { id: { in: ids } } });
  }

  async findBlockIds(blogId: string): Promise<string[]> {
    const blocks = await this._prismaService.blogBlock.findMany({
      where: { blogId },
      select: { id: true },
    });

    return blocks.map((block) => block.id);
  }

  private _createBlogUpdateData(
    input: BlogRepositoryUpdateInput,
  ): Prisma.BlogUpdateInput {
    return {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      featuredImageKey: input.featuredImageKey,
      author: input.author,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      publishedAt: input.publishedAt,
    };
  }

  private async _replaceTranslations(
    prisma: Prisma.TransactionClient,
    blogId: string,
    translations: BlogRepositoryUpdateInput['translations'],
  ): Promise<void> {
    await prisma.blogTranslation.deleteMany({ where: { blogId } });

    if (!translations?.length) {
      return;
    }

    await prisma.blogTranslation.createMany({
      data: translations.map((translation) => ({
        blogId,
        language: translation.language,
        title: translation.title,
        excerpt: translation.excerpt,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
      })),
    });
  }
  private async _replaceBlocks(
    prisma: Prisma.TransactionClient,
    blogId: string,
    blocks: BlogRepositoryUpdateInput['blocks'],
  ): Promise<void> {
    const existingBlocks = await prisma.blogBlock.findMany({
      where: { blogId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });

    for (const [index, block] of existingBlocks.entries()) {
      await prisma.blogBlock.update({
        where: { id: block.id },
        data: { order: (index + 1) * -1 },
      });
    }

    if (!blocks?.length) {
      await prisma.blogBlock.deleteMany({ where: { blogId } });
      return;
    }

    const incomingBlockIds = blocks
      .map((block) => block.id)
      .filter((blockId): blockId is string => Boolean(blockId));

    await prisma.blogBlock.deleteMany({
      where: {
        blogId,
        id: incomingBlockIds.length ? { notIn: incomingBlockIds } : undefined,
      },
    });

    for (const block of blocks) {
      if (block.id) {
        await prisma.blogBlock.update({
          where: { id: block.id },
          data: {
            order: block.order,
            type: block.type,
            data: block.data,
          },
        });
        continue;
      }

      await prisma.blogBlock.create({
        data: {
          blogId,
          order: block.order,
          type: block.type,
          data: block.data,
        },
      });
    }
  }

  private _createWhere(query: GetBlogsQueryDto): Prisma.BlogWhereInput {
    const filters: Prisma.BlogWhereInput[] = [{ deletedAt: null }];
    const normalizedSearch = query.search?.trim();

    if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.published === true) {
      filters.push({
        status: BlogStatus.PUBLISHED,
        publishedAt: { not: null },
      });
    }

    if (query.published === false) {
      filters.push({
        OR: [{ status: BlogStatus.DRAFT }, { publishedAt: null }],
      });
    }

    if (normalizedSearch) {
      filters.push({
        OR: [
          { title: { contains: normalizedSearch, mode: 'insensitive' } },
          { excerpt: { contains: normalizedSearch, mode: 'insensitive' } },
          { author: { contains: normalizedSearch, mode: 'insensitive' } },
          { metaTitle: { contains: normalizedSearch, mode: 'insensitive' } },
          {
            metaDescription: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    return { AND: filters };
  }

  private _isRecordNotFoundError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
