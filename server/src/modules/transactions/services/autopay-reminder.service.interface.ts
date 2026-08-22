export interface IAutopayReminderService {
  sendDueReminders(now?: Date): Promise<number>;
}