import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, CalendarClock } from 'lucide-react';

interface DashboardStatsProps {
  totalStudents: number;
  completedClasses: number;
  scheduledClasses: number;
}

export function DashboardStats({ totalStudents, completedClasses, scheduledClasses }: DashboardStatsProps) {
  const stats = [
    {
      title: 'Alunos Ativos',
      value: totalStudents,
      icon: Users,
      description: 'Total de alunos cadastrados'
    },
    {
      title: 'Aulas Realizadas',
      value: completedClasses,
      icon: CheckCircle,
      description: 'Aulas já concluídas'
    },
    {
      title: 'Aulas Agendadas',
      value: scheduledClasses,
      icon: CalendarClock,
      description: 'Próximas aulas'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
