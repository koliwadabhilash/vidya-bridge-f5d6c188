-- Enable Row Level Security on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Fix the handle_new_user function search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;