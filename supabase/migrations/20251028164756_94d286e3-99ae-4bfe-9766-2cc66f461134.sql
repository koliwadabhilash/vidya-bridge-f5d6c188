-- Clean up orphaned file that has no database record
-- This file was uploaded but the database insert failed, leaving it orphaned
DELETE FROM storage.objects 
WHERE bucket_id = 'chapter-slides' 
  AND name = 'bc152a4c-311c-4d00-867b-72b5a094e9f0-slide-1.pdf'
  AND name NOT IN (SELECT file_path FROM chapter_slides);