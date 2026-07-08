import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TranslateJsonDto } from './dtos/translate-json.dto';
import type { TranslationResult } from './interfaces/translation-result.interface';

interface TargetLanguage {
  key: keyof TranslationResult;
  code: string;
}

interface GoogleTranslationResponse {
  data?: {
    translations?: Array<{
      translatedText?: string;
    }>;
  };
  error?: {
    message?: string;
  };
}

@Injectable()
export class TranslationService {
  private readonly _targetLanguages: TargetLanguage[] = [
    { key: 'malayalam', code: 'ml' },
    { key: 'hindi', code: 'hi' },
    { key: 'marathi', code: 'mr' },
    { key: 'tamil', code: 'ta' },
  ];
  private readonly _translateApiUrl: string;

  constructor(private readonly _configService: ConfigService) {
    this._translateApiUrl =
      this._configService.get<string>('GOOGLE_TRANSLATE_API_URL') ??
      'https://translation.googleapis.com/language/translate/v2';
  }

  async translateJson(input: TranslateJsonDto): Promise<TranslationResult> {
    const texts = this._collectTexts(input.data);
    const result = {} as TranslationResult;

    await Promise.all(
      this._targetLanguages.map(async (language) => {
        const translations = await this._translateTexts({
          texts,
          targetLanguage: language.code,
          sourceLanguage: input.sourceLanguage,
        });

        result[language.key] = this._applyTranslations(
          input.data,
          translations,
        );
      }),
    );

    return result;
  }

  private _collectTexts(value: unknown): string[] {
    if (typeof value === 'string') {
      return value.trim() ? [value] : [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this._collectTexts(item));
    }

    if (this._isRecord(value)) {
      return Object.values(value).flatMap((item) => this._collectTexts(item));
    }

    return [];
  }

  private _applyTranslations(value: unknown, translations: string[]): unknown {
    let index = 0;

    const apply = (currentValue: unknown): unknown => {
      if (typeof currentValue === 'string') {
        return currentValue.trim() ? translations[index++] : currentValue;
      }

      if (Array.isArray(currentValue)) {
        return currentValue.map((item) => apply(item));
      }

      if (this._isRecord(currentValue)) {
        return Object.fromEntries(
          Object.entries(currentValue).map(([key, item]) => [key, apply(item)]),
        );
      }

      return currentValue;
    };

    return apply(value);
  }

  private async _translateTexts({
    texts,
    targetLanguage,
    sourceLanguage,
  }: {
    texts: string[];
    targetLanguage: string;
    sourceLanguage?: string;
  }): Promise<string[]> {
    if (texts.length === 0) {
      return [];
    }

    const apiKey = this._configService.getOrThrow<string>(
      'GOOGLE_TRANSLATE_API_KEY',
    );
    const searchParams = new URLSearchParams({ key: apiKey });
    const response = await fetch(`${this._translateApiUrl}?${searchParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    });
    const responseBody = (await response
      .json()
      .catch(() => ({}))) as GoogleTranslationResponse;

    if (!response.ok) {
      throw new BadGatewayException(
        responseBody.error?.message ?? 'Google translation request failed',
      );
    }

    const translatedTexts = responseBody.data?.translations?.map(
      (translation) => translation.translatedText ?? '',
    );

    if (!translatedTexts || translatedTexts.length !== texts.length) {
      throw new BadGatewayException('Google translation response is invalid');
    }

    return translatedTexts;
  }

  private _isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
