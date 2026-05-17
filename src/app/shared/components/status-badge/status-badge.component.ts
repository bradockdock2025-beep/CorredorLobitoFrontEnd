import { Component, Input } from '@angular/core';

type ChipStyle = 'solid' | 'outline' | 'gray';

interface BadgeConfig { label: string; style: ChipStyle; }

const CONFIG: Record<string, BadgeConfig> = {
  // licenseStatus
  pending:            { label: 'Pendente',             style: 'outline' },
  under_review:       { label: 'Em Revisão',           style: 'outline' },
  active:             { label: 'Activa',               style: 'solid'   },
  rejected:           { label: 'Rejeitada',            style: 'gray'    },
  suspended:          { label: 'Suspensa',             style: 'gray'    },
  // productStatus
  draft:              { label: 'Rascunho',             style: 'outline' },
  pending_review:     { label: 'Aguarda STAFF',        style: 'outline' },
  staff_validated:    { label: 'Validado STAFF',       style: 'outline' },
  published_official: { label: 'Publicado',            style: 'solid'   },
  // reportStatus
  published:          { label: 'Publicado',            style: 'solid'   },
  // priceProposalStatus
  submitted:          { label: 'Submetido',            style: 'outline' },
  approved:           { label: 'Aprovado',             style: 'solid'   },
  // orderStatus
  confirmed:          { label: 'Confirmado',           style: 'outline' },
  paid:               { label: 'Pago',                 style: 'solid'   },
  blocked:            { label: 'Bloqueado',            style: 'gray'    },
  cancelled:          { label: 'Cancelado',            style: 'gray'    },
  // transactionStatus
  completed:          { label: 'Concluída',            style: 'solid'   },
  refunded:           { label: 'Reembolsada',          style: 'gray'    },
  // shipmentStatus
  created:            { label: 'Criado',               style: 'outline' },
  in_transit:         { label: 'Em Trânsito',          style: 'outline' },
  at_border:          { label: 'Na Fronteira',         style: 'outline' },
  customs_approved:   { label: 'Aprovado Alfândega',   style: 'solid'   },
  customs_rejected:   { label: 'Rejeitado Alfândega',  style: 'gray'    },
  held:               { label: 'Retido',               style: 'gray'    },
  delivered:          { label: 'Entregue',             style: 'solid'   },
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="chip" [ngClass]="cssClass">{{ label }}</span>`,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .chip-solid   { background: var(--primary); color: #fff; border: none; }
    .chip-outline { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
    .chip-gray    { background: #e0e0e0; color: #424242; border: none; }
  `],
})
export class StatusBadgeComponent {
  label = '';
  cssClass = 'chip-outline';

  @Input() set status(value: string) {
    const cfg = CONFIG[value] ?? { label: value, style: 'outline' };
    this.label    = cfg.label;
    this.cssClass = `chip-${cfg.style}`;
  }
}
