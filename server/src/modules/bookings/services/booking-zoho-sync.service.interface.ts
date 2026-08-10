export interface IBookingZohoSyncService {
  syncPaidOccurrence(occurrenceId: string): Promise<void>;
}
