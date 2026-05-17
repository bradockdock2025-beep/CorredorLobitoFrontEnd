import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { Shipment, Role, ShipmentStatus } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shipment-detail',
  styles: [`
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:800px 100%; animation:shimmer 1.4s infinite linear; border-radius:4px; }
    .sk-title { height:28px; width:220px; }
    .sk-label { height:12px; width:120px; margin-bottom:20px; }
    .sk-field  { height:44px; margin-bottom:16px; }
    .detail-progress { position:sticky; top:0; z-index:10; margin-bottom:16px; }
    .pdf-bar {
      display: flex; align-items: center; gap: 12px;
      background: #e8f5e9; border: 1px solid #c8e6c9;
      border-radius: 10px; padding: 12px 16px;
    }
    .pdf-bar-icon { color: #2e7d32; }
    .pdf-bar span { flex: 1; font-size: 14px; font-weight: 600; color: #1b5e20; }
    .tracking-form-card { margin-bottom: 16px; border: 2px solid var(--primary) !important; }
    .tracking-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .tracking-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .order-ref { font-family: monospace; font-size: 13px; color: var(--primary); }
    .warn-text { color: #c5221f; }
  `],
  template: `
    <!-- Progress bar — always visible during any loading -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading" class="detail-progress"></mat-progress-bar>

    <!-- Skeleton loading -->
    <ng-container *ngIf="loading && !shipment">
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb"><span>Embarques</span><mat-icon class="bc-sep">chevron_right</mat-icon><span>A carregar…</span></nav>
          <div class="detail-title-row"><mat-icon class="page-icon">local_shipping</mat-icon><div class="sk sk-title"></div></div>
        </div>
      </div>
      <div class="detail-2col">
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3,4]"></div></mat-card-content></mat-card>
        <mat-card><mat-card-content class="card-section"><div class="sk sk-label"></div><div class="sk sk-field" *ngFor="let i of [1,2,3]"></div></mat-card-content></mat-card>
      </div>
    </ng-container>

    <!-- Error state -->
    <div class="error-state" *ngIf="!loading && !shipment && loadError">
      <mat-icon>error_outline</mat-icon>
      <p>Não foi possível carregar os dados. Verifique a sua ligação e tente novamente.</p>
      <button mat-stroked-button (click)="reload()"><mat-icon>refresh</mat-icon> Tentar novamente</button>
    </div>

    <!-- Real content -->
    <ng-container *ngIf="shipment">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="detail-title-group">
          <nav class="breadcrumb">
            <a (click)="back()">Embarques</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span>{{ shipment.cd }}</span>
          </nav>
          <div class="detail-title-row">
            <mat-icon class="page-icon">local_shipping</mat-icon>
            <h1 class="detail-title">Embarque {{ shipment.cd }}</h1>
            <app-status-badge [status]="shipment.status"></app-status-badge>
          </div>
          <p class="text-muted text-sm">{{ shipment.origin }} → {{ shipment.destination }}</p>
          <p class="text-muted text-sm" *ngIf="!hasActions">Sem acções disponíveis para o estado actual.</p>
        </div>

        <div class="detail-actions">
          <!-- OPERATOR: só pode actualizar se o embarque não estiver entregue/rejeitado -->
          <ng-container *ngIf="role === 'operator' && canOperatorUpdate()">
            <button mat-raised-button color="primary" (click)="toggleTrackingForm()">
              <mat-icon>edit_location</mat-icon>
              {{ showTrackingForm ? 'Cancelar' : 'Actualizar Localização' }}
            </button>
          </ng-container>

          <!-- CUSTOMS: at_border -->
          <ng-container *ngIf="role === 'customs'">
            <button mat-stroked-button
                    *ngIf="shipment.status === 'at_border'"
                    (click)="reject()">
              <mat-icon>cancel</mat-icon> Rejeitar
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="shipment.status === 'at_border'"
                    (click)="approve()">
              <mat-icon>check_circle</mat-icon> Aprovar Embarque
            </button>
            <button mat-raised-button color="primary"
                    *ngIf="['at_border','in_transit'].includes(shipment.status)"
                    (click)="hold()">
              <mat-icon>pause</mat-icon> Reter
            </button>
          </ng-container>

          <!-- STATE — reter apenas em estados activos -->
          <ng-container *ngIf="role === 'state' && canStateHold()">
            <button mat-raised-button color="warn" (click)="hold()">
              <mat-icon>pause</mat-icon> Reter Embarque
            </button>
          </ng-container>
        </div>
      </div>

      <!-- ── Formulário de tracking (inline, operator) ───────────────── -->
      <mat-card class="tracking-form-card" *ngIf="role === 'operator' && showTrackingForm">
        <mat-card-content class="card-section">
          <p class="card-section-title">Actualizar Localização</p>
          <div class="tracking-form">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Localização actual *</mat-label>
              <mat-icon matPrefix>place</mat-icon>
              <input matInput [(ngModel)]="trackingLocation"
                     placeholder="ex: Fronteira de Luau, Angola">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Estado do embarque *</mat-label>
              <mat-select [(ngModel)]="trackingStatus">
                <mat-option value="created">Criado</mat-option>
                <mat-option value="in_transit">Em Trânsito</mat-option>
                <mat-option value="at_border">Na Fronteira</mat-option>
                <mat-option value="delivered">Entregue</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notas (opcional)</mat-label>
              <textarea matInput [(ngModel)]="trackingNotes" rows="2"
                        placeholder="ex: Documentação entregue à alfândega"></textarea>
            </mat-form-field>

            <div class="tracking-actions">
              <button mat-button type="button" (click)="toggleTrackingForm()">Cancelar</button>
              <button mat-raised-button color="primary"
                      [disabled]="!trackingLocation.trim() || !trackingStatus || savingTracking"
                      (click)="submitTracking()">
                <mat-spinner diameter="16" *ngIf="savingTracking"></mat-spinner>
                <mat-icon *ngIf="!savingTracking">save</mat-icon>
                <span>Guardar Actualização</span>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ── Info card ───────────────────────────────────────────────── -->
      <mat-card>
        <mat-card-content class="card-section">
          <p class="card-section-title">Informação do Embarque</p>
          <div class="detail-grid">
            <div class="detail-field">
              <label>Pedido</label>
              <span>—</span>
            </div>
            <div class="detail-field">
              <label>Operador</label>
              <span>{{ shipment.operator?.fullName ?? '—' }}</span>
            </div>
            <div class="detail-field">
              <label>Origem</label>
              <span>{{ shipment.origin }}</span>
            </div>
            <div class="detail-field">
              <label>Destino</label>
              <span>{{ shipment.destination }}</span>
            </div>
            <div class="detail-field">
              <label>ETA</label>
              <span>{{ shipment.eta ? (shipment.eta | date:'dd/MM/yyyy') : '—' }}</span>
            </div>
            <div class="detail-field">
              <label>Última Localização</label>
              <span>{{ shipment.lastLocation ?? '—' }}</span>
            </div>
            <div class="detail-field" *ngIf="shipment.holdReason">
              <label>Motivo Retenção</label>
              <span class="warn-text">{{ shipment.holdReason }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ── Tracking card ───────────────────────────────────────────── -->
      <mat-card class="mt-md">
        <mat-card-content class="card-section">
          <p class="card-section-title">Tracking de Localização</p>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                Ver todos os eventos ({{ shipment.trackingEvents.length }})
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="timeline" *ngIf="shipment.trackingEvents.length > 0">
              <div class="timeline-item" *ngFor="let ev of shipment.trackingEvents | slice:0:50">
                <div class="timeline-time">{{ ev.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="timeline-label">
                  {{ ev.location }} —
                  <app-status-badge [status]="ev.status"></app-status-badge>
                </div>
                <div class="timeline-sub" *ngIf="ev.notes">{{ ev.notes }}</div>
              </div>
            </div>

            <p class="text-muted text-sm" *ngIf="shipment.trackingEvents.length === 0">
              Sem eventos de tracking registados.
            </p>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>

      <!-- ── Alfândega card ──────────────────────────────────────────── -->
      <mat-card class="mt-md" *ngIf="shipment.customsDispatch">
        <mat-card-content class="card-section">
          <p class="card-section-title">Alfândega</p>
          <div class="detail-grid">
            <div class="detail-field">
              <label>Estado</label>
              <app-status-badge [status]="shipment.customsDispatch!.status"></app-status-badge>
            </div>
            <div class="detail-field" *ngIf="shipment.customsDispatch!.notes">
              <label>Notas</label>
              <span>{{ shipment.customsDispatch!.notes }}</span>
            </div>
            <div class="detail-field" *ngIf="shipment.customsDispatch!.rejectionReason">
              <label>Motivo Rejeição</label>
              <span>{{ shipment.customsDispatch!.rejectionReason }}</span>
            </div>
            <div class="detail-field" *ngIf="shipment.customsDispatch!.validatedAt">
              <label>Validado em</label>
              <span>{{ shipment.customsDispatch!.validatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Despacho PDF ──────────────────────────────────────────── -->
      <div class="mt-md" *ngIf="shipment.customsDispatch?.status === 'approved'">
        <div class="pdf-bar">
          <mat-icon class="pdf-bar-icon">description</mat-icon>
          <span>Despacho Aduaneiro disponível</span>
          <button mat-raised-button color="primary" (click)="downloadDispatchPdf()" [disabled]="pdfLoading">
            <mat-spinner diameter="16" *ngIf="pdfLoading"></mat-spinner>
            <mat-icon *ngIf="!pdfLoading">picture_as_pdf</mat-icon>
            Descarregar Despacho PDF
          </button>
        </div>
      </div>

      <!-- Documentos do embarque ────────────────────────────────── -->
      <div class="mt-md">
        <app-documents-panel
          entityType="shipment"
          [entityId]="shipment.id"
          [documents]="shipment.documents ?? []"
          [autoLoad]="true">
        </app-documents-panel>
      </div>

    </ng-container>
  `,
})
export class ShipmentDetailComponent implements OnInit {
  shipment:      Shipment | null = null;
  loading        = false;
  loadError      = false;
  pdfLoading     = false;
  role: Role | null = null;

  // tracking form
  showTrackingForm = false;
  savingTracking   = false;
  trackingLocation = '';
  trackingStatus: ShipmentStatus = 'in_transit';
  trackingNotes    = '';

  get hasActions(): boolean {
    if (!this.shipment) return false;
    if (this.role === 'operator' && this.canOperatorUpdate()) return true;
    if (this.role === 'customs'  && ['at_border','in_transit'].includes(this.shipment.status)) return true;
    if (this.role === 'state'    && this.canStateHold()) return true;
    return false;
  }

  canOperatorUpdate(): boolean {
    if (!this.shipment) return false;
    return !['delivered', 'customs_rejected'].includes(this.shipment.status);
  }

  canStateHold(): boolean {
    if (!this.shipment) return false;
    return !['delivered', 'customs_rejected', 'held'].includes(this.shipment.status);
  }

  toggleTrackingForm(): void {
    this.showTrackingForm = !this.showTrackingForm;
    if (!this.showTrackingForm) {
      this.trackingLocation = '';
      this.trackingNotes    = '';
      this.trackingStatus   = 'in_transit';
    }
  }

  constructor(
    private route: ActivatedRoute, public router: Router,
    private svc: ShipmentService, private auth: AuthService,
    private pdfSvc: PdfService,
    private dialog: MatDialog, private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role ?? null;
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.loadError = false;
    this.svc.getById(id).subscribe({
      next: (s) => { this.shipment = s; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  back(): void { this.router.navigate([`/dashboard/${this.role}/shipments`]); }

  downloadDispatchPdf(): void {
    if (!this.shipment) return;
    this.pdfLoading = true;
    this.pdfSvc.getDispatchPdf(this.shipment.id).subscribe({
      next: (res) => { this.pdfLoading = false; this.pdfSvc.openPdf(res); },
      error: (e) => { this.pdfLoading = false; this.snack.open(e?.error?.message ?? 'PDF não disponível.', 'Fechar', { duration: 3000 }); },
    });
  }

  private open(data: ConfirmDialogData) {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, { data });
  }

  submitTracking(): void {
    if (!this.trackingLocation.trim() || !this.trackingStatus) return;
    this.savingTracking = true;

    const payload: { location: string; status: ShipmentStatus; notes?: string } = {
      location: this.trackingLocation.trim(),
      status:   this.trackingStatus,
    };
    if (this.trackingNotes.trim()) payload.notes = this.trackingNotes.trim();

    this.svc.updateTracking(this.shipment!.id, payload).subscribe({
      next: (s) => {
        this.shipment        = s;
        this.savingTracking  = false;
        this.showTrackingForm = false;
        this.trackingLocation = '';
        this.trackingNotes    = '';
        this.trackingStatus   = 'in_transit';
        this.snack.open('Localização actualizada com sucesso.', 'Fechar', { duration: 3000 });
      },
      error: (e) => {
        this.savingTracking = false;
        this.snack.open(e?.error?.message ?? 'Erro ao actualizar tracking', 'Fechar', { duration: 3000 });
      },
    });
  }

  approve(): void {
    this.open({ title: 'Aprovar Embarque', message: 'Aprovar este embarque na fronteira:', inputLabel: 'Notas (opcional)', confirmText: 'Confirmar Aprovação' })
      .afterClosed().subscribe((result) => {
        if (result === undefined) return;
        const notes = typeof result === 'string' ? result : undefined;
        this.loading = true;
        this.svc.approve(this.shipment!.id, notes).subscribe({
          next: () => { this.reloadShipment(); this.snack.open('Embarque aprovado pela alfândega', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  reject(): void {
    this.open({ title: 'Rejeitar Embarque', message: 'Motivo da rejeição:', inputLabel: 'Motivo *', inputRequired: true, confirmText: 'Confirmar Rejeição' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.reject(this.shipment!.id, reason).subscribe({
          next: () => { this.reloadShipment(); this.snack.open('Embarque rejeitado', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  hold(): void {
    this.open({ title: 'Reter Embarque', message: 'Motivo da retenção:', inputLabel: 'Motivo *', inputRequired: true, confirmText: 'Confirmar Retenção' })
      .afterClosed().subscribe((reason: string) => {
        if (!reason) return;
        this.loading = true;
        this.svc.hold(this.shipment!.id, reason).subscribe({
          next: (s) => { this.shipment = s; this.loading = false; this.snack.open('Embarque retido', 'Fechar', { duration: 3000 }); },
          error: (e) => { this.loading = false; this.snack.open(e?.error?.message ?? 'Erro', 'Fechar', { duration: 3000 }); },
        });
      });
  }

  private reloadShipment(): void {
    this.svc.getById(this.shipment!.id).subscribe({
      next: (s) => { this.shipment = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
