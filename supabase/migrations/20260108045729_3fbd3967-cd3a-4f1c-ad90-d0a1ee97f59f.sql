-- Criar enum para status das aulas
CREATE TYPE surf_class_status AS ENUM ('Agendada', 'Realizada', 'Cancelada');

-- Criar enum para modalidades de surf
CREATE TYPE surf_modality AS ENUM (
  'Aula avulsa de surf',
  'Pacote básico de surf',
  'Pacote intermediário de surf',
  'Assinatura mensal de surf'
);

-- Tabela de instrutores
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir os dois instrutores fixos
INSERT INTO instructors (name) VALUES ('Maicon'), ('Vitor');

-- Tabela de alunos
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  surf_modality surf_modality,
  total_classes_contracted INTEGER,
  contract_total_value NUMERIC(10,2),
  amount_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aulas de surf
CREATE TABLE surf_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  surf_modality surf_modality,
  instructor_id UUID NOT NULL REFERENCES instructors(id),
  status surf_class_status DEFAULT 'Agendada',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint para impedir conflito de horário do instrutor (exceto aulas canceladas)
CREATE UNIQUE INDEX idx_instructor_schedule ON surf_classes (instructor_id, class_date, start_time)
WHERE status != 'Cancelada';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surf_classes_updated_at
  BEFORE UPDATE ON surf_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE surf_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas (sistema interno sem autenticação)
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on surf_classes" ON surf_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read on instructors" ON instructors FOR SELECT USING (true);