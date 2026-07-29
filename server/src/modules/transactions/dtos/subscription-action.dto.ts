import { IsIn } from 'class-validator';
export class SubscriptionActionDto {
  @IsIn(['pause', 'resume', 'cancel']) action: 'pause' | 'resume' | 'cancel';
}
