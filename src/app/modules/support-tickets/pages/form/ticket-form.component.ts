import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupportTicketService, CreateTicketDto } from '../../../../core/services/support-ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TicketType } from '../../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-ticket-form',
  template: `
    <div class="form-wrapper">
      <div class="form-card">

        <div class="form-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="form-title">Novo Ticket de Suporte</h1>
            <p class="form-subtitle">Descreva o seu problema — a nossa equipa responderá brevemente.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ticket-form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de ticket</mat-label>
            <mat-select formControlName="type">
              <mat-option value="technical">Problema Técnico</mat-option>
              <mat-option value="licensing">Licenciamento</mat-option>
              <mat-option value="billing">Pagamentos / Facturação</mat-option>
              <mat-option value="compliance">Conformidade</mat-option>
              <mat-option value="other">Outro</mat-option>
            </mat-select>
            <mat-error>Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Assunto</mat-label>
            <input matInput formControlName="subject" placeholder="Resuma o problema em poucas palavras">
            <mat-error *ngIf="form.get('subject')?.hasError('required')">Obrigatório</mat-error>
            <mat-error *ngIf="form.get('subject')?.hasError('minlength')">Mínimo 5 caracteres</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descrição detalhada</mat-label>
            <textarea matInput formControlName="description" rows="5"
                      placeholder="Descreva o problema com o máximo de detalhe possível..."></textarea>
            <mat-error *ngIf="form.get('description')?.hasError('required')">Obrigatório</mat-error>
            <mat-error *ngIf="form.get('description')?.hasError('minlength')">Mínimo 20 caracteres</mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMsg }}</span>
          </div>

          <div class="form-actions">
            <button mat-button type="button" (click)="goBack()">Cancelar</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Abrir Ticket</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .form-wrapper {
      padding: 24px;
      max-width: 620px;
      margin: 0 auto;
    }

    .form-card {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .form-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 24px;
    }

    .form-title { font-size: 20px; font-weight: 700; color: var(--primary); margin: 0 0 4px; }
    .form-subtitle { font-size: 13px; color: #888; margin: 0; }

    .ticket-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c5221f;
      font-size: 13px;
      background: #fce8e6;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    mat-spinner { display: inline-block; }
  `],
})
export class TicketFormComponent implements OnInit {
  form!: FormGroup;
  loading  = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private ticketSvc: SupportTicketService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      type:        ['technical', Validators.required],
      subject:     ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading  = true;
    this.errorMsg = '';

    const v = this.form.value;
    const dto: CreateTicketDto = {
      type:    v.type as TicketType,
      subject: v.subject,
      content: { description: v.description },
    };

    this.ticketSvc.create(dto).subscribe({
      next: (ticket) => {
        this.loading = false;
        const user = this.auth.getCurrentUser();
        if (user) {
          this.router.navigate([`/dashboard/${user.role}/support-tickets`, ticket.id]);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const data = err.error;
        if (Array.isArray(data?.message)) {
          this.errorMsg = data.message.join(' | ');
        } else {
          this.errorMsg = data?.message ?? 'Erro ao criar ticket. Tente novamente.';
        }
      },
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
