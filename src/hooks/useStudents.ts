import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Student, StudentWithClasses, SurfClass } from '@/types/database';
import type { SurfModalityKey } from '@/lib/modalities';
import { getModalityInfo } from '@/lib/modalities';
import { toast } from 'sonner';

function calculateStudentData(student: Student, classes: SurfClass[]): StudentWithClasses {
  const completedClasses = classes.filter(c => c.status === 'Realizada').length;
  
  const hasModality = student.surf_modality && student.total_classes_contracted;
  const classesRemaining = hasModality 
    ? Math.max(0, (student.total_classes_contracted || 0) - completedClasses)
    : null;
  
  const remainingValue = student.contract_total_value !== null 
    ? Math.max(0, student.contract_total_value - student.amount_paid)
    : null;
  
  let financialStatus: StudentWithClasses['financialStatus'] = 'Sem modalidade';
  if (student.contract_total_value !== null) {
    if (student.amount_paid >= student.contract_total_value) {
      financialStatus = 'Pago';
    } else if (student.amount_paid > 0) {
      financialStatus = 'Parcial';
    } else {
      financialStatus = 'Pendente';
    }
  }
  
  return {
    ...student,
    classes,
    classesCompleted: completedClasses,
    classesRemaining,
    remainingValue,
    financialStatus
  };
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<StudentWithClasses[]> => {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (studentsError) throw studentsError;
      
      const { data: classes, error: classesError } = await supabase
        .from('surf_classes')
        .select('*');
      
      if (classesError) throw classesError;
      
      return (students || []).map(student => {
        const studentClasses = (classes || []).filter(c => c.student_id === student.id);
        return calculateStudentData(student as Student, studentClasses as SurfClass[]);
      });
    }
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async (): Promise<StudentWithClasses | null> => {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (studentError) throw studentError;
      if (!student) return null;
      
      const { data: classes, error: classesError } = await supabase
        .from('surf_classes')
        .select('*')
        .eq('student_id', id)
        .order('class_date', { ascending: false });
      
      if (classesError) throw classesError;
      
      return calculateStudentData(student as Student, (classes || []) as SurfClass[]);
    },
    enabled: !!id
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string }) => {
      const { data: student, error } = await supabase
        .from('students')
        .insert({
          name: data.name,
          phone: data.phone || null,
          email: data.email || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar aluno: ' + error.message);
    }
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      name?: string; 
      phone?: string | null; 
      email?: string | null;
      surf_modality?: SurfModalityKey | null;
      amount_paid?: number;
    }) => {
      const updateData: Record<string, unknown> = { ...data };
      
      // Se estiver atualizando a modalidade, calcular valores automaticamente
      if ('surf_modality' in data) {
        if (data.surf_modality) {
          const modalityInfo = getModalityInfo(data.surf_modality);
          if (modalityInfo) {
            updateData.total_classes_contracted = modalityInfo.totalClasses;
            updateData.contract_total_value = modalityInfo.totalValue;
          }
        } else {
          // Removendo modalidade
          updateData.surf_modality = null;
          updateData.total_classes_contracted = null;
          updateData.contract_total_value = null;
        }
      }
      
      const { data: student, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return student;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      toast.success('Aluno atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar aluno: ' + error.message);
    }
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['surf-classes'] });
      toast.success('Aluno excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir aluno: ' + error.message);
    }
  });
}

export function useDeleteStudents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['surf-classes'] });
      toast.success('Alunos excluídos com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir alunos: ' + error.message);
    }
  });
}
