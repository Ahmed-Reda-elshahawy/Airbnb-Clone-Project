import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Booking, BookingRequest } from '../models/Booking';
import { AvailabilityCalendarService } from './availability-calendar.service';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'https://localhost:7200/api';

  constructor(
    private http: HttpClient,
    private availabilityCalendarService: AvailabilityCalendarService
  ) { }

  getBookingDates() {
    return this.http.get<Booking[]>(`${this.apiUrl}/Booking`);
  }

  getMyBookings() {
    return this.http.get<Booking[]>(`${this.apiUrl}/Booking/me`);
  }

  getBookingById(bookingId: string) {
    return this.http.get<Booking>(`${this.apiUrl}/Bookings/${bookingId}`);
  }

  getBookingsByListingId(listingId: string) {
    return this.http.get<Booking[]>(`${this.apiUrl}/Bookings/listings/${listingId}`);
  }

  getBookingsByGuestId(guestId: string) {
    return this.http.get<Booking[]>(`${this.apiUrl}/Bookings/guests/${guestId}`);
  }

  createBooking(bookingRequest: BookingRequest): Observable<Booking> {
    // First mark the dates as unavailable in the availability calendar
    return this.availabilityCalendarService.setAvailabilityCalendarBatch(bookingRequest.listingId, [{
      startDate: bookingRequest.checkInDate,
      endDate: bookingRequest.checkOutDate,
      isAvailable: false
    }]).pipe(
      // Then create the booking
      switchMap(() => this.http.post<Booking>(`${this.apiUrl}/Bookings`, bookingRequest)),
      // If booking fails, make the dates available again
      tap({
        error: (error) => {
          this.availabilityCalendarService.setAvailabilityCalendarBatch(bookingRequest.listingId, [{
            startDate: bookingRequest.checkInDate,
            endDate: bookingRequest.checkOutDate,
            isAvailable: true
          }]).subscribe();
        }
      })
    );
  }

  cancelBooking(bookingId: string) {
    return this.http.delete(`${this.apiUrl}/Bookings/${bookingId}`);
  }

  updateBooking(bookingId: string, booking: Partial<Booking>) {
    return this.http.put(`${this.apiUrl}/Bookings/${bookingId}`, booking);
  }

  makeABooking(bookingRequest: BookingRequest) {
    return this.http.post<BookingRequest>(`${this.apiUrl}/Booking`, bookingRequest);
  }

  cancelBookingWithReason(bookingId: string, reason: {reason: string}) {
    return this.http.post<{reason: string}>(`${this.apiUrl}/Booking/${bookingId}/cancel`, reason).pipe(
      tap(() => {
        this.getBookingById(bookingId).subscribe();
      }),
      catchError((error) => {
        console.log('Error cancelling booking:', error);
        return of(null); // Handle the error as needed
      })
    );
  }
}
