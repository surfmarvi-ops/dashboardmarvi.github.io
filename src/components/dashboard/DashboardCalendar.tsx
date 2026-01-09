import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SurfClassWithRelations } from '@/types/database';
import { cn } from '@/lib/utils';

interface DashboardCalendarProps {
  classes: SurfClassWithRelations[];
}

export function DashboardCalendar({ classes }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days for the first week
    const startDay = getDay(start);
    const paddingDays = Array(startDay).fill(null);
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const classesByDate = useMemo(() => {
    const map = new Map<string, SurfClassWithRelations[]>();
    classes.forEach(surfClass => {
      if (surfClass.status !== 'Cancelada') {
        const dateKey = surfClass.class_date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(surfClass);
      }
    });
    return map;
  }, [classes]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Calendário de Aulas
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-12" />;
            }
            
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayClasses = classesByDate.get(dateKey) || [];
            const hasClasses = dayClasses.length > 0;
            const hasScheduled = dayClasses.some(c => c.status === 'Agendada');
            const hasCompleted = dayClasses.some(c => c.status === 'Realizada');
            
            return (
              <div
                key={dateKey}
                className={cn(
                  'relative h-12 flex flex-col items-center justify-center rounded-md text-sm transition-colors',
                  !isSameMonth(day, currentMonth) && 'text-muted-foreground/50',
                  isToday(day) && 'ring-2 ring-primary',
                  hasClasses && 'bg-accent'
                )}
              >
                <span className={cn(
                  'font-medium',
                  isToday(day) && 'text-primary'
                )}>
                  {format(day, 'd')}
                </span>
                {hasClasses && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasScheduled && (
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" title="Aulas agendadas" />
                    )}
                    {hasCompleted && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Aulas realizadas" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <span>Agendada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Realizada</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
