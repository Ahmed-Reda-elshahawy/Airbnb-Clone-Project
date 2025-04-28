import { Component } from '@angular/core';
import { UserBookingService } from '../../core/services/user-booking.service';
import { UserBookingsComponent } from './../../shared/components/userBooking/user-bookings/user-bookings.component';

@Component({
  selector: 'app-guest-reservations',
  imports: [UserBookingsComponent],
  templateUrl: './guest-reservations.component.html',
  styleUrl: './guest-reservations.component.css'
})
export class GuestReservationsComponent {
  constructor(private userBookingService: UserBookingService) { }

  myBookingApi = () => this.userBookingService.getCurrentUserBookings();

}
