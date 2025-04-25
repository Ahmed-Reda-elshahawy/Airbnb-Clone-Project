import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AvailabilityCalendar } from '../models/AvailabilityCalendar';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityCalendarService {
  private apiUrl = 'https://localhost:7200/api';

  constructor(private http: HttpClient) { }

  setAvailabilityCalendar(listingId: string, availabilityCalendar: AvailabilityCalendar) {
    return this.http.post<AvailabilityCalendar>(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}`, availabilityCalendar);
  }

  getAvailabilityCalendarOfListing(listingId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}`).pipe(
      map(dates => {
        return dates.map(date => ({
          startDate: new Date(date.date),
          endDate: new Date(date.date),
          isAvailable: date.isAvailable
        })).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  getAvailabilityCalendarOfListingOfDate(listingId: string, date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<AvailabilityCalendar>(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}/date/${formattedDate}`);
  }

  checkAvailabilityOfListing(listingId: string, strDate: Date, endDate: Date) {
    const StartDate = strDate.toISOString().split('T')[0];
    const EndDate = endDate.toISOString().split('T')[0];
    return this.http.get<AvailabilityCalendar[]>(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}/available?startDate=${StartDate}&endDate=${EndDate}`);
  }

  updateAvailabilityCalendarOfListingOfDate(listingId: string, date: Date, updatedData: {isAvailable: boolean, specialPrice?: number}) {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.put(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}/date/${formattedDate}`, updatedData);
  }

  initializeAvailability(listingId: string, monthsAhead: number = 3) {
    return this.http.post(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}/init`, {
      monthsAhead,
      isAvailable: true
    });
  }

  resetAvailability(listingId: string) {
    return this.initializeAvailability(listingId, 3);
  }

  setAvailabilityCalendarBatch(listingId: string, availabilityCalendar: AvailabilityCalendar[]) {
    return this.http.post<AvailabilityCalendar[]>(`${this.apiUrl}/AvailabilityCalendar/listings/${listingId}/batch`, availabilityCalendar);
  }

}
