export type SurfModalityKey = 
  | 'Aula avulsa de surf'
  | 'Pacote básico de surf'
  | 'Pacote intermediário de surf'
  | 'Assinatura mensal de surf';

export interface ModalityInfo {
  name: SurfModalityKey;
  totalClasses: number;
  totalValue: number;
  pricePerClass: number;
  description: string;
}

export const SURF_MODALITIES: ModalityInfo[] = [
  {
    name: 'Aula avulsa de surf',
    totalClasses: 1,
    totalValue: 120,
    pricePerClass: 120,
    description: '1 aula | R$120 | R$120 por aula'
  },
  {
    name: 'Pacote básico de surf',
    totalClasses: 4,
    totalValue: 420,
    pricePerClass: 105,
    description: '4 aulas | R$420 | R$105 por aula'
  },
  {
    name: 'Pacote intermediário de surf',
    totalClasses: 10,
    totalValue: 950,
    pricePerClass: 95,
    description: '10 aulas | R$950 | R$95 por aula'
  },
  {
    name: 'Assinatura mensal de surf',
    totalClasses: 16,
    totalValue: 1200,
    pricePerClass: 75,
    description: '16 aulas (4 por semana) | R$1.200 | R$75 por aula'
  }
];

export function getModalityInfo(modalityName: SurfModalityKey | null): ModalityInfo | null {
  if (!modalityName) return null;
  return SURF_MODALITIES.find(m => m.name === modalityName) || null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
