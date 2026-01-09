import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SurfClass, SurfClassWithRelations, SurfClassStatus } from '@/types/database';
import type { SurfModalityKey } from '@/lib/modalities';
import { toast } from 'sonner';

export function useSurfClasses() {
  return useQuery({
    queryKey: ['surf-classes'],
    queryFn: async (): Promise<SurfClassWithRelations[]> => {
      const { data, error } = await supabase
        .from('surf_classes')
        .select(`
          *,
          student:students(*),
          instructor:instructors(*)
        `)
        .order('class_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SurfClassWithRelations[];
    }
  });
}

export function useStudentClasses(studentId: string) {
  return useQuery({
    queryKey: ['surf-classes', 'student', studentId],
    queryFn: async (): Promise<SurfClassWithRelations[]> => {
      const { data, error } = await supabase
        .from('surf_classes')
        .select(`
          *,
          instructor:instructors(*)
        `)
        .eq('student_id', studentId)
        .order('class_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SurfClassWithRelations[];
    },
    enabled: !!studentId
  });
}

export function useCreateSurfClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      student_id: string;
      class_date: string;
      start_time: string;
      end_time: string;
      instructor_id: string;
      surf_modality?: SurfModalityKey | null;
      notes?: string;
    }) => {
      const { data: surfClass, error } = await supabase
        .from('surf_classes')
        .insert({
          student_id: data.student_id,
          class_date: data.class_date,
          start_time: data.start_time,
          end_time: data.end_time,
          instructor_id: data.instructor_id,
          surf_modality: data.surf_modality || null,
          notes: data.notes || null,
          status: 'Agendada'
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Conflito de horário: O instrutor já tem uma aula neste horário.');
        }
        throw error;
      }
      return surfClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-classes'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aula agendada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateSurfClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      class_date?: string;
      start_time?: string;
      end_time?: string;
      instructor_id?: string;
      status?: SurfClassStatus;
      notes?: string | null;
    }) => {
      const { data: surfClass, error } = await supabase
        .from('surf_classes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Conflito de horário: O instrutor já tem uma aula neste horário.');
        }
        throw error;
      }
      return surfClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-classes'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aula atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
}

export function useDeleteSurfClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('surf_classes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-classes'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aula excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir aula: ' + error.message);
    }
  });
}
