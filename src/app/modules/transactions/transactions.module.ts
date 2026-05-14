import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TransactionsListComponent }   from './pages/list/transactions-list.component';
import { TransactionDetailComponent }  from './pages/detail/transaction-detail.component';

const routes: Routes = [
  { path: '',    component: TransactionsListComponent },
  { path: ':id', component: TransactionDetailComponent },
];

@NgModule({
  declarations: [TransactionsListComponent, TransactionDetailComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class TransactionsModule {}
