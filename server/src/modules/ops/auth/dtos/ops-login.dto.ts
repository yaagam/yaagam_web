import { IsNotEmpty, IsString, Length } from 'class-validator';

export class OpsLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @Length(6, 8)
  totpCode: string;
}
