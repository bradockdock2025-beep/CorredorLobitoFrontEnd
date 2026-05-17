import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { TwoFASetupComponent } from './pages/two-fa-setup/two-fa-setup.component';

const routes: Routes = [
  { path: '',          component: LoginComponent },
  { path: 'register',  component: RegisterComponent },
  { path: '2fa/setup', component: TwoFASetupComponent },
];

@NgModule({
  declarations: [LoginComponent, RegisterComponent, TwoFASetupComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AuthModule {}
