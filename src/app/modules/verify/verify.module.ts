import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { VerifyComponent } from './verify.component';

const routes: Routes = [
  { path: ':type/:id', component: VerifyComponent },
  { path: ':type',     component: VerifyComponent },
  { path: '',          component: VerifyComponent },
];

@NgModule({
  declarations: [VerifyComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class VerifyModule {}
