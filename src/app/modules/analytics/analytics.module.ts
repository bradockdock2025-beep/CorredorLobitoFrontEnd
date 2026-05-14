import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { AnalyticsOverviewComponent }    from './overview/analytics-overview.component';
import { AnalyticsRevenueComponent }     from './revenue/analytics-revenue.component';
import { AnalyticsLogisticsComponent }   from './logistics/analytics-logistics.component';
import { AnalyticsComplianceComponent }  from './compliance/analytics-compliance.component';

const routes: Routes = [
  { path: '',           component: AnalyticsOverviewComponent },
  { path: 'revenue',    component: AnalyticsRevenueComponent },
  { path: 'logistics',  component: AnalyticsLogisticsComponent },
  { path: 'compliance', component: AnalyticsComplianceComponent },
];

@NgModule({
  declarations: [
    AnalyticsOverviewComponent,
    AnalyticsRevenueComponent,
    AnalyticsLogisticsComponent,
    AnalyticsComplianceComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AnalyticsModule {}
