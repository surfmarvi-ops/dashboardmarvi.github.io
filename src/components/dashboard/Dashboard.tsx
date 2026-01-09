import { useMemo } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useSurfClasses } from '@/hooks/useSurfClasses';
import { DashboardStats } from './DashboardStats';
import { DashboardCalendar } from './DashboardCalendar';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: classes, isLoading: loadingClasses } = useSurfClasses();

  const stats = useMemo(() => {
    if (!students || !classes) {
      return { totalStudents: 0, completedClasses: 0, scheduledClasses: 0 };
    }

    return {
      totalStudents: students.length,
      completedClasses: classes.filter(c => c.status === 'Realizada').length,
      scheduledClasses: classes.filter(c => c.status === 'Agendada').length
    };
  }, [students, classes]);

  if (loadingStudents || loadingClasses) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardStats {...stats} />
      <DashboardCalendar classes={classes || []} />
    </div>
  );
}
