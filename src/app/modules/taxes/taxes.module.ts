import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TaxesListComponent } from './pages/list/taxes-list.component';
import { TaxFormComponent }   from './pages/form/tax-form.component';

const routes: Routes = [
  { path: '',    component: TaxesListComponent },
  { path: 'new', component: TaxFormComponent },
];

@NgModule({
  declarations: [TaxesListComponent, TaxFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class TaxesModule {}
