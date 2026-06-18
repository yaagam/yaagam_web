import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../decarators/role.decarator';
import { ResponseMessage } from '../decarators/success-message.decarator';
import { JwtAuthGuard } from '../gurads/jwt-auth.guard';
import { RoleGuard } from '../gurads/role.guard';
import { TranslateJsonDto } from './dtos/translate-json.dto';
import type { TranslationResult } from './interfaces/translation-result.interface';
import { TranslationService } from './translation.service';

@Controller('translations')
export class TranslationController {
  constructor(private readonly _translationService: TranslationService) {}

  @Post()
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage('Translations generated successfully')
  translate(@Body() body: TranslateJsonDto): Promise<TranslationResult> {
    return this._translationService.translateJson(body);
  }
}
