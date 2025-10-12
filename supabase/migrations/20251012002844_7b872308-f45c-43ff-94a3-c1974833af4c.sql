-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  LIMIT 1;
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Function to check if ANY admin exists (for signup control)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  );
$$;

-- Update handle_new_user trigger to insert into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
    
  ELSIF user_role = 'teacher' THEN
    INSERT INTO teachers (id, email, full_name, school_id)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Teacher'), user_school_id);
    
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'teacher'::app_role);
    
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
    
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role);
  END IF;

  RETURN NEW;
END;
$$;