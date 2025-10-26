-- Allow teachers to view their own profile
CREATE POLICY "Teachers can view own profile"
ON public.teachers
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow students to view their own profile  
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow teachers to update their own profile
CREATE POLICY "Teachers can update own profile"
ON public.teachers
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow students to update their own profile
CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);