import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PriceProposalsListComponent }   from './pages/list/price-proposals-list.component';
import { PriceProposalDetailComponent }  from './pages/detail/price-proposal-detail.component';
import { PriceProposalFormComponent }    from './pages/form/price-proposal-form.component';

const routes: Routes = [
  { path: '',    component: PriceProposalsListComponent },
  { path: 'new', component: PriceProposalFormComponent },
  { path: ':id', component: PriceProposalDetailComponent },
];

@NgModule({
  declarations: [PriceProposalsListComponent, PriceProposalDetailComponent, PriceProposalFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PriceProposalsModule {}
