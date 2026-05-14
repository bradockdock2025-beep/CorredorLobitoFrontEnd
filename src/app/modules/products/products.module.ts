import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProductsListComponent }  from './pages/list/products-list.component';
import { ProductDetailComponent } from './pages/detail/product-detail.component';
import { ProductFormComponent }   from './pages/form/product-form.component';

const routes: Routes = [
  { path: '',    component: ProductsListComponent },
  { path: 'new', component: ProductFormComponent },
  { path: ':id', component: ProductDetailComponent },
];

@NgModule({
  declarations: [ProductsListComponent, ProductDetailComponent, ProductFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ProductsModule {}
