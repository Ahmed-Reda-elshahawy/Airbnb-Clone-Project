export interface AvailabilityCalendar {
  startDate: Date | null;
  endDate: Date | null;
  isAvailable: boolean | undefined;
  specialPrice?: number;
}
