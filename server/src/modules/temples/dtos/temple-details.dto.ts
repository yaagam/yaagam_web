import { IsString } from 'class-validator';

export class TempleDetailsRequestDto {
  @IsString()
  id: string;
}
