import { IsUUID } from 'class-validator';

export class OfferingDetailsRequestDto {
  @IsUUID()
  id: string;
}
