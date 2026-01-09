import type { SurfModalityKey } from '@/lib/modalities';

export type SurfClassStatus = 'Agendada' | 'Realizada' | 'Cancelada';

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  surf_modality: SurfModalityKey | null;
  total_classes_contracted: number | null;
  contract_total_value: number | null;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  created_at: string;
}

export interface SurfClass {
  id: string;
  student_id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  surf_modality: SurfModalityKey | null;
  instructor_id: string;
  status: SurfClassStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurfClassWithRelations extends SurfClass {
  student?: Student;
  instructor?: Instructor;
}

export interface StudentWithClasses extends Student {
  classes: SurfClass[];
  classesCompleted: number;
  classesRemaining: number | null;
  remainingValue: number | null;
  financialStatus: 'Pago' | 'Pendente' | 'Parcial' | 'Sem modalidade';
}
