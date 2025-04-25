import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  CalendarOptions,
  DateSelectArg,
  EventApi,
  EventSourceInput,
  EventClickArg,
  EventContentArg
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { BookingDate } from '../../../core/models/BookingDate';
import { AvailabilityCalendar } from '../../../core/models/AvailabilityCalendar';
import { AvailabilityCalendarService } from '../../../core/services/availability-calendar.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './availability-calendar.component.html',
  styleUrl: './availability-calendar.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AvailabilityCalendarComponent implements OnInit {
  @Input() bookingDates: BookingDate[] = [];
  @Input() isOwner = false;
  @Input() listingId: string = '';
  @Output() dateChange = new EventEmitter<BookingDate>();
  @Output() rangeSelected = new EventEmitter<{startDate: Date, endDate: Date}>();
  @Output() availabilitySet = new EventEmitter<{range: {startDate: Date, endDate: Date}, isAvailable: boolean}>();

  currentEvents: EventApi[] = [];
  selectedRange: {startDate: Date | null, endDate: Date | null} = {
    startDate: null,
    endDate: null
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    weekends: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    eventContent: this.handleEventContent.bind(this),
    events: [],
    selectConstraint: {
      start: new Date().toISOString().split('T')[0],
    },
    validRange: {
      start: new Date()
    }
  };

  constructor(private availabilityService: AvailabilityCalendarService) {}

  ngOnInit() {
    if (this.listingId) {
      // this.loadAvailableDates();
    } else {
      // this.initializeCalendarOptions();
    }
  }

  private loadAvailableDates() {
    if (!this.listingId) return;

    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    this.availabilityService.getAvailabilityCalendarOfListing(this.listingId)
      .pipe(
        catchError(error => {
          if (error.status === 404 && this.isOwner) {
            // If no dates exist, initialize them
            return this.availabilityService.initializeAvailability(this.listingId).pipe(
              switchMap(() => {
                const initialData: AvailabilityCalendar[] = [{
                  startDate: today,
                  endDate: threeMonthsFromNow,
                  isAvailable: true
                }];
                return this.availabilityService.setAvailabilityCalendarBatch(this.listingId, initialData);
              }),
              switchMap(() => this.availabilityService.getAvailabilityCalendarOfListing(this.listingId))
            );
          }
          return of([]); // Return empty array if error and not owner
        })
      )
      .subscribe({
        next: (dates) => {
          // Map the dates to BookingDate format
          this.bookingDates = dates.map(date => ({
            start: new Date(date.startDate!),
            end: new Date(date.endDate!),
            isAvailable: date.isAvailable ?? true // Default to true if undefined
          }));

          // If no dates were returned and we're the owner, set default availability
          if (this.bookingDates.length === 0 && this.isOwner) {
            this.bookingDates = [{
              start: today,
              end: threeMonthsFromNow,
              isAvailable: true
            }];
          }

          this.initializeCalendarOptions();
          this.updateCalendarEvents();
        },
        error: (error) => {
          console.error('Error loading availability dates:', error);
          this.initializeCalendarOptions();
        }
      });
  }

  private initializeCalendarOptions() {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.getInitialEvents()
    };
  }

  private getInitialEvents(): EventSourceInput {
    return this.bookingDates.map((booking) => ({
      start: booking.start,
      end: booking.end,
      title: this.getEventTitle(booking.isAvailable),
      display: 'block',
      extendedProps: {
        isAvailable: booking.isAvailable
      }
    }));
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    if (this.selectedRange.startDate === null) {
      // First date selection
      this.selectedRange.startDate = selectInfo.start;
      this.calendarOptions = {
        ...this.calendarOptions,
        selectConstraint: {
          start: selectInfo.start.toISOString().split('T')[0],
        }
      };
    } else {
      // Second date selection
      this.selectedRange.endDate = selectInfo.end;
      // Emit the complete range
      this.rangeSelected.emit({
        startDate: this.selectedRange.startDate,
        endDate: selectInfo.end
      });
    }
    this.updateCalendarEvents();
  }

  getSelectionMessage(): string {
    if (!this.selectedRange.startDate) {
      return 'Select a start date';
    } else if (!this.selectedRange.endDate) {
      return 'Now select an end date';
    }
    return `Selected: ${this.formatDate(this.selectedRange.startDate)} - ${this.formatDate(this.selectedRange.endDate)}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  clearSelection(): void {
    this.selectedRange = {
      startDate: null,
      endDate: null
    };
    this.updateCalendarEvents();
    this.calendarOptions = {
      ...this.calendarOptions,
      selectConstraint: {
        start: new Date().toISOString().split('T')[0],
      }
    };
  }

  setAvailability(isAvailable: boolean): void {
    if (this.selectedRange.startDate && this.selectedRange.endDate && this.listingId) {
      const availabilityData: AvailabilityCalendar[] = [{
        startDate: this.selectedRange.startDate,
        endDate: this.selectedRange.endDate,
        isAvailable,
        specialPrice: undefined
      }];

      this.availabilityService.setAvailabilityCalendarBatch(this.listingId, availabilityData).subscribe({
        next: (response) => {
          const newBooking: BookingDate = {
            start: this.selectedRange.startDate!,
            end: this.selectedRange.endDate!,
            isAvailable
          };

          // Update local display
          this.bookingDates = [
            ...this.bookingDates.filter(booking =>
              booking.start < this.selectedRange.startDate! ||
              booking.end > this.selectedRange.endDate!
            ),
            newBooking
          ];

          // Update calendar display
          this.updateCalendarEvents();
          // Clear selection
          this.clearSelection();

          // Emit the availability change
          this.availabilitySet.emit({
            range: {
              startDate: this.selectedRange.startDate!,
              endDate: this.selectedRange.endDate!
            },
            isAvailable
          });
        },
        error: (error) => {
          console.error('Error setting availability:', error);
        }
      });
    }
  }

  private updateCalendarEvents(): void {
    if (!this.calendarOptions) return;

    const events = [
      ...this.bookingDates.map((booking) => ({
        start: booking.start,
        end: booking.end,
        title: this.getEventTitle(booking.isAvailable),
        display: 'block',
        extendedProps: {
          isAvailable: booking.isAvailable
        }
      }))
    ];

    // Add selected range if exists
    if (this.selectedRange.startDate) {
      events.push({
        start: this.selectedRange.startDate,
        end: this.selectedRange.endDate || this.selectedRange.startDate,
        title: 'Selected',
        display: 'block',
        extendedProps: {
          isAvailable: undefined
        }
      });
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  handleEventClick(clickInfo: EventClickArg): void {
    if (this.isOwner) {
      const start = clickInfo.event.start!;
      const end = clickInfo.event.end || start;
      const isAvailable = !clickInfo.event.extendedProps['isAvailable'];

      this.dateChange.emit({
        start,
        end,
        isAvailable
      });
    }
  }

  handleEvents(events: EventApi[]): void {
    this.currentEvents = events;
  }

  handleEventContent(eventContent: EventContentArg): { html: string } {
    const isAvailable = eventContent.event.extendedProps['isAvailable'];
    const title = this.getEventTitle(isAvailable);
    const { bgColor, hoverColor } = this.getEventStyle(isAvailable);

    return {
      html: `<div class="px-2 py-1 rounded text-white text-xs ${bgColor} ${hoverColor}">${title}</div>`
    };
  }

  private getEventTitle(isAvailable: boolean | undefined): string {
    if (isAvailable === undefined) return 'Selected';
    return isAvailable ? 'Available' : 'Unavailable';
  }

  private getEventStyle(isAvailable: boolean | undefined): { bgColor: string, hoverColor: string } {
    if (isAvailable === undefined) {
      return {
        bgColor: 'bg-gray-400',
        hoverColor: 'hover:bg-gray-500'
      };
    }
    return {
      bgColor: isAvailable ? 'bg-green-500' : 'bg-red-500',
      hoverColor: isAvailable ? 'hover:bg-green-600' : 'hover:bg-red-600'
    };
  }

  resetAllDates(): void {
    if (!this.listingId || !confirm('Are you sure you want to reset all dates? This will clear all availability settings.')) {
      return;
    }

    this.availabilityService.resetAvailability(this.listingId).subscribe({
      next: () => {
        // Clear selection first
        this.clearSelection();

        // Reload the dates from server
        this.loadAvailableDates();
      },
      error: (error) => {
        console.error('Error resetting dates:', error);
        alert('Failed to reset dates. Please try again.');
      }
    });
  }

  markAllAsAvailable(): void {
    if (!this.listingId || !confirm('Are you sure you want to mark all future dates as available?')) {
      return;
    }

    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    const availabilityData: AvailabilityCalendar[] = [{
      startDate: today,
      endDate: oneYearFromNow,
      isAvailable: true,
      specialPrice: undefined
    }];

    this.availabilityService.setAvailabilityCalendarBatch(this.listingId, availabilityData).subscribe({
      next: () => {
        const availableBooking: BookingDate = {
          start: today,
          end: oneYearFromNow,
          isAvailable: true
        };
        this.bookingDates = [availableBooking];
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Error marking all dates as available:', error);
        alert('Failed to update availability. Please try again.');
      }
    });
  }
}
