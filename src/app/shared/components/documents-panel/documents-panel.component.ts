import {
  Component, Input, OnInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentService, UploadProgress } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Document, DocumentEntityType, DocumentType, DocumentStatus, Role,
} from '../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

// ── Rótulos por entityType ──────────────────────────────────────────
const DOC_TYPES: Record<DocumentEntityType, { value: DocumentType; label: string; required?: boolean }[]> = {
  company: [
    { value: 'certidao_comercial',           label: 'Certidão de Registo Comercial',      required: true },
    { value: 'certidao_fiscal',              label: 'Certidão Fiscal / NIF',               required: true },
    { value: 'alvara_actividade',            label: 'Alvará de Actividade Comercial',       required: true },
    { value: 'identificacao_representante',  label: 'ID do Representante Legal (BI/Passaporte)', required: true },
    { value: 'comprovativo_morada',          label: 'Comprovativo de Morada da Sede',       required: true },
    { value: 'estatutos',                    label: 'Estatutos da Empresa' },
    { value: 'licenca_importacao_exportacao',label: 'Licença Esp. de Importação/Exportação' },
    { value: 'outro',                        label: 'Outro documento' },
  ],
  product: [
    { value: 'ficha_tecnica_produto',        label: 'Ficha Técnica do Produto',            required: true },
    { value: 'certificado_qualidade',        label: 'Certificado de Qualidade / ISO' },
    { value: 'certificado_origem_produto',   label: 'Certificado de Origem do Produto' },
    { value: 'outro',                        label: 'Outro documento' },
  ],
  shipment: [
    { value: 'fatura_comercial_embarque',    label: 'Fatura Comercial do Exportador',      required: true },
    { value: 'manifesto_carga',              label: 'Manifesto de Carga',                  required: true },
    { value: 'certificado_origem_embarque',  label: 'Certificado de Origem das Mercadorias', required: true },
    { value: 'guia_transporte',              label: 'Guia de Transporte / CMR / Bill of Lading', required: true },
    { value: 'apolice_seguro',               label: 'Apólice de Seguro de Carga' },
    { value: 'declaracao_aduaneira',         label: 'Declaração Aduaneira de Exportação' },
    { value: 'outro',                        label: 'Outro documento' },
  ],
  order:  [{ value: 'outro', label: 'Outro documento' }],
  report: [{ value: 'outro', label: 'Outro documento' }],
};

const STAFF_ROLES: Role[] = ['staff', 'state'];

@Component({
  selector: 'app-documents-panel',
  template: `
    <div class="docs-panel">

      <!-- Cabeçalho ─────────────────────────────────────────────── -->
      <div class="docs-header">
        <div class="docs-title-row">
          <mat-icon class="docs-title-icon">folder_open</mat-icon>
          <h3 class="docs-title">Documentos</h3>
          <span class="docs-count">{{ documents.length }}</span>
        </div>
        <button mat-stroked-button (click)="showUpload = !showUpload"
                *ngIf="canUpload()">
          <mat-icon>upload_file</mat-icon>
          {{ showUpload ? 'Cancelar' : 'Adicionar documento' }}
        </button>
      </div>

      <!-- Formulário de upload ───────────────────────────────────── -->
      <div class="upload-form-block" *ngIf="showUpload && canUpload()">
        <form [formGroup]="uploadForm" (ngSubmit)="onUpload()" class="upload-form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de documento *</mat-label>
            <mat-select formControlName="type">
              <mat-option *ngFor="let t of docTypes" [value]="t.value">
                {{ t.label }} <span *ngIf="t.required" class="req-mark"> *</span>
              </mat-option>
            </mat-select>
            <mat-error>Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome do documento *</mat-label>
            <input matInput formControlName="name" placeholder="ex: Certidão Comercial 2026">
            <mat-error>Obrigatório</mat-error>
          </mat-form-field>

          <!-- Selecionador de ficheiro -->
          <div class="file-picker" [class.has-file]="selectedFile"
               (click)="fileInput.click()" (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)">
            <mat-icon>{{ selectedFile ? 'insert_drive_file' : 'cloud_upload' }}</mat-icon>
            <span *ngIf="!selectedFile">Clique ou arraste o ficheiro (PDF, JPG, PNG · máx. 10 MB)</span>
            <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})</span>
            <input #fileInput type="file" accept=".pdf,.jpg,.jpeg,.png"
                   style="display:none" (change)="onFileChange($event)">
          </div>
          <div class="file-error" *ngIf="fileError">
            <mat-icon>error_outline</mat-icon> {{ fileError }}
          </div>

          <!-- Progresso ───── -->
          <div class="upload-progress" *ngIf="uploadPercent !== null">
            <mat-progress-bar mode="determinate" [value]="uploadPercent"></mat-progress-bar>
            <span>{{ uploadPercent }}%</span>
          </div>

          <div class="upload-actions">
            <button mat-button type="button" (click)="cancelUpload()">Cancelar</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="uploadForm.invalid || !selectedFile || uploading">
              <mat-spinner diameter="16" *ngIf="uploading"></mat-spinner>
              <mat-icon *ngIf="!uploading">upload</mat-icon>
              <span>Enviar ficheiro</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Loading ────────────────────────────────────────────────── -->
      <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

      <!-- Lista vazia ─────────────────────────────────────────────── -->
      <div class="docs-empty" *ngIf="!loading && documents.length === 0">
        <mat-icon>description</mat-icon>
        <span>Sem documentos submetidos.</span>
      </div>

      <!-- Lista de documentos ─────────────────────────────────────── -->
      <div class="doc-list" *ngIf="!loading && documents.length > 0">
        <div class="doc-item" *ngFor="let doc of documents">

          <div class="doc-info">
            <div class="doc-top">
              <mat-icon class="doc-icon" [ngClass]="'mime-' + mimeClass(doc.mimeType)">
                {{ mimeIcon(doc.mimeType) }}
              </mat-icon>
              <div class="doc-meta">
                <span class="doc-name">{{ doc.name }}</span>
                <span class="doc-sub">{{ doc.cd }} · {{ docTypeLabel(doc.type) }} · {{ formatSize(doc.sizeBytes) }}</span>
              </div>
            </div>
            <div class="doc-rejected" *ngIf="doc.status === 'rejected' && doc.rejectedReason">
              <mat-icon>error_outline</mat-icon> {{ doc.rejectedReason }}
            </div>
          </div>

          <div class="doc-actions">
            <span class="doc-badge" [class]="'badge-' + doc.status">{{ statusLabel(doc.status) }}</span>

            <button mat-icon-button (click)="download(doc)" matTooltip="Descarregar">
              <mat-icon>download</mat-icon>
            </button>

            <!-- Dono: apagar (apenas pending) -->
            <button mat-icon-button color="warn"
                    *ngIf="canDelete(doc)"
                    (click)="deleteDoc(doc)"
                    matTooltip="Apagar">
              <mat-icon>delete_outline</mat-icon>
            </button>

            <!-- STAFF/STATE: aceitar -->
            <button mat-icon-button style="color:#2e7d32"
                    *ngIf="canValidate() && doc.status === 'pending'"
                    (click)="accept(doc)"
                    matTooltip="Aceitar documento">
              <mat-icon>check_circle_outline</mat-icon>
            </button>

            <!-- STAFF/STATE: rejeitar -->
            <button mat-icon-button color="warn"
                    *ngIf="canValidate() && doc.status === 'pending'"
                    (click)="rejectDoc(doc)"
                    matTooltip="Rejeitar">
              <mat-icon>cancel</mat-icon>
            </button>
          </div>

        </div>
      </div>

      <!-- Checklist obrigatórios (company) ────────────────────────── -->
      <div class="required-checklist" *ngIf="entityType === 'company' && requiredTypes.length > 0">
        <p class="checklist-title">Documentos obrigatórios para licenciamento</p>
        <div class="checklist-item" *ngFor="let t of requiredTypes">
          <mat-icon [class.done]="isAccepted(t.value)" [class.pending-icon]="isPending(t.value)"
                    [class.missing-icon]="isMissing(t.value)">
            {{ isAccepted(t.value) ? 'check_circle' : (isPending(t.value) ? 'hourglass_empty' : 'radio_button_unchecked') }}
          </mat-icon>
          <span>{{ t.label }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .docs-panel {
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }

    .docs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .docs-title-row { display: flex; align-items: center; gap: 8px; }

    .docs-title-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary); }
    .docs-title { font-size: 15px; font-weight: 700; color: var(--primary); margin: 0; }

    .docs-count {
      background: var(--primary);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
    }

    /* Upload form */
    .upload-form-block {
      padding: 16px;
      background: #f5f9ff;
      border-bottom: 1px solid #e0e0e0;
    }

    .upload-form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }

    .file-picker {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #999;
      font-size: 13px;
      transition: border-color 0.2s, background 0.2s;
    }
    .file-picker:hover  { border-color: var(--primary); background: #f0f4ff; color: var(--primary); }
    .file-picker.has-file { border-color: #2e7d32; background: #f1f8e9; color: #2e7d32; }
    .file-picker mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .file-name { font-weight: 600; }

    .file-error {
      display: flex; align-items: center; gap: 6px;
      color: #c5221f; font-size: 13px;
      background: #fce8e6; padding: 6px 10px; border-radius: 6px;
    }
    .file-error mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .upload-progress { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #555; }
    .upload-progress mat-progress-bar { flex: 1; }

    .upload-actions { display: flex; justify-content: flex-end; gap: 8px; }

    .req-mark { color: #e53935; font-size: 11px; }

    /* Lista */
    .docs-empty {
      display: flex; align-items: center; gap: 8px;
      padding: 20px 16px; color: #bbb; font-size: 13px;
    }
    .docs-empty mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .doc-list { display: flex; flex-direction: column; }

    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f5f5f5;
      gap: 12px;
    }
    .doc-item:last-child { border-bottom: none; }

    .doc-info { flex: 1; min-width: 0; }
    .doc-top  { display: flex; align-items: center; gap: 10px; }

    .doc-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; color: #888; }
    .mime-pdf { color: #e53935 !important; }
    .mime-img { color: #1e88e5 !important; }

    .doc-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .doc-name  { font-size: 14px; font-weight: 600; color: #1a2e42; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-sub   { font-size: 11px; color: #999; }

    .doc-rejected {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #c5221f;
      margin-top: 4px;
    }
    .doc-rejected mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .doc-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

    .doc-badge {
      font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .badge-pending  { background: #fff8e1; color: #f57f17; }
    .badge-accepted { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #fce8e6; color: #c5221f; }

    /* Checklist */
    .required-checklist {
      padding: 12px 16px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }

    .checklist-title {
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
      color: #888; margin: 0 0 8px;
    }

    .checklist-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #555; padding: 3px 0;
    }

    .checklist-item mat-icon {
      font-size: 16px; width: 16px; height: 16px;
    }
    .checklist-item mat-icon.done        { color: #2e7d32; }
    .checklist-item mat-icon.pending-icon { color: #f57f17; }
    .checklist-item mat-icon.missing-icon { color: #bbb; }
  `],
})
export class DocumentsPanelComponent implements OnInit, OnChanges {
  @Input() entityType!: DocumentEntityType;
  @Input() entityId!:   string;
  @Input() documents:   Document[] = [];
  @Input() autoLoad     = false;

  showUpload   = false;
  loading      = false;
  uploading    = false;
  uploadPercent: number | null = null;
  fileError    = '';
  selectedFile: File | null = null;
  uploadForm!: FormGroup;

  docTypes: { value: DocumentType; label: string; required?: boolean }[] = [];
  requiredTypes: { value: DocumentType; label: string }[] = [];

  private userRole: Role | null = null;
  private userId   = '';

  constructor(
    private fb: FormBuilder,
    private docSvc: DocumentService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRole = user?.role ?? null;
    this.userId   = user?.id ?? '';
    this.docTypes  = DOC_TYPES[this.entityType] ?? [];
    this.requiredTypes = this.docTypes.filter((t) => t.required);

    this.uploadForm = this.fb.group({
      type: [this.docTypes[0]?.value ?? 'outro', Validators.required],
      name: ['', Validators.required],
    });

    if (this.autoLoad) this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] && !changes['entityId'].firstChange && this.autoLoad) {
      this.load();
    }
  }

  load(): void {
    if (!this.entityId) return;
    this.loading = true;
    this.docSvc.getByEntity(this.entityType, this.entityId).subscribe({
      next: (docs) => { this.documents = docs; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Upload ──────────────────────────────────────────────────────
  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.validateAndSetFile(input.files[0]);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) this.validateAndSetFile(file);
  }

  private validateAndSetFile(file: File): void {
    this.fileError = '';
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED  = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > MAX_SIZE) {
      this.fileError = 'Ficheiro demasiado grande. Máximo: 10 MB.';
      this.selectedFile = null;
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      this.fileError = 'Formato inválido. Use PDF, JPG ou PNG.';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  onUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile || !this.entityId) return;
    this.uploading    = true;
    this.uploadPercent = 0;

    const { type, name } = this.uploadForm.value;

    this.docSvc.upload(this.selectedFile, this.entityType, this.entityId, type, name)
      .subscribe({
        next: (event: UploadProgress) => {
          if (event.type === 'progress') {
            this.uploadPercent = event.percent ?? 0;
          } else if (event.type === 'done' && event.document) {
            this.documents = [...this.documents, event.document];
            this.uploading     = false;
            this.uploadPercent = null;
            this.showUpload    = false;
            this.selectedFile  = null;
            this.uploadForm.reset({ type: this.docTypes[0]?.value ?? 'outro', name: '' });
            this.snack.open('Documento enviado com sucesso.', 'Fechar', { duration: 3000 });
          }
        },
        error: (e) => {
          this.uploading    = false;
          this.uploadPercent = null;
          this.snack.open(e?.error?.message ?? 'Erro ao enviar ficheiro.', 'Fechar', { duration: 4000 });
        },
      });
  }

  cancelUpload(): void {
    this.showUpload   = false;
    this.selectedFile = null;
    this.fileError    = '';
    this.uploadPercent = null;
  }

  // ── Download ────────────────────────────────────────────────────
  download(doc: Document): void {
    this.docSvc.download(doc.id).subscribe({
      next: (res) => window.open(res.signedUrl, '_blank'),
      error: () => this.snack.open('Erro ao gerar link de download.', 'Fechar', { duration: 3000 }),
    });
  }

  // ── Delete ──────────────────────────────────────────────────────
  deleteDoc(doc: Document): void {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: { title: 'Apagar Documento', message: `Apagar "${doc.name}"?`, confirmText: 'Apagar' },
    }).afterClosed().subscribe((r) => {
      if (!r) return;
      this.docSvc.delete(doc.id).subscribe({
        next: () => {
          this.documents = this.documents.filter((d) => d.id !== doc.id);
          this.snack.open('Documento apagado.', 'Fechar', { duration: 3000 });
        },
        error: (e) => this.snack.open(e?.error?.message ?? 'Erro ao apagar.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  // ── Accept / Reject ─────────────────────────────────────────────
  accept(doc: Document): void {
    this.docSvc.accept(doc.id).subscribe({
      next: (updated) => this.updateDoc(updated),
      error: (e) => this.snack.open(e?.error?.message ?? 'Erro.', 'Fechar', { duration: 3000 }),
    });
  }

  rejectDoc(doc: Document): void {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        title: 'Rejeitar Documento',
        message: `Motivo da rejeição de "${doc.name}":`,
        inputLabel: 'Motivo *',
        inputRequired: true,
        confirmText: 'Rejeitar',
      },
    }).afterClosed().subscribe((reason: string) => {
      if (!reason) return;
      this.docSvc.reject(doc.id, reason).subscribe({
        next: (updated) => {
          this.updateDoc(updated);
          this.snack.open('Documento rejeitado.', 'Fechar', { duration: 3000 });
        },
        error: (e) => this.snack.open(e?.error?.message ?? 'Erro.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  private updateDoc(updated: Document): void {
    this.documents = this.documents.map((d) => d.id === updated.id ? { ...d, ...updated } : d);
  }

  // ── Helpers ─────────────────────────────────────────────────────
  canUpload(): boolean {
    if (!this.entityId) return false;
    if (STAFF_ROLES.includes(this.userRole as Role)) return true;
    return ['producer', 'buyer', 'operator'].includes(this.userRole ?? '');
  }

  canValidate(): boolean {
    return STAFF_ROLES.includes(this.userRole as Role);
  }

  canDelete(doc: Document): boolean {
    return doc.status === 'pending' && doc.uploadedById === this.userId;
  }

  isAccepted(type: DocumentType): boolean {
    return this.documents.some((d) => d.type === type && d.status === 'accepted');
  }

  isPending(type: DocumentType): boolean {
    return !this.isAccepted(type) && this.documents.some((d) => d.type === type && d.status === 'pending');
  }

  isMissing(type: DocumentType): boolean {
    return !this.isAccepted(type) && !this.isPending(type);
  }

  mimeIcon(mime: string): string {
    if (mime === 'application/pdf') return 'picture_as_pdf';
    if (mime.startsWith('image/'))  return 'image';
    return 'insert_drive_file';
  }

  mimeClass(mime: string): string {
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('image/'))  return 'img';
    return '';
  }

  docTypeLabel(type: string): string {
    const all = Object.values(DOC_TYPES).flat();
    return all.find((t) => t.value === type)?.label ?? type;
  }

  statusLabel(s: DocumentStatus): string {
    const m: Record<DocumentStatus, string> = {
      pending: 'Pendente', accepted: 'Aceite', rejected: 'Rejeitado',
    };
    return m[s] ?? s;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
