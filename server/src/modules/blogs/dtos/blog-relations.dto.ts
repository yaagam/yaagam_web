import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';

export class BlogRelationsDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  templeIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  poojaIds?: string[];
}
