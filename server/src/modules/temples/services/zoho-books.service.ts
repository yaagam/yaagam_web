import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { timingSafeEqual } from 'node:crypto';
import type {
  CreateZohoVendorInput,
  CreateZohoVendorResult,
  IZohoBooksService,
} from './zoho-books.service.interface';

interface ZohoTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

interface ZohoContactResponse {
  code?: number;
  message?: string;
  contact?: { contact_id?: string };
}

interface CachedAccessToken {
  value: string;
  expiresAt: number;
}

@Injectable()
export class ZohoBooksService implements IZohoBooksService {
  private _accessToken?: CachedAccessToken;
  private _runtimeRefreshToken?: string;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(ZohoBooksService.name);
  }

  async completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ connected: true }> {
    if (!this._matchesOAuthState(state)) {
      throw new UnauthorizedException('Invalid Zoho OAuth state');
    }
    const apiBaseUrl =
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL');
    const parameters = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this._configService.getOrThrow<string>('ZOHO_CLIENT_ID'),
      client_secret:
        this._configService.getOrThrow<string>('ZOHO_CLIENT_SECRET'),
      redirect_uri: this._configService.getOrThrow<string>('ZOHO_REDIRECT_URI'),
      code,
    });
    const response = await fetch(
      `${this._getAccountsBaseUrl(apiBaseUrl)}/oauth/v2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: parameters,
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = (await response.json().catch(() => ({}))) as ZohoTokenResponse;
    if (!response.ok || !body.access_token || !body.refresh_token) {
      throw new Error(
        this._getErrorMessage(
          response.status,
          body.error || 'Zoho OAuth token exchange failed',
        ),
      );
    }
    const expiresIn = Math.max(60, body.expires_in ?? 3600);
    this._runtimeRefreshToken = body.refresh_token;
    this._accessToken = {
      value: body.access_token,
      expiresAt: Date.now() + (expiresIn - 30) * 1000,
    };
    this._logger.info('Zoho Books OAuth connection completed');
    return { connected: true };
  }
  async createVendor(
    input: CreateZohoVendorInput,
  ): Promise<CreateZohoVendorResult> {
    const payload = this._removeEmptyValues({
      contact_name: input.name,
      company_name: input.name,
      contact_type: 'vendor',
      email: input.email,
      phone: input.phone,
      gst_no: input.gstNumber,
      billing_address: this._removeEmptyValues(input.address ?? {}),
    });

    this._logger.info(
      { templeId: input.templeId, zohoRequest: payload },
      'creating Zoho Books vendor',
    );

    const response = await this._request<ZohoContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch((error: unknown) => {
      this._logger.error(
        { templeId: input.templeId, err: error },
        'Zoho Books vendor creation failed',
      );
      throw error;
    });
    const vendorId = response.contact?.contact_id;

    this._logger.info(
      { templeId: input.templeId, zohoResponse: response, vendorId },
      'Zoho Books vendor response received',
    );

    if (!vendorId) {
      throw new Error(
        response.message || 'Zoho Books did not return a vendor ID',
      );
    }

    return { vendorId };
  }

  private async _request<T>(
    path: string,
    init: RequestInit,
    retryUnauthorized = true,
  ): Promise<T> {
    const accessToken = await this._getAccessToken();
    const organizationId = this._configService.getOrThrow<string>(
      'ZOHO_ORGANIZATION_ID',
    );
    const baseUrl = this._normalizeUrl(
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL'),
    );
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('organization_id', organizationId);

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 && retryUnauthorized) {
      this._accessToken = undefined;
      return this._request<T>(path, init, false);
    }

    const body = (await response.json().catch(() => ({}))) as T & {
      code?: number;
      message?: string;
    };
    if (!response.ok || (body.code !== undefined && body.code !== 0)) {
      throw new Error(this._getErrorMessage(response.status, body.message));
    }

    return body;
  }

  private async _getAccessToken(): Promise<string> {
    if (this._accessToken && this._accessToken.expiresAt > Date.now()) {
      return this._accessToken.value;
    }

    const clientId = this._configService.getOrThrow<string>('ZOHO_CLIENT_ID');
    const clientSecret =
      this._configService.getOrThrow<string>('ZOHO_CLIENT_SECRET');
    const refreshToken =
      this._configService.getOrThrow<string>('ZOHO_REFRESH_TOKEN');
    const apiBaseUrl =
      this._configService.getOrThrow<string>('ZOHO_API_BASE_URL');
    const parameters = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await fetch(
      `${this._getAccountsBaseUrl(apiBaseUrl)}/oauth/v2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: parameters,
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = (await response.json().catch(() => ({}))) as ZohoTokenResponse;

    if (!response.ok || !body.access_token) {
      throw new Error(
        this._getErrorMessage(
          response.status,
          body.error || 'Unable to refresh Zoho access token',
        ),
      );
    }

    const expiresIn = Math.max(60, body.expires_in ?? 3600);
    this._accessToken = {
      value: body.access_token,
      expiresAt: Date.now() + (expiresIn - 30) * 1000,
    };
    return body.access_token;
  }

  private _matchesOAuthState(value: string): boolean {
    const expected = this._configService
      .getOrThrow<string>('ZOHO_OAUTH_STATE')
      .trim();
    const actualBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }
  private _getAccountsBaseUrl(apiBaseUrl: string): string {
    const url = new URL(apiBaseUrl);
    url.hostname = url.hostname.replace('www.zohoapis.', 'accounts.zoho.');
    url.hostname = url.hostname.replace('zohoapis.', 'accounts.zoho.');
    return `${url.protocol}//${url.hostname}`;
  }

  private _getErrorMessage(status: number, providerMessage?: string): string {
    const messages: Record<number, string> = {
      401: 'Zoho authentication failed',
      403: 'Zoho Books access is forbidden',
      404: 'Zoho Books resource was not found',
      429: 'Zoho Books rate limit exceeded',
      500: 'Zoho Books is temporarily unavailable',
    };
    const message = messages[status] ?? `Zoho Books request failed (${status})`;
    return providerMessage ? `${message}: ${providerMessage}` : message;
  }

  private _normalizeUrl(value: string): string {
    return value.trim().replace(/\/+$/g, '');
  }

  private _removeEmptyValues<T extends object>(value: T): T {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(([, item]) => {
        if (item === undefined || item === null || item === '') return false;
        return !(typeof item === 'object' && Object.keys(item).length === 0);
      }),
    ) as T;
  }
}
