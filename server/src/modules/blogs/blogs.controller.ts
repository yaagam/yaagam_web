import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { Roles } from '../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';
import {
  BLOG_CREATED,
  BLOG_DELETED,
  BLOG_DETAILS_FETCHED,
  BLOG_FETCHED,
  BLOG_UPDATED,
} from './constants/success-message.const';
import { BLOG_SERVICE } from './constants/service-tokens.const';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { GetBlogsQueryDto } from './dtos/get-blogs-query.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import type {
  BlogDetailsResponse,
  BlogListResponse,
  BlogResponse,
  IBlogService,
} from './services/blog.service.interface';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    @Inject(BLOG_SERVICE)
    private readonly _blogService: IBlogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List blogs' })
  @ResponseMessage(BLOG_FETCHED)
  getBlogs(@Query() query: GetBlogsQueryDto): Promise<BlogListResponse> {
    return this._blogService.getBlogs(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get blog by slug' })
  @ResponseMessage(BLOG_DETAILS_FETCHED)
  getBlogBySlug(@Param('slug') slug: string): Promise<BlogDetailsResponse> {
    return this._blogService.getBlogBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN.toLowerCase(), 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Create blog' })
  @ResponseMessage(BLOG_CREATED)
  createBlog(@Body() body: CreateBlogDto): Promise<BlogResponse> {
    return this._blogService.createBlog(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN.toLowerCase(), 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Update blog' })
  @ResponseMessage(BLOG_UPDATED)
  updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogDto,
  ): Promise<BlogResponse> {
    return this._blogService.updateBlog(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN.toLowerCase(), 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Soft delete blog' })
  @ResponseMessage(BLOG_DELETED)
  deleteBlog(@Param('id') id: string): Promise<BlogResponse> {
    return this._blogService.deleteBlog(id);
  }
}
