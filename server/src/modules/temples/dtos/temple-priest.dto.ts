import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export interface ITemplePriest {
  name: string;
  experience: string;
}

export class TemplePriestDto implements ITemplePriest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  experience: string;
}

export function parseTemplePriest(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return plainToInstance(TemplePriestDto, JSON.parse(value) as unknown);
  } catch {
    return value;
  }
}
