/**
 * BookingListComponent
 * Screen 2: Booking List & Boarding Tracking
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookingService } from '../../services/booking.service';
import { BoardingEntry } from '../../models/booking.model';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingListComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;

  bookings: BoardingEntry[] = [];
  isLoading = false;
  isMarkingBoarded: Set<string> = new Set();
  errorMessage = '';
  optimalBoardingTimeSeconds = 0;
  hasSearched = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly bookingService: BookingService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.filterForm = this.fb.group({
      travelDate: [today, [Validators.required]],
    });
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ─────────────────────────────────────────────────────────────

  loadBookings(): void {
    if (this.filterForm.invalid) return;

    const { travelDate } = this.filterForm.value;
    this.isLoading = true;
    this.errorMessage = '';
    this.hasSearched = true;

    this.bookingService
      .getBookings(travelDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.bookings = response.bookings;
          this.optimalBoardingTimeSeconds = response.optimalBoardingTimeSeconds;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Boarding Actions ─────────────────────────────────────────────────────────

  markBoarded(bookingId: string): void {
    if (this.isMarkingBoarded.has(bookingId)) return;

    this.isMarkingBoarded.add(bookingId);
    this.cdr.markForCheck();

    this.bookingService
      .markBoarded(bookingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const entry = this.bookings.find(b => b.bookingId === bookingId);
          if (entry) entry.boarded = true;
          this.isMarkingBoarded.delete(bookingId);
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.isMarkingBoarded.delete(bookingId);
          this.cdr.markForCheck();
        },
      });
  }

  isMarkingBoardedFor(bookingId: string): boolean {
    return this.isMarkingBoarded.has(bookingId);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  callMobile(mobile: string): void {
    window.location.href = `tel:${mobile}`;
  }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get formattedBoardingTime(): string {
    const mins = Math.floor(this.optimalBoardingTimeSeconds / 60);
    const secs = this.optimalBoardingTimeSeconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }

  get boardedCount(): number {
    return this.bookings.filter(b => b.boarded).length;
  }

  get pendingCount(): number {
    return this.bookings.filter(b => !b.boarded).length;
  }

  trackByBookingId(_: number, item: BoardingEntry): string {
    return item.bookingId;
  }
}
