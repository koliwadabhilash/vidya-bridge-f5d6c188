-- Allow teachers to view students in grades they teach
CREATE POLICY "Teachers can view students in their teaching grades"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.grade_id = students.grade_id
        AND s.teacher_id = auth.uid()
    )
  );

-- Make email nullable first (in case there's data)
ALTER TABLE public.students ALTER COLUMN email DROP NOT NULL;

-- Drop email column from students table
ALTER TABLE public.students DROP COLUMN email;