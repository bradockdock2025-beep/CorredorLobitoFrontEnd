import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OrdersListComponent }  from './pages/list/orders-list.component';
import { OrderDetailComponent } from './pages/detail/order-detail.component';
import { OrderFormComponent }   from './pages/form/order-form.component';

const routes: Routes = [
  { path: '',    component: OrdersListComponent },
  { path: 'new', component: OrderFormComponent },
  { path: ':id', component: OrderDetailComponent },
];

@NgModule({
  declarations: [OrdersListComponent, OrderDetailComponent, OrderFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class OrdersModule {}
