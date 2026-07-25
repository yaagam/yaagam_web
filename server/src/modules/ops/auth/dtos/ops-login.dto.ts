import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class OpsLoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @Matches(/^\d{6}$/)
  totpCode: string;
}
