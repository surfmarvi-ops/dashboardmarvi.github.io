import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Instructor } from '@/types/database';

export function useInstructors() {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: async (): Promise<Instructor[]> => {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as Instructor[];
    }
  });
}
