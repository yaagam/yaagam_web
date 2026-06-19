import { IsString } from 'class-validator';

export class BenifitDetailsRequestDto {
  @IsString()
  id: string;
}
