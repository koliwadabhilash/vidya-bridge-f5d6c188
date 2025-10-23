-- Drop tables that are no longer needed
DROP TABLE IF EXISTS public.chapter_files CASCADE;
DROP TABLE IF EXISTS public.student_enrollments CASCADE;
DROP TABLE IF EXISTS public.student_progress CASCADE;

-- Modify chapters table
ALTER TABLE public.chapters 
DROP COLUMN IF EXISTS created_by,
ADD COLUMN IF NOT EXISTS total_slides integer NOT NULL DEFAULT 0;

-- Create teacher_grade_assignments table
CREATE TABLE IF NOT EXISTS public.teacher_grade_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, grade_id)
);

ALTER TABLE public.teacher_grade_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all teacher grade assignments"
ON public.teacher_grade_assignments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own grade assignments"
ON public.teacher_grade_assignments FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Admins can insert teacher grade assignments"
ON public.teacher_grade_assignments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update teacher grade assignments"
ON public.teacher_grade_assignments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete teacher grade assignments"
ON public.teacher_grade_assignments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create chapter_slides table
CREATE TABLE IF NOT EXISTS public.chapter_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  slide_number integer NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'quiz')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, slide_number)
);

ALTER TABLE public.chapter_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all chapter slides"
ON public.chapter_slides FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view slides for their subjects"
ON public.chapter_slides FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    WHERE c.id = chapter_id AND s.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert chapter slides"
ON public.chapter_slides FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can insert slides for their subjects"
ON public.chapter_slides FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    WHERE c.id = chapter_id AND s.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can update chapter slides"
ON public.chapter_slides FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can update slides for their subjects"
ON public.chapter_slides FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    WHERE c.id = chapter_id AND s.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    WHERE c.id = chapter_id AND s.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete chapter slides"
ON public.chapter_slides FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can delete slides for their subjects"
ON public.chapter_slides FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    WHERE c.id = chapter_id AND s.teacher_id = auth.uid()
  )
);

-- Create teacher_progress table
CREATE TABLE IF NOT EXISTS public.teacher_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  current_slide integer NOT NULL DEFAULT 1,
  completed_slides integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  last_viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(teacher_id, chapter_id)
);

ALTER TABLE public.teacher_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all teacher progress"
ON public.teacher_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own progress"
ON public.teacher_progress FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Admins can insert teacher progress"
ON public.teacher_progress FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can insert their own progress"
ON public.teacher_progress FOR INSERT
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can update teacher progress"
ON public.teacher_progress FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can update their own progress"
ON public.teacher_progress FOR UPDATE
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can delete teacher progress"
ON public.teacher_progress FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can delete their own progress"
ON public.teacher_progress FOR DELETE
USING (teacher_id = auth.uid());

-- Create helper function for getting teacher's unlocked chapters
CREATE OR REPLACE FUNCTION public.get_teacher_unlocked_chapters(_teacher_id uuid)
RETURNS TABLE (
  chapter_id uuid,
  chapter_title text,
  subject_name text,
  grade_name text,
  is_unlocked boolean,
  is_completed boolean,
  progress_percentage integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as chapter_id,
    c.title as chapter_title,
    s.name as subject_name,
    g.name as grade_name,
    CASE 
      WHEN tp.is_completed IS NULL THEN true
      WHEN tp.is_completed = true THEN true
      ELSE false
    END as is_unlocked,
    COALESCE(tp.is_completed, false) as is_completed,
    COALESCE(
      CASE 
        WHEN c.total_slides > 0 THEN (tp.completed_slides * 100 / c.total_slides)
        ELSE 0
      END,
      0
    ) as progress_percentage
  FROM public.chapters c
  JOIN public.subjects s ON c.subject_id = s.id
  JOIN public.grades g ON s.grade_id = g.id
  LEFT JOIN public.teacher_progress tp ON c.id = tp.chapter_id AND tp.teacher_id = _teacher_id
  WHERE s.teacher_id = _teacher_id
  ORDER BY g.display_order, s.name, c.chapter_number;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_chapter_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_chapter_slides_updated_at_trigger
BEFORE UPDATE ON public.chapter_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_chapter_slides_updated_at();