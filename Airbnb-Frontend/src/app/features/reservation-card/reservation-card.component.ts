import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityCalendarService } from '../../core/services/availability-calendar.service';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';
import { DateRangeService } from '../../core/services/date-range.service';
import { BookingService } from '../../core/services/booking.service';
import { ListingsService } from '../../core/services/listings.service';
import { Listing } from '../../core/models/Listing';
import { Router } from '@angular/router';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface PriceBreakdown {
  nightlyRate: number;
  nights: number;
  subtotal: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
}

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.css'
})
export class ReservationCardComponent implements OnInit {
  @Input() listingId!: string;

  isGuestPopupOpen: boolean = false;
  reservedDates: Date[] = [];
  dateRangeErrors: string[] = [];
  listing?: Listing;
  priceBreakdown: PriceBreakdown = {
    nightlyRate: 0,
    nights: 0,
    subtotal: 0,
    serviceFee: 0,
    taxes: 0,
    totalAmount: 0
  };

  guests: GuestCounts = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  };

  maxGuests = 4;
  selectedDateRange: { startDate: Date | null; endDate: Date | null } = {
    startDate: null,
    endDate: null
  };

  constructor(
    private availabilityService: AvailabilityCalendarService,
    private dateRangeService: DateRangeService,
    private bookingService: BookingService,
    private listingsService: ListingsService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.listingId) {
      this.loadAvailableDates();
      this.setupDateRangeSubscription();
      this.loadListingDetails();
    }
  }

  private loadListingDetails() {
    this.listingsService.getListingById(this.listingId).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.priceBreakdown.nightlyRate = listing.pricePerNight;
        this.priceBreakdown.serviceFee = listing.serviceFee;
        this.updatePriceCalculation();
      },
      error: (error) => {
        console.error('Error loading listing details:', error);
      }
    });
  }

  private updatePriceCalculation() {
    if (this.selectedDateRange.startDate && this.selectedDateRange.endDate && this.listing) {
      const nights = Math.ceil(
        (this.selectedDateRange.endDate.getTime() - this.selectedDateRange.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      this.priceBreakdown.nights = nights;
      this.priceBreakdown.subtotal = this.priceBreakdown.nightlyRate * nights;
      this.priceBreakdown.taxes = this.priceBreakdown.subtotal * 0.1; // Assuming 10% tax
      this.priceBreakdown.totalAmount =
        this.priceBreakdown.subtotal +
        this.priceBreakdown.serviceFee +
        this.priceBreakdown.taxes;
    }
  }

  private setupDateRangeSubscription() {
    this.dateRangeService.startDate$.subscribe(date => {
      if (date) {
        this.selectedDateRange.startDate = date;
        this.validateDateRange();
      }
    });

    this.dateRangeService.endDate$.subscribe(date => {
      if (date) {
        this.selectedDateRange.endDate = date;
        this.validateDateRange();
      }
    });
  }

  private validateDateRange() {
    this.dateRangeErrors = [];
    if (this.selectedDateRange.startDate && this.selectedDateRange.endDate) {
      this.checkAvailability();
    }
  }

  private loadAvailableDates() {
    this.availabilityService.getAvailabilityCalendarOfListing(this.listingId).subscribe({
      next: (dates) => {
        this.reservedDates = dates
          .filter(date => !date.isAvailable)
          .map(date => new Date(date.date));
      },
      error: (error) => {
        console.error('Error loading availability dates:', error);
        this.dateRangeErrors.push('Error loading available dates');
      }
    });
  }

  checkAvailability() {
    if (this.selectedDateRange.startDate && this.selectedDateRange.endDate) {
      this.availabilityService.checkAvailabilityOfListing(
        this.listingId,
        this.selectedDateRange.startDate,
        this.selectedDateRange.endDate
      ).subscribe({
        next: (response) => {
          if (!response.isAvailable) {
            this.dateRangeErrors.push('Selected dates are not available');
          }
        },
        error: (error) => {
          console.error('Error checking availability:', error);
          this.dateRangeErrors.push('Error checking date availability');
        }
      });
    }
  }

  onDateRangeSelected(event: { startDate: Date, endDate: Date }) {
    this.selectedDateRange = {
      startDate: event.startDate,
      endDate: event.endDate
    };
    this.validateDateRange();
    this.updatePriceCalculation();
  }

  toggleGuestPopup() {
    this.isGuestPopupOpen = !this.isGuestPopupOpen;
  }

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

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isGuestPopupOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.guest-popup') && !target.closest('.guest-trigger')) {
        this.isGuestPopupOpen = false;
      }
    }
  }

  reserveNow() {
    if (!this.selectedDateRange.startDate || !this.selectedDateRange.endDate) {
      this.dateRangeErrors.push('Please select check-in and check-out dates');
      return;
    }

    const bookingRequest = {
      listingId: this.listingId,
      checkInDate: this.selectedDateRange.startDate,
      checkOutDate: this.selectedDateRange.endDate,
      guestsCount: this.getTotalGuests(),
      specialRequests: ''
    };

    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (booking) => {
        this.router.navigate(['/reservation'], {
          queryParams: {
            bookingId: booking.id,
            totalAmount: this.priceBreakdown.totalAmount
          }
        });
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.dateRangeErrors.push('Failed to create booking. Please try again.');
      }
    });
  }
}
