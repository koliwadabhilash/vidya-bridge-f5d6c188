-- Phase 1: Drop old tables and enums (in dependency order)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS student_enrollments CASCADE;
DROP TABLE IF EXISTS chapter_files CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Phase 2: Create new simplified user tables
CREATE TABLE admins (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  school_id uuid NOT NULL REFERENCES schools ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  roll_number text,
  school_id uuid NOT NULL REFERENCES schools ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES grades ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 3: Recreate dependent tables with simplified fields
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  grade_id uuid NOT NULL REFERENCES grades ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  chapter_number integer,
  created_by uuid REFERENCES teachers ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chapter_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  uploaded_by uuid NOT NULL REFERENCES teachers ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES grades ON DELETE CASCADE,
  school_id uuid REFERENCES schools ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters ON DELETE CASCADE,
  progress_percentage integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  teacher_feedback text
);

-- Phase 4: Update authentication trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_school_id uuid;
  user_grade_id uuid;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;
  user_grade_id := (NEW.raw_user_meta_data->>'grade_id')::uuid;

  IF user_role = 'admin' THEN
    INSERT INTO admins (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'));
  ELSIF user_role = 'teacher' THEN
    INSERT INTO teachers (id, email, full_name, school_id)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Teacher'), user_school_id);
  ELSE
    INSERT INTO students (id, email, full_name, school_id, grade_id, roll_number)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
      user_school_id,
      user_grade_id,
      NEW.raw_user_meta_data->>'roll_number'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Phase 5: Create performance indexes
CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_grade_id ON students(grade_id);
CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_subjects_grade_id ON subjects(grade_id);
CREATE INDEX idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments(student_id);