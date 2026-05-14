import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title:          string;
  message:        string;
  confirmText?:   string;
  cancelText?:    string;
  inputLabel?:    string;
  inputRequired?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p style="color:#424242;font-size:14px;margin-bottom:0">{{ data.message }}</p>
      <mat-form-field *ngIf="data.inputLabel" appearance="outline" style="width:100%;margin-top:16px">
        <mat-label>{{ data.inputLabel }}</mat-label>
        <textarea matInput [(ngModel)]="inputValue" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="gap:8px;padding:16px">
      <button mat-button mat-dialog-close>{{ data.cancelText || 'Cancelar' }}</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="data.inputRequired && !inputValue.trim()"
        (click)="confirm()"
      >{{ data.confirmText || 'Confirmar' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 380px; padding-top: 8px !important; }
  `],
})
export class ConfirmDialogComponent {
  inputValue = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  confirm(): void {
    this.dialogRef.close(this.data.inputLabel ? this.inputValue : true);
  }
}
