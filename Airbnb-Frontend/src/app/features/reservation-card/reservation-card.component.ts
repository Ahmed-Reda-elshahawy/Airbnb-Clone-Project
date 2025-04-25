import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityCalendarService } from '../../core/services/availability-calendar.service';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.css'
})
export class ReservationCardComponent implements OnInit {
  @Input() listingId!: string;

  checkIn!: string;
  checkOut!: string;
  isGuestPopupOpen: boolean = false;
  availableDates: Array<{ date: string, isAvailable: boolean }> = [];

  guests: GuestCounts = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  };

  maxGuests = 4;

  constructor(private availabilityService: AvailabilityCalendarService) {}

  ngOnInit() {
    console.log('Listing ID:', this.listingId);
    if (this.listingId) {
      this.loadAvailableDates();
    }
  }

  getMinDate(): string {
    if (this.availableDates.length > 0) {
      return this.availableDates[0].date;
    }
    return new Date().toISOString().split('T')[0];
  }

  getMinCheckoutDate(): string {
    return this.checkIn || this.getMinDate();
  }

  loadAvailableDates() {
    this.availabilityService.getAvailabilityCalendarOfListing(this.listingId)
      .subscribe({
        next: (dates) => {
          console.log('Received dates:', dates);
          this.availableDates = dates.map(date => ({
            date: date.startDate.toISOString().split('T')[0],
            isAvailable: date.isAvailable ?? false
          })).sort((a, b) => a.date.localeCompare(b.date));
          console.log('Processed dates:', this.availableDates);
        },
        error: (error) => {
          console.error('Error loading available dates:', error);
          const today = new Date();
          const threeMonthsFromNow = new Date(today);
          threeMonthsFromNow.setMonth(today.getMonth() + 3);

          // Default dates if error
          this.availableDates = [{
            date: today.toISOString().split('T')[0],
            isAvailable: true
          }];
        }
      });
  }

  toggleGuestPopup() {
    this.isGuestPopupOpen = !this.isGuestPopupOpen;
  }

  // Method to handle guest count changes
  updateGuestCount(type: keyof GuestCounts, change: number) {
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
    } else if (type === 'infants') {
      if (newCount >= 0 && newCount <= 5) {
        this.guests[type] = newCount;
      }
    } else if (type === 'pets') {
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

  // Method to check if a date is available
  isDateAvailable(date: string): boolean {
    const foundDate = this.availableDates.find(d => d.date === date);
    return foundDate ? foundDate.isAvailable : false;
  }

  // Method to check availability and proceed
  checkAvailability() {
    if (this.checkIn && this.checkOut) {
      const startDate = new Date(this.checkIn);
      const endDate = new Date(this.checkOut);

      this.availabilityService.checkAvailabilityOfListing(this.listingId, startDate, endDate)
        .subscribe({
          next: (response) => {
            const isAvailable = response.every(date => date.isAvailable);
            if (isAvailable) {
              console.log('Dates are available!', {
                checkIn: this.checkIn,
                checkOut: this.checkOut,
                guests: this.guests
              });
              // TODO: Proceed with booking
            } else {
              alert('Selected dates are not available. Please choose different dates.');
            }
          },
          error: (error) => {
            console.error('Error checking availability:', error);
            alert('Error checking availability. Please try again.');
          }
        });
    }
  }

  closeGuestPopup(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.guest-popup') && !target.closest('.guest-trigger')) {
      this.isGuestPopupOpen = false;
    }
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
}
