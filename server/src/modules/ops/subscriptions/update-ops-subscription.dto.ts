import { IsIn } from 'class-validator';

export class UpdateOpsSubscriptionDto {
  @IsIn(['pause', 'resume', 'cancel'])
  action!: 'pause' | 'resume' | 'cancel';
}
