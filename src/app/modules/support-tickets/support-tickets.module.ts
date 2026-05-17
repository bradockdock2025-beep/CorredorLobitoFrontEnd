import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TicketListComponent } from './pages/list/ticket-list.component';
import { TicketDetailComponent } from './pages/detail/ticket-detail.component';
import { TicketFormComponent } from './pages/form/ticket-form.component';

const routes: Routes = [
  { path: '',      component: TicketListComponent },
  { path: 'new',   component: TicketFormComponent },
  { path: ':id',   component: TicketDetailComponent },
];

@NgModule({
  declarations: [TicketListComponent, TicketDetailComponent, TicketFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SupportTicketsModule {}
