-- Allow teachers to view subjects they teach
CREATE POLICY "Teachers can view their subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- Allow teachers to view chapters for their subjects
CREATE POLICY "Teachers can view chapters for their subjects"
ON public.chapters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = chapters.subject_id
    AND subjects.teacher_id = auth.uid()
  )
);