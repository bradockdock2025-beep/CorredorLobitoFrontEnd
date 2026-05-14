import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { AdminDashboardComponent }      from './admin/admin-dashboard.component';
import { StateDashboardComponent }      from './state/state-dashboard.component';
import { StaffDashboardComponent }      from './staff/staff-dashboard.component';
import { SpecialistDashboardComponent } from './specialist/specialist-dashboard.component';
import { ProducerDashboardComponent }   from './producer/producer-dashboard.component';
import { BuyerDashboardComponent }      from './buyer/buyer-dashboard.component';
import { OperatorDashboardComponent }   from './operator/operator-dashboard.component';
import { CustomsDashboardComponent }    from './customs/customs-dashboard.component';
import { AnalystDashboardComponent }    from './analyst/analyst-dashboard.component';
import { ComplianceDashboardComponent } from './compliance/compliance-dashboard.component';

const adminRoutes:      Routes = [{ path: '', component: AdminDashboardComponent }];
const stateRoutes:      Routes = [{ path: '', component: StateDashboardComponent }];
const staffRoutes:      Routes = [{ path: '', component: StaffDashboardComponent }];
const specialistRoutes: Routes = [{ path: '', component: SpecialistDashboardComponent }];
const producerRoutes:   Routes = [{ path: '', component: ProducerDashboardComponent }];
const buyerRoutes:      Routes = [{ path: '', component: BuyerDashboardComponent }];
const operatorRoutes:   Routes = [{ path: '', component: OperatorDashboardComponent }];
const customsRoutes:    Routes = [{ path: '', component: CustomsDashboardComponent }];
const analystRoutes:    Routes = [{ path: '', component: AnalystDashboardComponent }];
const complianceRoutes: Routes = [{ path: '', component: ComplianceDashboardComponent }];

const ALL_COMPONENTS = [
  AdminDashboardComponent,
  StateDashboardComponent, StaffDashboardComponent, SpecialistDashboardComponent,
  ProducerDashboardComponent, BuyerDashboardComponent, OperatorDashboardComponent,
  CustomsDashboardComponent, AnalystDashboardComponent, ComplianceDashboardComponent,
];

@NgModule({ declarations: ALL_COMPONENTS, imports: [SharedModule] })
class DashboardsCoreModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(adminRoutes)] })
export class AdminDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(stateRoutes)] })
export class StateDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(staffRoutes)] })
export class StaffDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(specialistRoutes)] })
export class SpecialistDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(producerRoutes)] })
export class ProducerDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(buyerRoutes)] })
export class BuyerDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(operatorRoutes)] })
export class OperatorDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(customsRoutes)] })
export class CustomsDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(analystRoutes)] })
export class AnalystDashboardModule {}

@NgModule({ imports: [DashboardsCoreModule, RouterModule.forChild(complianceRoutes)] })
export class ComplianceDashboardModule {}
