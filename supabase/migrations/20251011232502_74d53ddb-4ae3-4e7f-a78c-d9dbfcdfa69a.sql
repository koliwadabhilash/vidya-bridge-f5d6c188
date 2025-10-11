-- Simplify schools table (remove unnecessary fields for MVP)
ALTER TABLE public.schools 
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone;

-- Add school_id to grades table
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Add teacher_id to subjects table
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add roll_number to profiles for students
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roll_number text,
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- Make chapter fields optional for MVP
ALTER TABLE public.chapters
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN chapter_number DROP NOT NULL,
ALTER COLUMN created_by DROP NOT NULL;

-- Rename chapters.name to title for consistency
ALTER TABLE public.chapters
RENAME COLUMN name TO title;

-- Update RLS policies for new relationships
DROP POLICY IF EXISTS "Admins can manage grades" ON public.grades;
CREATE POLICY "Admins can manage grades" 
ON public.grades 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Teachers and admins can manage subjects" ON public.subjects;
CREATE POLICY "Teachers and admins can manage subjects" 
ON public.subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Add index for better performance on new foreign keys
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON public.grades(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);