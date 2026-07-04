import type { SupportFaqId } from '../enums/support-faq.enum';

export interface SupportFaqEntity {
  id: SupportFaqId;
  question: string;
  answer: string;
}
