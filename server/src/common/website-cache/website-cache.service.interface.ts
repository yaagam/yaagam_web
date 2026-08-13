export type WebsiteCacheEntity =
  | 'pooja'
  | 'temple'
  | 'offering'
  | 'benefit';

export interface IWebsiteCacheService {
  invalidate(entity: WebsiteCacheEntity, ...slugs: string[]): Promise<void>;
}