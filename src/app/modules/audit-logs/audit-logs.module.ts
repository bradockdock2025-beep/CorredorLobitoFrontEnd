import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AuditLogsListComponent } from './pages/list/audit-logs-list.component';

const routes: Routes = [
  { path: '', component: AuditLogsListComponent },
];

@NgModule({
  declarations: [AuditLogsListComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AuditLogsModule {}
