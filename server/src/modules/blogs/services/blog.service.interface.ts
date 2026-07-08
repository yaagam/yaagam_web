import type { CreateBlogDto } from '../dtos/create-blog.dto';
import type { GetBlogsQueryDto } from '../dtos/get-blogs-query.dto';
import type { UpdateBlogDto } from '../dtos/update-blog.dto';
import type { BlogEntity } from '../entities/blog.entity';
import type { PaginatedBlogs } from '../repositories/blog.repository.interface';

export type BlogResponse = BlogEntity;
export type BlogDetailsResponse = BlogEntity;
export type BlogListResponse = PaginatedBlogs;

export interface IBlogService {
  createBlog(input: CreateBlogDto): Promise<BlogResponse>;
  updateBlog(id: string, input: UpdateBlogDto): Promise<BlogResponse>;
  deleteBlog(id: string): Promise<BlogResponse>;
  getBlogs(query: GetBlogsQueryDto): Promise<BlogListResponse>;
  getBlogBySlug(slug: string): Promise<BlogDetailsResponse>;
}
