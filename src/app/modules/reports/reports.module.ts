import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReportsListComponent }   from './pages/list/reports-list.component';
import { ReportFormComponent }    from './pages/form/report-form.component';
import { ReportDetailComponent }  from './pages/detail/report-detail.component';

const routes: Routes = [
  { path: '',    component: ReportsListComponent  },
  { path: 'new', component: ReportFormComponent   },
  { path: ':id', component: ReportDetailComponent },
];

@NgModule({
  declarations: [ReportsListComponent, ReportFormComponent, ReportDetailComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReportsModule {}
