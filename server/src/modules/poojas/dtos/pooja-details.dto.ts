import { IsString } from 'class-validator';

export class PoojaDetailsRequestDto {
  @IsString()
  id: string;
}
