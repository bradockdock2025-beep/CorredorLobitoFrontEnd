import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

const MATERIAL = [
  MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule,
  MatButtonModule, MatDividerModule, MatDialogModule, MatFormFieldModule,
  MatInputModule, MatSnackBarModule, MatTableModule, MatCardModule,
  MatChipsModule, MatProgressSpinnerModule, MatProgressBarModule,
  MatTooltipModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
  MatMenuModule, MatBadgeModule, MatStepperModule, MatButtonToggleModule,
  MatExpansionModule, MatSlideToggleModule, MatAutocompleteModule,
];

@NgModule({
  declarations: [
    TopbarComponent,
    SidebarComponent,
    MainLayoutComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ...MATERIAL],
  exports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    TopbarComponent, SidebarComponent, MainLayoutComponent,
    StatusBadgeComponent, ConfirmDialogComponent,
    ...MATERIAL,
  ],
})
export class SharedModule {}
