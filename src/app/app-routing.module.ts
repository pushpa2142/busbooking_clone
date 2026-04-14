import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookTicketComponent } from './components/book-ticket/book-ticket.component';
import { BookingListComponent } from './components/booking-list/booking-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'book', pathMatch: 'full' },
  { path: 'book', component: BookTicketComponent },
  { path: 'bookings', component: BookingListComponent },
  { path: '**', redirectTo: 'book' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
