export interface IBookingLifecycleService {
  completeDueBookings(now?: Date): Promise<number>;
}
