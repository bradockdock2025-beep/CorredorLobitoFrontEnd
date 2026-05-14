import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ShipmentsListComponent }   from './pages/list/shipments-list.component';
import { ShipmentDetailComponent }  from './pages/detail/shipment-detail.component';
import { ShipmentFormComponent }    from './pages/form/shipment-form.component';

const routes: Routes = [
  { path: '',    component: ShipmentsListComponent },
  { path: 'new', component: ShipmentFormComponent },
  { path: ':id', component: ShipmentDetailComponent },
];

@NgModule({
  declarations: [ShipmentsListComponent, ShipmentDetailComponent, ShipmentFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ShipmentsModule {}
