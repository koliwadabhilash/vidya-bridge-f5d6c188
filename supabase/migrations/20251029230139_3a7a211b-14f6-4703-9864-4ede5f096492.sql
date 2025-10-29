-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  pass_marks INTEGER NOT NULL CHECK (pass_marks >= 0 AND pass_marks <= total_marks),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chapter_id)
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Teachers can view assessments for their chapters"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = assessments.chapter_id
        AND s.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create assessments for their chapters"
  ON public.assessments FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = assessments.chapter_id
        AND s.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own assessments"
  ON public.assessments FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own assessments"
  ON public.assessments FOR DELETE
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all assessments"
  ON public.assessments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all assessments"
  ON public.assessments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER handle_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create student_assessments table
CREATE TABLE public.student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL CHECK (marks_obtained >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_assessments
CREATE POLICY "Teachers can view marks for their assessments"
  ON public.student_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = student_assessments.assessment_id
        AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can input marks for their assessments"
  ON public.student_assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = student_assessments.assessment_id
        AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update marks for their assessments"
  ON public.student_assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = student_assessments.assessment_id
        AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = student_assessments.assessment_id
        AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all student assessments"
  ON public.student_assessments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all student assessments"
  ON public.student_assessments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER handle_student_assessments_updated_at
  BEFORE UPDATE ON public.student_assessments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();