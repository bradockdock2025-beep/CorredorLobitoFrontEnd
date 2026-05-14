import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../../../../core/services/reports.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models';

@Component({
  selector: 'app-report-form',
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">add_chart</mat-icon>
          <h1 class="page-title">Novo Relatório</h1>
        </div>
        <nav class="breadcrumb">
          <a (click)="back()">Relatórios</a>
          <mat-icon class="bc-sep">chevron_right</mat-icon>
          <span>Novo</span>
        </nav>
      </div>
    </div>

    <!-- Progress bar -->
    <mat-progress-bar mode="indeterminate" *ngIf="saving"></mat-progress-bar>

    <mat-card class="card-sm">
      <mat-card-content>
        <div class="card-section">
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">

            <!-- Title -->
            <mat-form-field appearance="outline">
              <mat-label>Título *</mat-label>
              <input matInput formControlName="title" placeholder="ex: Relatório Operacional Q1 2026">
              <mat-error>Campo obrigatório</mat-error>
            </mat-form-field>

            <!-- Type + Target Audience -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Tipo *</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="operational">Operacional</mat-option>
                  <mat-option value="fiscal">Fiscal</mat-option>
                  <mat-option value="strategic">Estratégico</mat-option>
                  <mat-option value="compliance">Conformidade</mat-option>
                </mat-select>
                <mat-error>Campo obrigatório</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Audiência</mat-label>
                <mat-select formControlName="targetAudience">
                  <mat-option value="public">Público</mat-option>
                  <mat-option value="government">Governo</mat-option>
                  <mat-option value="internal">Interno</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Period -->
            <mat-form-field appearance="outline">
              <mat-label>Período</mat-label>
              <input matInput formControlName="period" placeholder="ex: Q1 2026">
              <mat-hint>Opcional — ex: Q1 2026, Janeiro 2026, Anual 2025</mat-hint>
            </mat-form-field>

            <!-- Form actions -->
            <div class="form-actions">
              <button mat-button type="button" (click)="back()">Cancelar</button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="form.invalid || saving">
                <mat-icon>save</mat-icon> Guardar como Rascunho
              </button>
            </div>

          </form>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ReportFormComponent implements OnInit {
  form: FormGroup;
  saving = false;
  private role: Role | string = '';

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private auth: AuthService,
    public router: Router,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      title:          ['', Validators.required],
      type:           ['', Validators.required],
      targetAudience: ['internal'],
      period:         [''],
    });
  }

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? '';
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.reportsService.create({
      title:          v.title,
      type:           v.type,
      targetAudience: v.targetAudience || undefined,
      period:         v.period || undefined,
    }).subscribe({
      next: (report) => {
        this.snack.open('Relatório criado como rascunho', 'Fechar', { duration: 3000 });
        this.router.navigate([`/dashboard/${this.role}/reports`, report.id]);
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.message ?? 'Erro ao criar relatório', 'Fechar', { duration: 4000 });
      },
    });
  }

  back(): void {
    this.router.navigate([`/dashboard/${this.role}/reports`]);
  }
}
