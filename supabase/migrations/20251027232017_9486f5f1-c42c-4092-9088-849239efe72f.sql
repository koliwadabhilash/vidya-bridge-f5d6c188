-- Remove unused teacher_grade_assignments table
DROP TABLE IF EXISTS teacher_grade_assignments CASCADE;

-- Update chapter_slides table: replace content with file_path
ALTER TABLE chapter_slides DROP COLUMN content;
ALTER TABLE chapter_slides ADD COLUMN file_path TEXT NOT NULL;

-- Create storage bucket for slide files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chapter-slides', 'chapter-slides', true);

-- RLS Policy: Admins can manage chapter slide files
CREATE POLICY "Admins can manage chapter slide files"
ON storage.objects FOR ALL
USING (bucket_id = 'chapter-slides' AND has_role(auth.uid(), 'admin'));

-- RLS Policy: Teachers can view chapter slide files
CREATE POLICY "Teachers can view chapter slide files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chapter-slides' AND has_role(auth.uid(), 'teacher'));