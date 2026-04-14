/**
 * BookingService
 * Centralised HTTP client for the Bus Booking API.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Booking,
  BookingListResponse,
  BookingRequest,
  SeatsResponse,
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Fetch seat availability for a travel date. */
  getSeats(travelDate: string): Observable<SeatsResponse> {
    const params = new HttpParams().set('travelDate', travelDate);
    return this.http
      .get<SeatsResponse>(`${this.apiUrl}/bookings/seats`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Fetch all bookings (with boarding order) for a travel date. */
  getBookings(travelDate: string): Observable<BookingListResponse> {
    const params = new HttpParams().set('travelDate', travelDate);
    return this.http
      .get<BookingListResponse>(`${this.apiUrl}/bookings`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Fetch a single booking by ID. */
  getBookingById(bookingId: string): Observable<Booking> {
    return this.http
      .get<Booking>(`${this.apiUrl}/bookings/${bookingId}`)
      .pipe(catchError(this.handleError));
  }

  /** Create a new booking. */
  createBooking(payload: BookingRequest): Observable<Booking> {
    return this.http
      .post<Booking>(`${this.apiUrl}/bookings`, payload)
      .pipe(catchError(this.handleError));
  }

  /** Update an existing booking. */
  updateBooking(bookingId: string, payload: Partial<BookingRequest>): Observable<Booking> {
    return this.http
      .put<Booking>(`${this.apiUrl}/bookings/${bookingId}`, payload)
      .pipe(catchError(this.handleError));
  }

  /** Mark a booking as boarded. */
  markBoarded(bookingId: string): Observable<Booking> {
    return this.http
      .patch<Booking>(`${this.apiUrl}/bookings/${bookingId}/board`, {})
      .pipe(catchError(this.handleError));
  }

  /** Cancel / delete a booking. */
  cancelBooking(bookingId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/bookings/${bookingId}`)
      .pipe(catchError(this.handleError));
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.error?.error || error.message || 'An unexpected error occurred.';
    return throwError(() => new Error(message));
  }
}
