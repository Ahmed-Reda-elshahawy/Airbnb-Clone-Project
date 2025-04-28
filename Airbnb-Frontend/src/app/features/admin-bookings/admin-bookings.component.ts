import { Component } from '@angular/core';
import { UserBookingService } from '../../core/services/user-booking.service';
import { UserBookingsComponent } from './../../shared/components/userBooking/user-bookings/user-bookings.component';

@Component({
  selector: 'app-admin-bookings',
  imports: [UserBookingsComponent],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.css'
})
export class AdminBookingsComponent {
  constructor(private userBookingService: UserBookingService) { }

  myBookingApi = () => this.userBookingService.getAllBookings();
}
