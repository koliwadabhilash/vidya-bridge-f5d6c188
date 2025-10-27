-- Drop the old check constraint that doesn't allow 'pdf'
ALTER TABLE chapter_slides DROP CONSTRAINT IF EXISTS chapter_slides_content_type_check;

-- Add new check constraint with correct content types (pdf, image, video)
ALTER TABLE chapter_slides ADD CONSTRAINT chapter_slides_content_type_check 
CHECK (content_type IN ('pdf', 'image', 'video'));