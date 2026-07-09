import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogBlockType, BlogStatus, Prisma } from '@prisma/client';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
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
  BlogImageUploadResponse,
  BlogListResponse,
  BlogResponse,
  IBlogService,
} from './blog.service.interface';

@Injectable()
export class BlogService implements IBlogService {
  constructor(
    @Inject(BLOG_REPOSITORY)
    private readonly _blogRepository: IBlogRepository,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
  ) {}

  async createBlog(input: CreateBlogDto): Promise<BlogResponse> {
    const slug = await this._resolveCreateSlug(input.title);
    await this._validateRelations(input.relations);
    this._validateBlocks(input.blocks);
    this._validateTranslations(input.translations);

    const blog = await this._blogRepository.create({
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt.trim(),
      featuredImageKey: null,
      author: input.author.trim(),
      status: input.status,
      metaTitle: input.metaTitle.trim(),
      metaDescription: input.metaDescription.trim(),
      publishedAt: this._resolvePublishedAt(input.status, input.publishedAt),
      relations: this._mapRelations(input.relations),
      blocks: this._mapBlocks(input.blocks),
      translations: this._mapTranslations(input.translations),
    });

    return this._createBlogResponse(blog);
  }

  async updateBlog(id: string, input: UpdateBlogDto): Promise<BlogResponse> {
    const blog = await this._blogRepository.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const slug = input.title
      ? await this._createAvailableSlug(this._createSlug(input.title), id)
      : undefined;

    await this._validateRelations(input.relations);

    if (input.blocks) {
      this._validateBlocks(input.blocks);
      this._validateTranslations(input.translations);
      await this._validateUpdateBlockIds(id, input.blocks);
    }

    const nextStatus = input.status ?? blog.status;

    const updatedBlog = await this._blogRepository.update(id, {
      title: input.title?.trim(),
      slug,
      excerpt: input.excerpt?.trim(),
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

    return this._createBlogResponse(updatedBlog);
  }

  async deleteBlog(id: string): Promise<BlogResponse> {
    const deletedBlog = await this._blogRepository.softDelete(id);

    await this._queueImageDeletes(this._extractImageKeys(deletedBlog));

    return this._createBlogResponse(deletedBlog);
  }

  async uploadBlogImage(
    image: UploadedStorageFile,
  ): Promise<BlogImageUploadResponse> {
    if (!image) {
      throw new BadRequestException('Blog image is required');
    }

    const imageKey = await this._fileStorageService.uploadFile(image, 'blogs');
    const imageUrl = await this._fileStorageService.createSecureUrl(imageKey);

    return { imageKey, imageUrl };
  }

  async getBlogs(query: GetBlogsQueryDto): Promise<BlogListResponse> {
    const blogs = await this._blogRepository.findMany(query);

    return {
      ...blogs,
      items: await Promise.all(
        blogs.items.map((blog) => this._createBlogResponse(blog)),
      ),
    };
  }

  async getBlogBySlug(slug: string): Promise<BlogDetailsResponse> {
    const blog = await this._blogRepository.findBySlug(slug);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this._createBlogResponse(blog);
  }

  private async _resolveCreateSlug(title: string): Promise<string> {
    const baseSlug = this._createSlug(title);

    return this._createAvailableSlug(baseSlug);
  }

  private async _createAvailableSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;

    while (await this._blogRepository.existsBySlug(slug, excludeId)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
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
        this._requireImageKey(block.data, 'imageKey', block.type);
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

  private _requireImageKey(
    data: Record<string, unknown>,
    key: string,
    blockType: BlogBlockType,
  ): void {
    const value = data[key];

    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${blockType}.${key} is required`);
    }

    this._validateImageKey(value, `${blockType}.${key}`);
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
    const record = data as Record<string, Prisma.JsonValue>;
    const value = record[key];

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

  private async _createBlogResponse(blog: BlogResponse): Promise<BlogResponse> {
    return {
      ...blog,
      blocks: await Promise.all(
        blog.blocks.map(async (block) => ({
          ...block,
          data: await this._createBlockDataResponse(block.data),
        })),
      ),
    };
  }

  private async _createBlockDataResponse(
    data: Prisma.JsonValue,
  ): Promise<Prisma.JsonValue> {
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      return data;
    }

    const record = data as Record<string, Prisma.JsonValue>;
    const imageKey =
      typeof record.imageKey === 'string' ? record.imageKey : null;

    if (imageKey) {
      return {
        ...record,
        imageUrl: await this._fileStorageService.createSecureUrl(imageKey),
      };
    }

    if (Array.isArray(record.imageKeys)) {
      const imageKeys = record.imageKeys.filter(
        (item): item is string => typeof item === 'string',
      );
      const imageUrls = await Promise.all(
        imageKeys.map((key) => this._fileStorageService.createSecureUrl(key)),
      );

      return {
        ...record,
        imageUrls,
      };
    }

    return data;
  }

  private _extractImageKeys(blog: BlogResponse): string[] {
    const imageKeys = new Set<string>();

    this._addImageKey(imageKeys, blog.featuredImageKey);

    blog.blocks.forEach((block) => {
      if (block.type === BlogBlockType.IMAGE) {
        this._addImageKey(
          imageKeys,
          this._getStringFromJson(block.data, 'imageKey'),
        );
        return;
      }

      if (block.type === BlogBlockType.GALLERY) {
        this._getStringArrayFromJson(block.data, 'imageKeys').forEach(
          (imageKey) => this._addImageKey(imageKeys, imageKey),
        );
      }
    });

    return [...imageKeys];
  }

  private _addImageKey(imageKeys: Set<string>, imageKey?: string | null): void {
    const normalizedImageKey = imageKey?.trim();

    if (normalizedImageKey) {
      imageKeys.add(normalizedImageKey);
    }
  }

  private _getStringFromJson(
    data: Prisma.JsonValue,
    key: string,
  ): string | undefined {
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      return undefined;
    }

    const record = data as Record<string, Prisma.JsonValue>;
    const value = record[key];

    return typeof value === 'string' ? value : undefined;
  }

  private _getStringArrayFromJson(
    data: Prisma.JsonValue,
    key: string,
  ): string[] {
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      return [];
    }

    const record = data as Record<string, Prisma.JsonValue>;
    const value = record[key];

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private async _queueImageDeletes(imageKeys: string[]): Promise<void> {
    await Promise.all(
      imageKeys.map((imageKey) =>
        this._fileStorageService.queueDeleteFile(imageKey),
      ),
    );
  }
}
