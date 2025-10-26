-- Replace the get_teacher_unlocked_chapters function with proper sequential unlocking
CREATE OR REPLACE FUNCTION public.get_teacher_unlocked_chapters(_teacher_id uuid)
RETURNS TABLE(
  chapter_id uuid, 
  chapter_title text, 
  subject_name text, 
  grade_name text, 
  is_unlocked boolean, 
  is_completed boolean, 
  progress_percentage integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH chapter_data AS (
    SELECT 
      c.id as chapter_id,
      c.title as chapter_title,
      c.chapter_number,
      c.subject_id,
      s.name as subject_name,
      g.name as grade_name,
      c.total_slides,
      COALESCE(tp.is_completed, false) as is_completed,
      COALESCE(tp.completed_slides, 0) as completed_slides
    FROM public.chapters c
    JOIN public.subjects s ON c.subject_id = s.id
    JOIN public.grades g ON s.grade_id = g.id
    LEFT JOIN public.teacher_progress tp 
      ON c.id = tp.chapter_id AND tp.teacher_id = _teacher_id
    WHERE s.teacher_id = _teacher_id
  ),
  unlocked_chapters AS (
    SELECT 
      cd1.chapter_id,
      cd1.chapter_title,
      cd1.subject_name,
      cd1.grade_name,
      -- Chapter is unlocked if:
      -- 1. It's chapter number 1 (always unlocked)
      -- 2. OR all previous chapters in same subject are completed
      CASE 
        WHEN cd1.chapter_number = 1 THEN true
        ELSE NOT EXISTS (
          SELECT 1 
          FROM chapter_data cd2 
          WHERE cd2.subject_id = cd1.subject_id 
            AND cd2.chapter_number < cd1.chapter_number 
            AND cd2.is_completed = false
        )
      END as is_unlocked,
      cd1.is_completed,
      -- Calculate progress percentage
      CASE 
        WHEN cd1.total_slides > 0 
        THEN (cd1.completed_slides * 100 / cd1.total_slides)
        ELSE 0
      END as progress_percentage
    FROM chapter_data cd1
  )
  SELECT * FROM unlocked_chapters
  ORDER BY grade_name, subject_name, chapter_id;
$function$;