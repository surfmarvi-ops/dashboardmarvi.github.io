import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, X, Save } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSurfClasses, useDeleteSurfClass, useUpdateSurfClass } from '@/hooks/useSurfClasses';
import { useStudents } from '@/hooks/useStudents';
import { ScheduleClassDialog } from './ScheduleClassDialog';
import type { SurfClassWithRelations, SurfClassStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AgendaCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState<SurfClassWithRelations | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const { data: classes, isLoading } = useSurfClasses();
  const { data: students } = useStudents();
  const deleteSurfClass = useDeleteSurfClass();
  const updateSurfClass = useUpdateSurfClass();

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const paddingDays = Array(startDay).fill(null);
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const classesByDate = useMemo(() => {
    const map = new Map<string, SurfClassWithRelations[]>();
    classes?.forEach(surfClass => {
      const dateKey = surfClass.class_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(surfClass);
    });
    return map;
  }, [classes]);

  const selectedDayClasses = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return classesByDate.get(dateKey) || [];
  }, [selectedDate, classesByDate]);

  const handleDeleteClass = () => {
    if (classToDelete) {
      deleteSurfClass.mutate(classToDelete.id);
      setClassToDelete(null);
    }
  };

  const handleStatusChange = (classId: string, status: SurfClassStatus) => {
    updateSurfClass.mutate({ id: classId, status });
  };

  const handleSaveNotes = (classId: string) => {
    updateSurfClass.mutate({ id: classId, notes: notesValue || null });
    setEditingNotes(null);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStatusColor = (status: SurfClassStatus) => {
    switch (status) {
      case 'Agendada':
        return 'bg-secondary text-secondary-foreground';
      case 'Realizada':
        return 'bg-primary text-primary-foreground';
      case 'Cancelada':
        return 'bg-muted text-muted-foreground line-through';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Calendário
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
                return <div key={`empty-${index}`} className="h-16" />;
              }

              const dateKey = format(day, 'yyyy-MM-dd');
              const dayClasses = classesByDate.get(dateKey) || [];
              const activeClasses = dayClasses.filter(c => c.status !== 'Cancelada');
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative h-16 flex flex-col items-center justify-start pt-1 rounded-md text-sm transition-colors hover:bg-accent',
                    !isSameMonth(day, currentMonth) && 'text-muted-foreground/50',
                    isToday(day) && 'ring-2 ring-primary',
                    isSelected && 'bg-accent ring-2 ring-secondary'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    isToday(day) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {activeClasses.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center max-w-full px-1">
                      {activeClasses.slice(0, 3).map(c => (
                        <div
                          key={c.id}
                          className={cn(
                            'w-2 h-2 rounded-full',
                            c.status === 'Realizada' ? 'bg-primary' : 'bg-secondary'
                          )}
                        />
                      ))}
                      {activeClasses.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{activeClasses.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : 'Selecione uma data'}
          </CardTitle>
          {selectedDate && students && students.length > 0 && (
            <Button size="sm" onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-muted-foreground text-center py-8">
              Clique em uma data no calendário para ver as aulas
            </p>
          ) : selectedDayClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhuma aula agendada</p>
              {students && students.length > 0 && (
                <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar aula
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedDayClasses
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(surfClass => (
                  <div
                    key={surfClass.id}
                    className={cn(
                      'p-3 rounded-md space-y-2',
                      getStatusColor(surfClass.status)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{surfClass.student?.name}</p>
                        <p className="text-sm opacity-80">
                          {surfClass.start_time.slice(0, 5)} - {surfClass.end_time.slice(0, 5)} • {surfClass.instructor?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={surfClass.status}
                          onValueChange={(value) => handleStatusChange(surfClass.id, value as SurfClassStatus)}
                        >
                          <SelectTrigger className="h-8 w-28 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Agendada">Agendada</SelectItem>
                            <SelectItem value="Realizada">Realizada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/20"
                          onClick={() => setClassToDelete(surfClass)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {editingNotes === surfClass.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={notesValue}
                          onChange={e => setNotesValue(e.target.value)}
                          placeholder="Observações..."
                          className="h-8 text-sm bg-background/50"
                        />
                        <Button size="sm" variant="secondary" onClick={() => handleSaveNotes(surfClass.id)}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-sm opacity-70 hover:opacity-100 text-left w-full"
                        onClick={() => {
                          setEditingNotes(surfClass.id);
                          setNotesValue(surfClass.notes || '');
                        }}
                      >
                        {surfClass.notes || 'Clique para adicionar observação...'}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        preselectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      <AlertDialog open={!!classToDelete} onOpenChange={() => setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a aula de {classToDelete?.student?.name}? O horário será liberado e as estatísticas serão recalculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteClass}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
