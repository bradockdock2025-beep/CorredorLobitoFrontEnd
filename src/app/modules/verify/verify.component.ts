import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type VerifyType = 'license' | 'invoice' | 'receipt' | 'dispatch';
type VerifyState = 'loading' | 'valid' | 'invalid' | 'error' | 'unknown';

interface VerifyResult {
  valid:       boolean;
  type:        VerifyType;
  message:     string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-verify',
  template: `
    <div class="verify-page">

      <div class="verify-card">

        <!-- Cabeçalho oficial ──────────────────────────────────── -->
        <div class="verify-header">
          <div class="gov-chip">REPÚBLICA DE ANGOLA</div>
          <mat-icon class="verify-logo">route</mat-icon>
          <h1 class="verify-title">Corredor do Lobito</h1>
          <p class="verify-subtitle">Sistema de Verificação de Documentos Oficiais</p>
        </div>

        <!-- Loading ────────────────────────────────────────────── -->
        <div class="verify-body" *ngIf="state === 'loading'">
          <mat-spinner diameter="48"></mat-spinner>
          <p>A verificar autenticidade do documento…</p>
        </div>

        <!-- Sem parâmetros ─────────────────────────────────────── -->
        <div class="verify-body" *ngIf="state === 'unknown'">
          <mat-icon class="state-icon state-warn">help_outline</mat-icon>
          <h2>Documento não identificado</h2>
          <p>Este link de verificação não contém uma referência de documento válida.</p>
        </div>

        <!-- Erro de rede ───────────────────────────────────────── -->
        <div class="verify-body" *ngIf="state === 'error'">
          <mat-icon class="state-icon state-warn">wifi_off</mat-icon>
          <h2>Erro de ligação</h2>
          <p>Não foi possível verificar o documento. Tente novamente.</p>
          <button mat-raised-button (click)="verify()">Tentar novamente</button>
        </div>

        <!-- Documento VÁLIDO ────────────────────────────────────── -->
        <div class="verify-body" *ngIf="state === 'valid' && result">
          <div class="valid-badge">
            <mat-icon>verified</mat-icon>
          </div>
          <h2>{{ typeLabel(result.type) }}</h2>
          <p class="valid-msg">{{ result.message }}</p>

          <div class="result-grid">
            <ng-container *ngFor="let field of resultFields()">
              <div class="result-field" *ngIf="field.value">
                <span class="rf-label">{{ field.label }}</span>
                <span class="rf-val">{{ field.value }}</span>
              </div>
            </ng-container>
          </div>

          <div class="verified-at">
            Verificado em {{ verifiedAt() }}
          </div>
        </div>

        <!-- Documento INVÁLIDO ──────────────────────────────────── -->
        <div class="verify-body" *ngIf="state === 'invalid' && result">
          <mat-icon class="state-icon state-invalid">cancel</mat-icon>
          <h2>Documento Inválido</h2>
          <p class="invalid-msg">{{ result.message }}</p>
          <div class="result-grid" *ngIf="result['status']">
            <div class="result-field">
              <span class="rf-label">Estado</span>
              <span class="rf-val">{{ result['status'] }}</span>
            </div>
          </div>
        </div>

        <!-- Rodapé ─────────────────────────────────────────────── -->
        <div class="verify-footer">
          <mat-icon>lock</mat-icon>
          Verificação segura · Corredor do Lobito · {{ currentYear }}
        </div>

      </div>

    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary) 0%, #0d2137 100%);
      padding: 24px;
    }

    .verify-card {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.35);
    }

    /* Cabeçalho */
    .verify-header {
      background: linear-gradient(135deg, var(--primary) 0%, #0d2137 100%);
      color: #fff;
      padding: 32px 32px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .gov-chip {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ef5350;
      background: rgba(239,83,80,0.15);
      border: 1px solid rgba(239,83,80,0.3);
      border-radius: 4px;
      padding: 3px 8px;
    }

    .verify-logo {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: rgba(255,255,255,0.85);
    }

    .verify-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    .verify-subtitle {
      font-size: 12px;
      color: rgba(255,255,255,0.55);
      margin: 0;
    }

    /* Body */
    .verify-body {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .verify-body mat-spinner { margin-bottom: 8px; }
    .verify-body > p { font-size: 14px; color: #666; margin: 0; }

    /* Válido */
    .valid-badge {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2e7d32, #43a047);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(46,125,50,0.4);
    }

    .valid-badge mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #fff;
    }

    .verify-body h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1a2e42;
      margin: 0;
    }

    .valid-msg {
      font-size: 14px;
      color: #2e7d32;
      font-weight: 600;
      margin: 0;
    }

    /* Inválido */
    .state-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .state-invalid { color: #c5221f; }
    .state-warn    { color: #f57f17; }

    .invalid-msg {
      font-size: 14px;
      color: #c5221f;
      font-weight: 600;
      margin: 0;
    }

    /* Grid de resultados */
    .result-grid {
      width: 100%;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      text-align: left;
    }

    .result-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      border-bottom: 1px solid #f5f5f5;
      font-size: 13px;
    }

    .result-field:last-child { border-bottom: none; }

    .rf-label { color: #888; font-weight: 500; }
    .rf-val   { color: #333; font-weight: 600; text-align: right; max-width: 60%; }

    .verified-at {
      font-size: 11px;
      color: #bbb;
    }

    /* Rodapé */
    .verify-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 14px 24px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
    }

    .verify-footer mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class VerifyComponent implements OnInit {
  state: VerifyState = 'loading';
  result: VerifyResult | null = null;
  currentYear = new Date().getFullYear();

  private docType: VerifyType | null = null;
  private docId   = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') as VerifyType;
    const id   = this.route.snapshot.paramMap.get('id') ?? '';

    if (!type || !id) { this.state = 'unknown'; return; }

    this.docType = type;
    this.docId   = id;
    this.verify();
  }

  verify(): void {
    if (!this.docType || !this.docId) return;
    this.state = 'loading';

    const url = `${environment.apiUrl}/verify/${this.docType}/${this.docId}`;
    this.http.get<VerifyResult>(url).subscribe({
      next: (res) => {
        this.result = res;
        this.state  = res.valid ? 'valid' : 'invalid';
      },
      error: () => { this.state = 'error'; },
    });
  }

  verifiedAt(): string {
    const v = this.result?.['verifiedAt'];
    if (!v) return '';
    return new Date(v as string).toLocaleString('pt-PT');
  }

  typeLabel(type: VerifyType): string {
    const m: Record<VerifyType, string> = {
      license:  'Licença Comercial',
      invoice:  'Fatura Comercial',
      receipt:  'Recibo de Pagamento',
      dispatch: 'Despacho Aduaneiro',
    };
    return m[type] ?? type;
  }

  resultFields(): { label: string; value: string }[] {
    if (!this.result) return [];
    const r = this.result;

    const license = [
      { label: 'Empresa',         value: r['entity'] as string },
      { label: 'Código',          value: r['entityCode'] as string },
      { label: 'País',            value: r['country'] ? (r['country'] as string).toUpperCase() : '' },
      { label: 'Nº de Licença',   value: r['licenseNumber'] as string },
      { label: 'Válida até',      value: r['expiresAt'] ? new Date(r['expiresAt'] as string).toLocaleDateString('pt-PT') : '' },
      { label: 'Estado',          value: r['status'] as string },
    ];

    const invoice = [
      { label: 'Pedido',          value: r['orderCode'] as string },
      { label: 'Transação',       value: r['transactionCode'] as string },
      { label: 'Empresa',         value: r['buyerCompany'] as string },
      { label: 'Total',           value: r['totalAmount'] ? `${r['totalAmount']} ${r['currency']}` : '' },
      { label: 'Pago em',         value: r['paidAt'] ? new Date(r['paidAt'] as string).toLocaleDateString('pt-PT') : '' },
    ];

    const receipt = [
      { label: 'Pedido',          value: r['orderCode'] as string },
      { label: 'Transação',       value: r['transactionCode'] as string },
      { label: 'Valor',           value: r['amount'] ? `${r['amount']} ${r['currency']}` : '' },
      { label: 'Pago em',         value: r['paidAt'] ? new Date(r['paidAt'] as string).toLocaleDateString('pt-PT') : '' },
    ];

    const dispatch = [
      { label: 'Embarque',        value: r['shipmentCode'] as string },
      { label: 'Pedido',          value: r['orderCode'] as string },
      { label: 'Rota',            value: r['origin'] && r['destination'] ? `${r['origin']} → ${r['destination']}` : '' },
      { label: 'Estado Despacho', value: r['dispatchStatus'] as string },
      { label: 'Aprovado em',     value: r['approvedAt'] ? new Date(r['approvedAt'] as string).toLocaleDateString('pt-PT') : '' },
    ];

    const map: Record<VerifyType, typeof license> = {
      license: license, invoice: invoice,
      receipt: receipt, dispatch: dispatch,
    };

    return (map[r.type] ?? []).filter((f) => !!f.value);
  }
}
