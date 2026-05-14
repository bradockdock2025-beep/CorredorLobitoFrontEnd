import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CompaniesListComponent }   from './pages/list/companies-list.component';
import { CompanyDetailComponent }   from './pages/detail/company-detail.component';
import { CompanyFormComponent }     from './pages/form/company-form.component';

const routes: Routes = [
  { path: '',      component: CompaniesListComponent },
  { path: 'new',   component: CompanyFormComponent },
  { path: ':id',   component: CompanyDetailComponent },
];

@NgModule({
  declarations: [CompaniesListComponent, CompanyDetailComponent, CompanyFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CompaniesModule {}
