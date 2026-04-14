/**
 * BookTicketComponent
 * Screen 1: Book / Update / Edit a Bus Ticket Booking
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
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BookingService } from '../../services/booking.service';
import { Seat, Booking } from '../../models/booking.model';

const MAX_SEATS = 6;
const COLUMNS = ['A', 'B', 'C', 'D'];
const ROWS = 15;

@Component({
  selector: 'app-book-ticket',
  templateUrl: './book-ticket.component.html',
  styleUrls: ['./book-ticket.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookTicketComponent implements OnInit, OnDestroy {
  // ── Form ────────────────────────────────────────────────────────────────────
  bookingForm!: FormGroup;

  // ── Seat layout state ────────────────────────────────────────────────────────
  seatLayout: Seat[][] = [];          // rows[0..14], each row has 4 seats
  selectedSeats: Set<string> = new Set();
  readonly columns = COLUMNS;
  readonly rows = Array.from({ length: ROWS }, (_, i) => i + 1);

  // ── UI state ─────────────────────────────────────────────────────────────────
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  editBookingId = '';                  // non-empty when editing

  // ── Confirmation popup ───────────────────────────────────────────────────────
  showConfirmation = false;
  confirmedBooking: Booking | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly bookingService: BookingService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.listenToDateChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Initialisation ──────────────────────────────────────────────────────────

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.bookingForm = this.fb.group({
      travelDate: [today, [Validators.required]],
      mobile: [
        '',
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      bookingId: [''],
    });
  }

  private listenToDateChanges(): void {
    this.bookingForm
      .get('travelDate')!
      .valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(date => {
        if (date) {
          this.selectedSeats.clear();
          this.loadSeats(date);
        }
      });

    // Load seats for default date
    const defaultDate = this.bookingForm.get('travelDate')!.value;
    if (defaultDate) this.loadSeats(defaultDate);
  }

  // ── Seat Loading ────────────────────────────────────────────────────────────

  loadSeats(travelDate: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bookingService
      .getSeats(travelDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.buildLayout(response.seats);
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

  private buildLayout(seats: Seat[]): void {
    // Create a 15×4 grid
    const layout: Seat[][] = Array.from({ length: ROWS }, () => [] as Seat[]);
    seats.forEach(seat => {
      layout[seat.row - 1].push(seat);
    });
    // Sort columns within each row: A, B, C, D
    layout.forEach(row => row.sort((a, b) => a.column.localeCompare(b.column)));
    this.seatLayout = layout;
  }

  // ── Load booking for edit ───────────────────────────────────────────────────

  loadBookingForEdit(): void {
    const bookingId = this.bookingForm.get('bookingId')!.value?.trim();
    if (!bookingId) {
      this.errorMessage = 'Please enter a Booking ID to edit.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.bookingService
      .getBookingById(bookingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: booking => {
          this.editBookingId = bookingId;
          this.bookingForm.patchValue({
            travelDate: booking.travelDate,
            mobile: booking.mobile,
          });
          this.selectedSeats = new Set(booking.seats);
          this.loadSeats(booking.travelDate);
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  clearEdit(): void {
    this.editBookingId = '';
    this.bookingForm.patchValue({ bookingId: '' });
    this.selectedSeats.clear();
    const date = this.bookingForm.get('travelDate')!.value;
    if (date) this.loadSeats(date);
  }

  // ── Seat Selection ──────────────────────────────────────────────────────────

  toggleSeat(seat: Seat): void {
    if (seat.isBooked) return;

    const id = seat.seatId;
    if (this.selectedSeats.has(id)) {
      this.selectedSeats.delete(id);
    } else {
      if (this.selectedSeats.size >= MAX_SEATS) {
        this.errorMessage = `Maximum ${MAX_SEATS} seats can be selected.`;
        this.cdr.markForCheck();
        return;
      }
      this.selectedSeats.add(id);
    }
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  isSeatSelected(seatId: string): boolean {
    return this.selectedSeats.has(seatId);
  }

  get selectedSeatList(): string[] {
    return Array.from(this.selectedSeats).sort();
  }

  get remainingSeats(): number {
    return MAX_SEATS - this.selectedSeats.size;
  }

  // ── Form Submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    if (this.selectedSeats.size === 0) {
      this.errorMessage = 'Please select at least one seat.';
      return;
    }

    const { travelDate, mobile } = this.bookingForm.value;
    const payload = { travelDate, mobile, seats: this.selectedSeatList };

    this.isSubmitting = true;
    this.errorMessage = '';

    const request$ = this.editBookingId
      ? this.bookingService.updateBooking(this.editBookingId, payload)
      : this.bookingService.createBooking(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: booking => {
        this.confirmedBooking = booking;
        this.showConfirmation = true;
        this.isSubmitting = false;
        this.editBookingId = '';
        this.selectedSeats.clear();
        this.loadSeats(travelDate);
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeConfirmation(): void {
    this.showConfirmation = false;
    this.confirmedBooking = null;
    this.bookingForm.patchValue({ mobile: '', bookingId: '' });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Returns left pair (A,B) of seats in a row */
  leftPair(row: Seat[]): Seat[] {
    return row.filter(s => s.column === 'A' || s.column === 'B');
  }

  /** Returns right pair (C,D) of seats in a row */
  rightPair(row: Seat[]): Seat[] {
    return row.filter(s => s.column === 'C' || s.column === 'D');
  }

  get hasFormError(): boolean {
    return !!this.errorMessage;
  }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Expose MAX_SEATS to template
  readonly maxSeats = MAX_SEATS;
}
