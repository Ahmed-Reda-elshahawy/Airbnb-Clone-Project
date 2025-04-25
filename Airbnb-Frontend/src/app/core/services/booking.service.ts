import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Booking, BookingRequest } from '../models/Booking';
import { catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'https://localhost:7200/api';
  constructor(private http: HttpClient) { }

  getBookingDates() {
    return this.http.get<Booking[]>(`${this.apiUrl}/Booking`);
  }

  getMyBookings() {
    return this.http.get<Booking[]>(`${this.apiUrl}/Booking/me`);
  }

  getBookingById(bookingId: string) {
    return this.http.get<Booking>(`${this.apiUrl}/Booking/${bookingId}`);
  }

  getBookingByListingId(listingId: string) {
    return this.http.get<Booking[]>(`${this.apiUrl}/Booking/listings/${listingId}`);
  }

  makeABooking(bookingRequest: BookingRequest) {
    return this.http.post<BookingRequest>(`${this.apiUrl}/Booking`, bookingRequest);
  }

  cancelBooking(bookingId: string, reason: {reason: string}) {
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
