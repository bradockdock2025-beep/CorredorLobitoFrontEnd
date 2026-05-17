import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';

@Component({
  selector: 'app-product-form',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <mat-icon class="page-icon">inventory_2</mat-icon>
          <h2 class="page-title">Novo Produto</h2>
        </div>
        <div class="breadcrumb">
          <a (click)="back()">Produtos</a>
          <span class="sep">›</span>
          <span>Novo Produto</span>
        </div>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loadingUser || saving"></mat-progress-bar>

    <!-- Empresa sem licença activa ─────────────────────────────────── -->
    <div class="blocked-banner" *ngIf="!loadingUser && companyStatus && companyStatus !== 'active'">
      <mat-icon>lock</mat-icon>
      <div>
        <strong>Empresa sem licença activa</strong>
        <span>A empresa <em>{{ companyName }}</em> tem o estado <strong>{{ companyStatus }}</strong>.
          Não é possível criar produtos até a licença ser aprovada pelo STATE.</span>
      </div>
    </div>

    <!-- Formulário ─────────────────────────────────────────────────── -->
    <ng-container *ngIf="!loadingUser && companyStatus === 'active'">

      <!-- Card: empresa associada (read-only) -->
      <mat-card class="company-card">
        <mat-card-content>
          <div class="company-info">
            <mat-icon class="company-icon">business</mat-icon>
            <div>
              <div class="company-name">{{ companyName }}</div>
              <div class="company-status">
                <mat-icon class="status-icon">verified</mat-icon> Licença activa
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>

          <!-- ── Secção 1: Informação básica ──────────────────────── -->
          <div class="card-section">
            <p class="card-section-title">Informação do Produto</p>
            <form [formGroup]="form" class="form">

              <mat-form-field appearance="outline">
                <mat-label>Nome do Produto *</mat-label>
                <input matInput formControlName="name" placeholder="Ex: Cimento Portland 50kg">
                <mat-error *ngIf="form.get('name')?.hasError('required')">Obrigatório</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoria *</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="construção">Construção</mat-option>
                  <mat-option value="alimentação">Alimentação</mat-option>
                  <mat-option value="energia">Energia</mat-option>
                  <mat-option value="mineração">Mineração</mat-option>
                  <mat-option value="têxtil">Têxtil</mat-option>
                  <mat-option value="químico">Químico</mat-option>
                  <mat-option value="agrícola">Agrícola</mat-option>
                  <mat-option value="industrial">Industrial</mat-option>
                  <mat-option value="general">Geral</mat-option>
                </mat-select>
                <mat-hint>A categoria determina o imposto aplicado no pagamento</mat-hint>
                <mat-error>Obrigatório</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Descrição</mat-label>
                <textarea matInput formControlName="description" rows="3"
                          placeholder="Descreva o produto — composição, origem, normas aplicáveis..."></textarea>
              </mat-form-field>

            </form>
          </div>

          <mat-divider></mat-divider>

          <!-- ── Secção 2: Especificações técnicas (metadata) ─────── -->
          <div class="card-section">
            <div class="section-header">
              <p class="card-section-title" style="margin:0">Especificações Técnicas</p>
              <button mat-stroked-button type="button" (click)="addMetaField()">
                <mat-icon>add</mat-icon> Adicionar campo
              </button>
            </div>
            <p class="meta-hint">Opcional. Adicione características técnicas como norma, peso, certificado, etc.</p>

            <div class="meta-rows" [formGroup]="form">
              <div formArrayName="metaFields">
                <div class="meta-row" *ngFor="let ctrl of metaFields.controls; let i = index" [formGroupName]="i">
                  <mat-form-field appearance="outline" class="meta-key">
                    <mat-label>Característica</mat-label>
                    <input matInput formControlName="key" placeholder="Ex: norma, peso, certificado">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="meta-val">
                    <mat-label>Valor</mat-label>
                    <input matInput formControlName="value" placeholder="Ex: ISO 9001, 50kg, IANORQ-2026">
                  </mat-form-field>
                  <button mat-icon-button type="button" (click)="removeMetaField(i)" matTooltip="Remover">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="meta-empty" *ngIf="metaFields.length === 0">
              <mat-icon>info_outline</mat-icon>
              Sem especificações técnicas adicionadas.
              <button mat-button type="button" (click)="addMetaField()">Adicionar agora</button>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- ── Acções ─────────────────────────────────────────── -->
          <div class="form-actions" style="margin-top:20px">
            <button mat-button type="button" (click)="back()">Cancelar</button>
            <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="submit()">
              <mat-icon>add</mat-icon>
              Criar Produto (rascunho)
            </button>
          </div>

        </mat-card-content>
      </mat-card>

    </ng-container>
  `,
  styles: [`
    .blocked-banner {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
      color: #e65100;
    }
    .blocked-banner > mat-icon { font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; }
    .blocked-banner > div { display: flex; flex-direction: column; gap: 4px; }
    .blocked-banner strong { font-size: 15px; }
    .blocked-banner span   { font-size: 13px; color: #bf360c; }

    .company-card { margin-bottom: 16px; background: #f1f8e9 !important; }

    .company-info { display: flex; align-items: center; gap: 14px; }

    .company-icon { font-size: 32px; width: 32px; height: 32px; color: #2e7d32; }

    .company-name   { font-size: 16px; font-weight: 700; color: var(--primary); }
    .company-status {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: #2e7d32; margin-top: 2px;
    }
    .status-icon { font-size: 14px; width: 14px; height: 14px; }

    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }

    .meta-hint { font-size: 12px; color: #888; margin: 0 0 16px; }

    .meta-rows { display: flex; flex-direction: column; gap: 4px; }

    .meta-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .meta-key { flex: 1; }
    .meta-val { flex: 2; }

    .meta-empty {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #bbb;
      font-size: 13px;
      padding: 12px 0;
    }
    .meta-empty mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
})
export class ProductFormComponent implements OnInit {
  form: FormGroup;
  saving      = false;
  loadingUser = true;
  companyId   = '';
  companyName = '';
  companyStatus = '';

  constructor(
    private fb: FormBuilder,
    private svc: ProductService,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      category:    ['general', Validators.required],
      description: [''],
      metaFields:  this.fb.array([]),
    });
  }

  get metaFields(): FormArray {
    return this.form.get('metaFields') as FormArray;
  }

  ngOnInit(): void {
    // Tentar usar dados já em memória primeiro
    const cached = this.auth.getCurrentUser();
    if (cached?.companyId && cached?.company) {
      this.companyId     = cached.companyId;
      this.companyName   = cached.company.name;
      this.companyStatus = cached.company.licenseStatus;
      this.loadingUser   = false;
    } else {
      // Buscar perfil completo da API
      this.auth.getMe().subscribe({
        next: (user: AuthUser) => {
          this.companyId     = user.companyId ?? '';
          this.companyName   = user.company?.name ?? '—';
          this.companyStatus = user.company?.licenseStatus ?? '';
          this.loadingUser   = false;
        },
        error: () => {
          this.loadingUser = false;
          this.snack.open('Não foi possível carregar os dados da empresa.', 'Fechar', { duration: 4000 });
        },
      });
    }
  }

  addMetaField(): void {
    this.metaFields.push(this.fb.group({ key: [''], value: [''] }));
  }

  removeMetaField(i: number): void {
    this.metaFields.removeAt(i);
  }

  back(): void {
    this.router.navigate(['/dashboard/producer/products']);
  }

  submit(): void {
    if (this.form.invalid || !this.companyId) return;
    this.saving = true;

    // Construir metadata a partir dos pares chave/valor preenchidos
    const metaEntries = (this.metaFields.value as { key: string; value: string }[])
      .filter((e) => e.key.trim() && e.value.trim());

    const metadata: Record<string, string> | undefined =
      metaEntries.length > 0
        ? Object.fromEntries(metaEntries.map((e) => [e.key.trim(), e.value.trim()]))
        : undefined;

    const payload: { name: string; category: string; description?: string; companyId: string; metadata?: Record<string, string> } = {
      name:      this.form.value.name,
      category:  this.form.value.category,
      companyId: this.companyId,
    };
    if (this.form.value.description?.trim()) payload.description = this.form.value.description.trim();
    if (metadata) payload.metadata = metadata;

    this.svc.create(payload).subscribe({
      next: (p) => {
        this.snack.open('Produto criado como rascunho.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/dashboard/producer/products', p.id]);
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.message ?? 'Erro ao criar produto', 'Fechar', { duration: 4000 });
      },
    });
  }
}
