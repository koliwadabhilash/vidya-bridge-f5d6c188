-- ============================================
-- COMPREHENSIVE RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- 1. SCHOOLS TABLE
-- Already has: "Anyone can view schools" (SELECT)

CREATE POLICY "Admins can insert schools"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update schools"
ON public.schools
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schools"
ON public.schools
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. GRADES TABLE
-- Already has: "Anyone can view grades" (SELECT)

CREATE POLICY "Admins can insert grades"
ON public.grades
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update grades"
ON public.grades
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete grades"
ON public.grades
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. ADMINS TABLE

CREATE POLICY "Admins can view all admins"
ON public.admins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admins"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admins"
ON public.admins
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admins"
ON public.admins
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. TEACHERS TABLE

CREATE POLICY "Admins can view all teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert teachers"
ON public.teachers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teachers"
ON public.teachers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete teachers"
ON public.teachers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. STUDENTS TABLE

CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. SUBJECTS TABLE

CREATE POLICY "Admins can view all subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subjects"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subjects"
ON public.subjects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. CHAPTERS TABLE

CREATE POLICY "Admins can view all chapters"
ON public.chapters
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chapters"
ON public.chapters
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chapters"
ON public.chapters
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chapters"
ON public.chapters
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. CHAPTER_FILES TABLE

CREATE POLICY "Admins can view all chapter files"
ON public.chapter_files
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chapter files"
ON public.chapter_files
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chapter files"
ON public.chapter_files
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chapter files"
ON public.chapter_files
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. STUDENT_PROGRESS TABLE

CREATE POLICY "Admins can view all student progress"
ON public.student_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert student progress"
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update student progress"
ON public.student_progress
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student progress"
ON public.student_progress
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. STUDENT_ENROLLMENTS TABLE

CREATE POLICY "Admins can view all student enrollments"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert student enrollments"
ON public.student_enrollments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update student enrollments"
ON public.student_enrollments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student enrollments"
ON public.student_enrollments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));