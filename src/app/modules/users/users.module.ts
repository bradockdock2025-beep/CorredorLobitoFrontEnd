import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UsersListComponent } from './pages/list/users-list.component';
import { UserDetailComponent } from './pages/detail/user-detail.component';

const routes: Routes = [
  { path: '',    component: UsersListComponent },
  { path: ':id', component: UserDetailComponent },
];

@NgModule({
  declarations: [UsersListComponent, UserDetailComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UsersModule {}
