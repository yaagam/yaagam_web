export interface IPrivateImageDeliveryService {
  getSignedUrl(imageKey?: string | null): Promise<string | null>;
}
