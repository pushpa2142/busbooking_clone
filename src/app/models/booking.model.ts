/**
 * Domain models for the Bus Ticket Booking System.
 */

export interface Seat {
  seatId: string;    // e.g. "A1", "C12"
  column: string;    // A | B | C | D
  row: number;       // 1 – 15
  isBooked: boolean;
  isSelected?: boolean; // UI-only state
}

export interface Booking {
  bookingId: string;
  travelDate: string;   // YYYY-MM-DD
  mobile: string;       // 10-digit string
  seats: string[];      // e.g. ["A3", "B3"]
  boarded: boolean;
  createdAt: string;
  updatedAt: string;
  boardedAt?: string;
}

export interface BoardingEntry {
  sequence: number;
  bookingId: string;
  seats: string[];
  mobile: string;
  boarded: boolean;
  totalTimeSeconds?: number;
}

export interface BookingListResponse {
  travelDate: string;
  bookings: BoardingEntry[];
  totalBookings: number;
  optimalBoardingTimeSeconds: number;
}

export interface SeatsResponse {
  travelDate: string;
  seats: Seat[];
  totalBooked: number;
}

export interface BookingRequest {
  travelDate: string;
  mobile: string;
  seats: string[];
}

export interface ApiError {
  error: string;
}
