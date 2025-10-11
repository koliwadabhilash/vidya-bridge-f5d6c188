import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChapterModalProps {
  open: boolean;
  onClose: () => void;
  chapter?: any;
  onSuccess: () => void;
}

export function ChapterModal({ open, onClose, chapter, onSuccess }: ChapterModalProps) {
  const [title, setTitle] = useState(chapter?.title || "");
  const [subjectId, setSubjectId] = useState(chapter?.subject_id || "");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSubjects();
    }
  }, [open]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*");
    setSubjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (chapter) {
        const { error } = await supabase
          .from("chapters")
          .update({ title, subject_id: subjectId })
          .eq("id", chapter.id);
        
        if (error) throw error;
        toast({ title: "Chapter updated successfully" });
      } else {
        const { error } = await supabase
          .from("chapters")
          .insert({ title, subject_id: subjectId });
        
        if (error) throw error;
        toast({ title: "Chapter created successfully" });
      }
      
      onSuccess();
      onClose();
      setTitle("");
      setSubjectId("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Chapter Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Algebra"
                required
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : chapter ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}