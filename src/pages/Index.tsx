import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { StudentsList } from '@/components/students/StudentsList';
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar';

const Index = () => {
  return (
    <AppLayout>
      {(activeTab) => (
        <>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <StudentsList />}
          {activeTab === 'agenda' && <AgendaCalendar />}
        </>
      )}
    </AppLayout>
  );
};

export default Index;
