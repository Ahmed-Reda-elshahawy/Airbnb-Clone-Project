import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AvailabilityCalendarService } from '../../core/services/availability-calendar.service';
import { AvailabilityCalendar } from '../../core/models/AvailabilityCalendar';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
  [key: string]: number;
}

@Component({
  selector: 'app-reserve-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reserve-card.component.html',
  styleUrl: './reserve-card.component.css'
})
export class ReserveCardComponent implements OnInit {
  @Input() listingId: string = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  @Output() reserveClicked = new EventEmitter<any>();

  checkIn: string = '';
  checkOut: string = '';
  isGuestPopupOpen: boolean = false;
  availableDates: Array<{ date: string, isAvailable: boolean }> = [];
  minDate: string;

  guests: GuestCounts = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  };

  maxGuests = 4;
  paymentProcessing = false;

  constructor(
    private http: HttpClient,
    private availabilityService: AvailabilityCalendarService
  ) {
    // Set minimum date to today
    this.minDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    if (this.listingId) {
      this.loadAvailableDates();
    }
  }

  loadAvailableDates() {
    this.availabilityService.getAvailabilityCalendarOfListing(this.listingId)
      .subscribe({
        next: (dates: AvailabilityCalendar[]) => {
          this.availableDates = dates.map(date => ({
            date: new Date(date.date).toISOString().split('T')[0],
            isAvailable: date.isAvailable ?? false
          })).sort((a, b) => a.date.localeCompare(b.date));
        },
        error: (error) => {
          console.error('Error loading available dates:', error);
        }
      });
  }

  isDateAvailable(date: string): boolean {
    // Past dates are not available
    if (new Date(date) < new Date(this.minDate)) {
      return false;
    }

    // Check in availability calendar
    const foundDate = this.availableDates.find(d => d.date === date);
    return foundDate ? foundDate.isAvailable : false;
  }

  onDateChange() {
    // Validate dates when they change
    if (this.checkIn && this.checkOut) {
      const startDate = new Date(this.checkIn);
      const endDate = new Date(this.checkOut);

      // Validate date range
      this.availabilityService.checkAvailabilityOfListing(this.listingId, startDate, endDate)
        .subscribe({
          next: (response: { listingId: string; isAvailable: boolean }) => {
            if (!response.isAvailable) {
              alert('The selected dates are not available. Please choose different dates.');
              this.checkOut = '';
            }
          },
          error: (error) => {
            console.error('Error checking availability:', error);
          }
        });
    }
  }

  toggleGuestPopup(event: Event) {
    event.stopPropagation();
    this.isGuestPopupOpen = !this.isGuestPopupOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isGuestPopupOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.guest-popup') && !target.closest('.guest-trigger')) {
        this.isGuestPopupOpen = false;
      }
    }
  }

  updateGuestCount(type: keyof GuestCounts, change: number, event: Event) {
    event.stopPropagation();
    const newCount = this.guests[type] + change;
    const totalGuests = this.getTotalGuests() + (type !== 'infants' ? change : 0);

    if (type === 'adults') {
      if (newCount >= 1 && totalGuests <= this.maxGuests) {
        this.guests[type] = newCount;
      }
    } else if (type === 'children') {
      if (newCount >= 0 && totalGuests <= this.maxGuests) {
        this.guests[type] = newCount;
      }
    } else if (type === 'infants' || type === 'pets') {
      if (newCount >= 0 && newCount <= 5) {
        this.guests[type] = newCount;
      }
    }
  }

  getTotalGuests(): number {
    return this.guests.adults + this.guests.children;
  }

  getGuestsText(): string {
    const total = this.getTotalGuests();
    let text = `${total} guest${total !== 1 ? 's' : ''}`;

    if (this.guests.infants > 0) {
      text += `, ${this.guests.infants} infant${this.guests.infants !== 1 ? 's' : ''}`;
    }
    if (this.guests.pets > 0) {
      text += `, ${this.guests.pets} pet${this.guests.pets !== 1 ? 's' : ''}`;
    }
    return text;
  }

  async reserve() {
    this.paymentProcessing = true;

    try {
      this.reserveClicked.emit({
        listingId: this.listingId,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guestsCount: this.getTotalGuests(),
        guests: this.guests,
        specialRequests: "Testing reservation"
      });
    } catch (error) {
      console.error('Error during reservation:', error);
      alert('Failed to proceed with reservation. Please try again.');
    } finally {
      this.paymentProcessing = false;
    }
  }
}
