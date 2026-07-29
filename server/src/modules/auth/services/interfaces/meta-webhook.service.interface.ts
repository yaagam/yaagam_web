export interface IMetaWebhookService {
  verifyChallenge(mode: string, token: string, challenge: string): string;
  verifySignature(rawBody: Buffer, signature?: string): void;
}
