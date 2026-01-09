import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp, X, Save, CalendarPlus } from 'lucide-react';
import { useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useStudentClasses, useDeleteSurfClass, useUpdateSurfClass } from '@/hooks/useSurfClasses';
import { SURF_MODALITIES, formatCurrency, getModalityInfo } from '@/lib/modalities';
import type { StudentWithClasses, SurfClassStatus } from '@/types/database';
import type { SurfModalityKey } from '@/lib/modalities';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleClassDialog } from '../agenda/ScheduleClassDialog';
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

interface StudentCardProps {
  student: StudentWithClasses;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export function StudentCard({ student, selected, onSelect }: StudentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [amountPaid, setAmountPaid] = useState(student.amount_paid.toString());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveModalityConfirm, setShowRemoveModalityConfirm] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const { data: classes } = useStudentClasses(student.id);
  const deleteSurfClass = useDeleteSurfClass();
  const updateSurfClass = useUpdateSurfClass();

  const handleModalityChange = (value: string) => {
    if (value === 'none') {
      setShowRemoveModalityConfirm(true);
    } else {
      updateStudent.mutate({
        id: student.id,
        surf_modality: value as SurfModalityKey
      });
    }
  };

  const confirmRemoveModality = () => {
    updateStudent.mutate({
      id: student.id,
      surf_modality: null
    });
    setShowRemoveModalityConfirm(false);
  };

  const handleAmountPaidChange = () => {
    const value = parseFloat(amountPaid);
    if (!isNaN(value) && value >= 0 && value !== student.amount_paid) {
      updateStudent.mutate({
        id: student.id,
        amount_paid: value
      });
    }
  };

  const handleDeleteStudent = () => {
    deleteStudent.mutate(student.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClass = (classId: string) => {
    deleteSurfClass.mutate(classId);
    setClassToDelete(null);
  };

  const handleStatusChange = (classId: string, status: SurfClassStatus) => {
    updateSurfClass.mutate({ id: classId, status });
  };

  const handleSaveNotes = (classId: string) => {
    updateSurfClass.mutate({ id: classId, notes: notesValue || null });
    setEditingNotes(null);
  };

  const getFinancialStatusBadge = () => {
    switch (student.financialStatus) {
      case 'Pago':
        return <Badge className="bg-primary/20 text-primary border-0">Pago</Badge>;
      case 'Parcial':
        return <Badge className="bg-secondary/20 text-secondary-foreground border-0">Parcial</Badge>;
      case 'Pendente':
        return <Badge className="bg-destructive/20 text-destructive border-0">Pendente</Badge>;
      default:
        return <Badge variant="outline">Sem modalidade</Badge>;
    }
  };

  const modalityInfo = getModalityInfo(student.surf_modality);

  return (
    <>
      <Card className={cn('bg-card transition-all', selected && 'ring-2 ring-primary')}>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {student.name}
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {getFinancialStatusBadge()}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(student.phone || student.email) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {student.phone} {student.phone && student.email && '•'} {student.email}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Modalidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Modalidade</label>
            <Select
              value={student.surf_modality || 'none'}
              onValueChange={handleModalityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem modalidade</SelectItem>
                {SURF_MODALITIES.map(m => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name} - {m.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informações do contrato */}
          {modalityInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total de aulas:</span>
                <span className="ml-2 font-medium text-foreground">{modalityInfo.totalClasses}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Aulas realizadas:</span>
                <span className="ml-2 font-medium text-foreground">{student.classesCompleted}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Aulas restantes:</span>
                <span className="ml-2 font-medium text-foreground">{student.classesRemaining}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor total:</span>
                <span className="ml-2 font-medium text-foreground">{formatCurrency(modalityInfo.totalValue)}</span>
              </div>
            </div>
          )}

          {/* Valor pago e restante */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Valor pago</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  onBlur={handleAmountPaidChange}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleAmountPaidChange}
                  disabled={updateStudent.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Valor restante</label>
              <div className="h-10 flex items-center px-3 bg-muted rounded-md text-foreground font-medium">
                {student.remainingValue !== null ? formatCurrency(student.remainingValue) : '-'}
              </div>
            </div>
          </div>

          {/* Botão agendar aula */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowScheduleDialog(true)}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar Aula
          </Button>

          {/* Histórico de aulas */}
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-sm font-medium">Histórico de Aulas ({classes?.length || 0})</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {expanded && classes && classes.length > 0 && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {classes.map(surfClass => (
                  <div key={surfClass.id} className="p-3 bg-accent rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          {format(new Date(surfClass.class_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {surfClass.start_time.slice(0, 5)} - {surfClass.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={surfClass.status}
                          onValueChange={(value) => handleStatusChange(surfClass.id, value as SurfClassStatus)}
                        >
                          <SelectTrigger className="h-8 w-28">
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setClassToDelete(surfClass.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Instrutor: {surfClass.instructor?.name}
                    </div>
                    {editingNotes === surfClass.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={notesValue}
                          onChange={e => setNotesValue(e.target.value)}
                          placeholder="Observações da aula..."
                          className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => handleSaveNotes(surfClass.id)}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground text-left w-full"
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

            {expanded && (!classes || classes.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma aula agendada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        studentId={student.id}
        studentName={student.name}
        studentModality={student.surf_modality}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {student.name}? Todas as aulas associadas também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteStudent}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRemoveModalityConfirm} onOpenChange={setShowRemoveModalityConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover modalidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a modalidade de {student.name}? O aluno permanecerá cadastrado mas sem contrato ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveModality}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!classToDelete} onOpenChange={() => setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? O horário será liberado e as estatísticas serão recalculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => classToDelete && handleDeleteClass(classToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
