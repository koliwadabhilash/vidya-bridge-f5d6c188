import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface SlideUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SlideUploadModal({ open, onClose, onSuccess }: SlideUploadModalProps) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [nextSlideNumber, setNextSlideNumber] = useState<number>(1);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchChapters();
    }
  }, [open]);

  useEffect(() => {
    if (selectedChapter) {
      fetchNextSlideNumber();
    }
  }, [selectedChapter]);

  const fetchNextSlideNumber = async () => {
    const { data } = await supabase
      .from("chapter_slides")
      .select("slide_number")
      .eq("chapter_id", selectedChapter)
      .order("slide_number", { ascending: false })
      .limit(1);
    
    setNextSlideNumber(data && data.length > 0 ? data[0].slide_number + 1 : 1);
  };

  const fetchChapters = async () => {
    const { data } = await supabase
      .from("chapters")
      .select("id, title, subjects(name, grades(name))")
      .order("title");
    setChapters(data || []);
  };

  const detectContentType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext!)) return 'image';
    if (['mp4', 'webm'].includes(ext!)) return 'video';
    return 'unknown';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const contentType = detectContentType(selectedFile.name);
    if (contentType === 'unknown') {
      toast({
        title: "Invalid file type",
        description: "Supported formats: PDF, JPG, PNG, WEBP, MP4, WEBM",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!selectedChapter || !file) {
      toast({ title: "Please select a chapter and file", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename with timestamp to prevent conflicts
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${selectedChapter}-slide-${nextSlideNumber}-${timestamp}.${fileExt}`;
      const filePath = fileName;

      setUploadProgress(30);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('chapter-slides')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      setUploadProgress(60);

      // Detect content type
      const contentType = detectContentType(file.name);

      // Insert slide record
      const { error: insertError } = await supabase
        .from("chapter_slides")
        .insert({
          chapter_id: selectedChapter,
          slide_number: nextSlideNumber,
          content_type: contentType,
          file_path: filePath
        });

      if (insertError) {
        // Cleanup: Delete uploaded file if database insert fails
        await supabase.storage.from('chapter-slides').remove([filePath]);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      setUploadProgress(80);

      // Update chapter total_slides
      const { error: updateError } = await supabase
        .from("chapters")
        .update({ total_slides: nextSlideNumber })
        .eq("id", selectedChapter);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast({ title: "Slide uploaded successfully" });
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedChapter("");
    setFile(null);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Slide</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapter</Label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger id="chapter">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title} - {chapter.subjects?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported: PDF, JPG, PNG, WEBP, MP4, WEBM (Max 50MB)
            </p>
          </div>

          {file && selectedChapter && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
              <div className="text-sm font-medium text-primary">
                This will be uploaded as Slide #{nextSlideNumber}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedChapter || !file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
