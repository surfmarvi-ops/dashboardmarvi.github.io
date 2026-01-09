import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInstructors } from '@/hooks/useInstructors';
import { useStudents } from '@/hooks/useStudents';
import { useCreateSurfClass } from '@/hooks/useSurfClasses';
import type { SurfModalityKey } from '@/lib/modalities';
import { format } from 'date-fns';

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
  studentName?: string;
  studentModality?: SurfModalityKey | null;
  preselectedDate?: string;
}

export function ScheduleClassDialog({
  open,
  onOpenChange,
  studentId: initialStudentId,
  studentName,
  studentModality,
  preselectedDate
}: ScheduleClassDialogProps) {
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [classDate, setClassDate] = useState(preselectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [instructorId, setInstructorId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: instructors } = useInstructors();
  const { data: students } = useStudents();
  const createSurfClass = useCreateSurfClass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedStudentId = initialStudentId || studentId;
    if (!selectedStudentId || !classDate || !startTime || !endTime || !instructorId) return;

    const selectedStudent = students?.find(s => s.id === selectedStudentId);

    await createSurfClass.mutateAsync({
      student_id: selectedStudentId,
      class_date: classDate,
      start_time: startTime,
      end_time: endTime,
      instructor_id: instructorId,
      surf_modality: selectedStudent?.surf_modality || studentModality,
      notes: notes.trim() || undefined
    });

    setStudentId('');
    setClassDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('08:00');
    setEndTime('09:00');
    setInstructorId('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {studentName ? `Agendar Aula - ${studentName}` : 'Agendar Aula'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialStudentId && (
            <div className="space-y-2">
              <Label htmlFor="student">Aluno *</Label>
              <Select value={studentId} onValueChange={setStudentId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={classDate}
              onChange={e => setClassDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Início *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Término *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instrutor *</Label>
            <Select value={instructorId} onValueChange={setInstructorId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o instrutor" />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map(instructor => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações sobre a aula..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSurfClass.isPending || (!initialStudentId && !studentId) || !instructorId}
            >
              {createSurfClass.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
