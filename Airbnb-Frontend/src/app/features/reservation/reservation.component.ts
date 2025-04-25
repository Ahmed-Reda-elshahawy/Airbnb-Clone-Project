import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ListingsService } from '../../core/services/listings.service';
import { Listing } from '../../core/models/Listing';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';


@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css'],
})
export class ReservationComponent implements OnInit {
  priceData = {
    nightlyRate: 13325.23,
    nights: 3,
    subtotal: 39975.70,
    serviceFee: 300,
    taxes: 150,
    totalAmount: 40425.70
  };

  isLoading = false;
  listings!: Listing;
  showInfoModal = false;
  activePaymentMethod: string = 'credit';
  selectedOption: string = 'now';
  paymentProcessing = false;
  paymentSuccess = false;
  testMode = false; // إضافة هذا المتغير للتحكم في وضع الاختبار

  order: FormGroup = new FormGroup({
    paywith: new FormControl('credit'),
    cardnumber: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{16}$/)
    ]),
    expiry: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)
    ]),
    cvv: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{3,4}$/)
    ]),
     nameoncard: new FormControl('', Validators.required),
    streetAddress: new FormControl('', Validators.required),
    aptSuite: new FormControl(''),
    city: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    zipcode: new FormControl('', Validators.required),
    country: new FormControl('Egypt', Validators.required)
  });

  constructor(
    private listingsService: ListingsService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadListings();
    this.setupFormListeners();
    this.selectOption(this.selectedOption);
  }

  getStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    if (halfStar) {
      stars.push('half');
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push('empty');
    }
    return stars;
  }

  loadListings() {
    this.listingsService.getListingById('3826a636-f756-4251-9149-528ed1962cbf').subscribe({
      next: (data) => {
        this.listings = data;
        console.log('Listings loaded:', this.listings);
      },
      error: (err) => {
        console.error('Error loading listings:', err);
      }
    });
  }

  setupFormListeners() {
    this.order.get('paywith')?.valueChanges.subscribe(value => {
      this.activePaymentMethod = value;
    });
  }

orderSubmit() {
  console.log('🟢 orderSubmit called');

  // تشخيص حالة الفورم
  console.log('Form status (valid/invalid):', this.order.valid);
  console.log('Form errors:', this.order.errors);
  Object.keys(this.order.controls).forEach(key => {
    const control = this.order.get(key);
    console.log(`Control ${key}:`, {
      value: control?.value,
      errors: control?.errors,
      status: control?.status
    });
  });

  if (this.order.invalid) {
    console.error('❌ Form is invalid!');
    this.markAllAsTouched();
    return;
  }

  console.log('✅ Form is valid! Proceeding to payment...');
  this.paymentProcessing = true;
  console.log('🟡 Payment processing started...');

}
  private handlePaymentSuccess(response: any) {
    this.paymentProcessing = false;
    this.paymentSuccess = true;
    console.log('Payment successful:', response);
    alert(`Payment successful! Transaction ID: ${response.transactionId}`);
    this.confirmBooking();
  }

  private handlePaymentError(err: any) {
    this.paymentProcessing = false;
    console.error('Payment failed:', err);
    alert('Payment failed: ' + (err.message || 'Unknown error'));
  }


 private processPayment() {
  console.log('🟡 Starting real payment process...');

  const paymentData = {
    ...this.order.value,
    amount: this.priceData.totalAmount,
    currency: 'EGP',
    listingId: this.listings?.id
  };
  console.log('Payment data being sent:', paymentData);

  return this.http.post('https://localhost:7200/api/Payment/booking/3a56fa69-9a39-42e5-9a6e-84f2f27fa386/confirm', paymentData)
    .pipe(
      tap(response => console.log('🔵 Payment API response:', response)),
      catchError(error => {
        console.error('🔴 Payment API error:', error);
        throw error;
      })
    );
}
  private markAllAsTouched() {
    Object.values(this.order.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  selectOption(option: string): void {
    this.selectedOption = option;
    if (option === 'later') {
      this.priceData.totalAmount = this.priceData.subtotal * 0.5;
    } else {
      this.priceData.totalAmount = this.priceData.subtotal;
    }
  }

  onPaymentMethodChange(event: any): void {
    this.activePaymentMethod = event.target.value;
    this.order.get('paywith')?.setValue(event.target.value);
  }

  confirmBooking(): void {
    if (this.testMode) {
      console.log('Mock booking confirmed');
      alert('Mock booking confirmed successfully!');
      return;
    }

    const bookingData = {
      listingId: this.listings?.id,
      checkIn: '2025-05-11',
      checkOut: '2025-05-16',
      guests: 1,
      paymentStatus: this.paymentSuccess ? 'paid' : 'pending'
    };

    this.http.post('', bookingData).subscribe({
      next: (response) => {
        console.log('Booking confirmed:', response);
        alert('Booking confirmed successfully!');
      },
      error: (err) => {
        console.error('Booking failed:', err);
        alert('Booking confirmation failed');
      }
    });
  }
}
