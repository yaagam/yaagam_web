import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogBlockType, BlogStatus, Prisma } from '@prisma/client';
import { BLOG_REPOSITORY } from '../constants/service-tokens.const';
import type { BlogBlockDto } from '../dtos/blog-block.dto';
import type { BlogRelationsDto } from '../dtos/blog-relations.dto';
import type { BlogTranslationDto } from '../dtos/blog-translation.dto';
import type { CreateBlogDto } from '../dtos/create-blog.dto';
import type { GetBlogsQueryDto } from '../dtos/get-blogs-query.dto';
import type { UpdateBlogDto } from '../dtos/update-blog.dto';
import type {
  BlogRepositoryBlockInput,
  BlogRepositoryRelationsInput,
  BlogRepositoryTranslationInput,
  IBlogRepository,
} from '../repositories/blog.repository.interface';
import type {
  BlogDetailsResponse,
  BlogListResponse,
  BlogResponse,
  IBlogService,
} from './blog.service.interface';

@Injectable()
export class BlogService implements IBlogService {
  constructor(
    @Inject(BLOG_REPOSITORY)
    private readonly _blogRepository: IBlogRepository,
  ) {}

  async createBlog(input: CreateBlogDto): Promise<BlogResponse> {
    const slug = await this._resolveCreateSlug(input.title, input.slug);
    await this._validateRelations(input.relations);
    this._validateImageKey(input.featuredImageKey, 'featuredImageKey');
    this._validateBlocks(input.blocks);
    this._validateTranslations(input.translations);

    return this._blogRepository.create({
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt.trim(),
      featuredImageKey: this._normalizeOptionalString(input.featuredImageKey),
      author: input.author.trim(),
      status: input.status,
      metaTitle: input.metaTitle.trim(),
      metaDescription: input.metaDescription.trim(),
      publishedAt: this._resolvePublishedAt(input.status, input.publishedAt),
      relations: this._mapRelations(input.relations),
      blocks: this._mapBlocks(input.blocks),
      translations: this._mapTranslations(input.translations),
    });
  }

  async updateBlog(id: string, input: UpdateBlogDto): Promise<BlogResponse> {
    const blog = await this._blogRepository.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const slug = input.slug
      ? await this._resolveUpdateSlug(input.slug, id)
      : undefined;

    await this._validateRelations(input.relations);
    this._validateImageKey(input.featuredImageKey, 'featuredImageKey');

    if (input.blocks) {
      this._validateBlocks(input.blocks);
      this._validateTranslations(input.translations);
      await this._validateUpdateBlockIds(id, input.blocks);
    }

    const nextStatus = input.status ?? blog.status;

    return this._blogRepository.update(id, {
      title: input.title?.trim(),
      slug,
      excerpt: input.excerpt?.trim(),
      featuredImageKey:
        input.featuredImageKey === undefined
          ? undefined
          : this._normalizeOptionalString(input.featuredImageKey),
      author: input.author?.trim(),
      status: input.status,
      metaTitle: input.metaTitle?.trim(),
      metaDescription: input.metaDescription?.trim(),
      publishedAt:
        input.publishedAt === undefined
          ? this._resolveUpdatedPublishedAt(
              nextStatus,
              blog.publishedAt,
              input.status,
            )
          : input.publishedAt,
      relations: this._mapRelations(input.relations),
      blocks: input.blocks ? this._mapBlocks(input.blocks) : undefined,
      translations: this._mapTranslations(input.translations),
    });
  }

  deleteBlog(id: string): Promise<BlogResponse> {
    return this._blogRepository.softDelete(id);
  }

  getBlogs(query: GetBlogsQueryDto): Promise<BlogListResponse> {
    return this._blogRepository.findMany(query);
  }

  async getBlogBySlug(slug: string): Promise<BlogDetailsResponse> {
    const blog = await this._blogRepository.findBySlug(slug);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }

  private async _resolveCreateSlug(
    title: string,
    requestedSlug?: string,
  ): Promise<string> {
    const baseSlug = this._createSlug(requestedSlug || title);

    if (requestedSlug) {
      await this._ensureSlugAvailable(baseSlug);
      return baseSlug;
    }

    return this._createAvailableSlug(baseSlug);
  }

  private async _resolveUpdateSlug(
    slug: string,
    blogId: string,
  ): Promise<string> {
    const normalizedSlug = this._createSlug(slug);
    await this._ensureSlugAvailable(normalizedSlug, blogId);

    return normalizedSlug;
  }

  private async _createAvailableSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;

    while (await this._blogRepository.existsBySlug(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async _ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    if (await this._blogRepository.existsBySlug(slug, excludeId)) {
      throw new ConflictException('Blog slug already exists');
    }
  }

  private _createSlug(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    return slug || 'blog';
  }

  private async _validateRelations(
    relations?: BlogRelationsDto,
  ): Promise<void> {
    if (!relations) {
      return;
    }

    this._ensureNoDuplicates(relations.templeIds ?? [], 'temple relation');
    this._ensureNoDuplicates(relations.poojaIds ?? [], 'pooja relation');

    if (relations.templeIds?.length) {
      const count = await this._blogRepository.countExistingTemples(
        relations.templeIds,
      );

      if (count !== relations.templeIds.length) {
        throw new NotFoundException('One or more temples were not found');
      }
    }

    if (relations.poojaIds?.length) {
      const count = await this._blogRepository.countExistingPoojas(
        relations.poojaIds,
      );

      if (count !== relations.poojaIds.length) {
        throw new NotFoundException('One or more poojas were not found');
      }
    }
  }

  private _ensureNoDuplicates(values: string[], label: string): void {
    const normalizedValues = values.map((value) => value.trim());

    if (new Set(normalizedValues).size !== normalizedValues.length) {
      throw new BadRequestException(`Duplicate ${label} found`);
    }
  }

  private _validateTranslations(translations?: BlogTranslationDto[]): void {
    if (!translations) {
      return;
    }

    this._ensureNoDuplicates(
      translations.map((translation) => translation.language),
      'blog translation language',
    );

    translations.forEach((translation) => {
      this._requirePlainText(translation.title, 'translation.title');
      this._requirePlainText(translation.excerpt, 'translation.excerpt');
      this._requirePlainText(translation.metaTitle, 'translation.metaTitle');
      this._requirePlainText(
        translation.metaDescription,
        'translation.metaDescription',
      );
    });
  }

  private _requirePlainText(value: string, label: string): void {
    if (!value.trim()) {
      throw new BadRequestException(`${label} is required`);
    }

    this._validateNoHtml(value);
  }
  private _validateBlocks(blocks: BlogBlockDto[]): void {
    this._validateBlockOrder(blocks);
    blocks.forEach((block) => this._validateBlock(block));
  }

  private _validateBlockOrder(blocks: BlogBlockDto[]): void {
    const sortedOrders = blocks
      .map((block) => block.order)
      .sort((a, b) => a - b);

    for (let index = 0; index < sortedOrders.length; index += 1) {
      if (sortedOrders[index] !== index + 1) {
        throw new BadRequestException(
          'Blog block order must be contiguous from 1',
        );
      }
    }
  }

  private _validateBlock(block: BlogBlockDto): void {
    this._validateNoHtml(block.data);

    switch (block.type) {
      case BlogBlockType.HEADING:
        this._requireString(block.data, 'text', block.type);
        this._requireNumberInRange(block.data, 'level', 1, 6, block.type);
        break;
      case BlogBlockType.PARAGRAPH:
        this._requireString(block.data, 'text', block.type);
        break;
      case BlogBlockType.IMAGE:
        this._validateImageKey(
          this._getString(block.data, 'imageKey'),
          `${block.type}.imageKey`,
        );
        break;
      case BlogBlockType.GALLERY:
        this._requireImageKeyArray(block.data, 'imageKeys', block.type);
        break;
      case BlogBlockType.QUOTE:
        this._requireString(block.data, 'text', block.type);
        break;
      case BlogBlockType.ORDERED_LIST:
      case BlogBlockType.UNORDERED_LIST:
        this._requireStringArray(block.data, 'items', block.type);
        break;
      case BlogBlockType.DIVIDER:
        break;
      case BlogBlockType.YOUTUBE:
        this._validateYoutubeUrl(this._getString(block.data, 'url'));
        break;
      default:
        throw new BadRequestException('Unsupported blog block type');
    }
  }

  private async _validateUpdateBlockIds(
    blogId: string,
    blocks: BlogBlockDto[],
  ): Promise<void> {
    const blockIds = blocks
      .map((block) => block.id)
      .filter((blockId): blockId is string => Boolean(blockId));

    if (blockIds.length === 0) {
      return;
    }

    this._ensureNoDuplicates(blockIds, 'block id');

    const existingBlockIds = await this._blogRepository.findBlockIds(blogId);
    const existingBlockIdSet = new Set(existingBlockIds);
    const hasInvalidBlockId = blockIds.some(
      (blockId) => !existingBlockIdSet.has(blockId),
    );

    if (hasInvalidBlockId) {
      throw new BadRequestException(
        'One or more blocks do not belong to this blog',
      );
    }
  }

  private _requireString(
    data: Record<string, unknown>,
    key: string,
    blockType: BlogBlockType,
  ): void {
    const value = this._getString(data, key);

    if (!value?.trim()) {
      throw new BadRequestException(`${blockType}.${key} is required`);
    }
  }

  private _requireNumberInRange(
    data: Record<string, unknown>,
    key: string,
    min: number,
    max: number,
    blockType: BlogBlockType,
  ): void {
    const value = data[key];

    if (typeof value !== 'number' || value < min || value > max) {
      throw new BadRequestException(
        `${blockType}.${key} must be between ${min} and ${max}`,
      );
    }
  }

  private _requireStringArray(
    data: Record<string, unknown>,
    key: string,
    blockType: BlogBlockType,
  ): void {
    const value = data[key];

    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((item) => typeof item !== 'string' || !item.trim())
    ) {
      throw new BadRequestException(
        `${blockType}.${key} must contain text items`,
      );
    }
  }

  private _requireImageKeyArray(
    data: Record<string, unknown>,
    key: string,
    blockType: BlogBlockType,
  ): void {
    const value = data[key];

    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException(
        `${blockType}.${key} must contain image keys`,
      );
    }

    value.forEach((imageKey) =>
      this._validateImageKey(imageKey, `${blockType}.${key}`),
    );
  }

  private _validateImageKey(value: unknown, label: string): void {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${label} must be a valid image key`);
    }

    if (/^https?:\/\//i.test(value.trim())) {
      throw new BadRequestException(`${label} must be an image key, not a URL`);
    }
  }

  private _validateYoutubeUrl(value?: string): void {
    if (!value?.trim()) {
      throw new BadRequestException('YOUTUBE.url is required');
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('YOUTUBE.url must be a valid URL');
    }

    const host = url.hostname.replace(/^www\./, '');

    if (!['youtube.com', 'youtu.be', 'm.youtube.com'].includes(host)) {
      throw new BadRequestException('YOUTUBE.url must be a valid YouTube URL');
    }
  }

  private _validateNoHtml(value: unknown): void {
    if (typeof value === 'string') {
      if (/<[a-z][\s\S]*>/i.test(value)) {
        throw new BadRequestException('Blog content must not contain HTML');
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => this._validateNoHtml(item));
      return;
    }

    if (value && typeof value === 'object') {
      Object.values(value).forEach((item) => this._validateNoHtml(item));
    }
  }

  private _getString(
    data: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = data[key];

    return typeof value === 'string' ? value : undefined;
  }

  private _resolvePublishedAt(
    status: BlogStatus,
    publishedAt?: Date,
  ): Date | null {
    if (publishedAt) {
      return publishedAt;
    }

    return status === BlogStatus.PUBLISHED ? new Date() : null;
  }

  private _resolveUpdatedPublishedAt(
    status: BlogStatus,
    currentPublishedAt: Date | null,
    requestedStatus?: BlogStatus,
  ): Date | null | undefined {
    if (requestedStatus === BlogStatus.PUBLISHED && !currentPublishedAt) {
      return new Date();
    }

    if (status === BlogStatus.DRAFT && requestedStatus === BlogStatus.DRAFT) {
      return null;
    }

    return undefined;
  }

  private _mapRelations(
    relations?: BlogRelationsDto,
  ): BlogRepositoryRelationsInput | undefined {
    if (!relations) {
      return undefined;
    }

    return {
      templeIds: relations.templeIds?.map((id) => id.trim()) ?? [],
      poojaIds: relations.poojaIds?.map((id) => id.trim()) ?? [],
    };
  }

  private _mapTranslations(
    translations?: BlogTranslationDto[],
  ): BlogRepositoryTranslationInput[] | undefined {
    if (!translations) {
      return undefined;
    }

    return translations.map((translation) => ({
      language: translation.language,
      title: translation.title.trim(),
      excerpt: translation.excerpt.trim(),
      metaTitle: translation.metaTitle.trim(),
      metaDescription: translation.metaDescription.trim(),
    }));
  }
  private _mapBlocks(blocks: BlogBlockDto[]): BlogRepositoryBlockInput[] {
    return blocks
      .slice()
      .sort((first, second) => first.order - second.order)
      .map((block) => ({
        id: block.id,
        order: block.order,
        type: block.type,
        data: block.data as Prisma.InputJsonValue,
      }));
  }

  private _normalizeOptionalString(value?: string | null): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }
}
