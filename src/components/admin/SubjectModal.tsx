import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubjectModalProps {
  open: boolean;
  onClose: () => void;
  subject?: any;
  onSuccess: () => void;
}

export function SubjectModal({ open, onClose, subject, onSuccess }: SubjectModalProps) {
  const [name, setName] = useState(subject?.name || "");
  const [gradeId, setGradeId] = useState(subject?.grade_id || "");
  const [teacherId, setTeacherId] = useState(subject?.teacher_id || "");
  const [grades, setGrades] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchGrades();
      fetchTeachers();
    }
  }, [open]);

  const fetchGrades = async () => {
    const { data } = await supabase.from("grades").select("*");
    setGrades(data || []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher");
    setTeachers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (subject) {
        const { error } = await supabase
          .from("subjects")
          .update({ name, grade_id: gradeId, teacher_id: teacherId })
          .eq("id", subject.id);
        
        if (error) throw error;
        toast({ title: "Subject updated successfully" });
      } else {
        const { error } = await supabase
          .from("subjects")
          .insert({ name, grade_id: gradeId, teacher_id: teacherId });
        
        if (error) throw error;
        toast({ title: "Subject created successfully" });
      }
      
      onSuccess();
      onClose();
      setName("");
      setGradeId("");
      setTeacherId("");
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
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade *</Label>
              <Select value={gradeId} onValueChange={setGradeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="teacher">Teacher *</Label>
              <Select value={teacherId} onValueChange={setTeacherId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
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
              {loading ? "Saving..." : subject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}