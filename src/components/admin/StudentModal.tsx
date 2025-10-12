import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentModalProps {
  open: boolean;
  onClose: () => void;
  student?: any;
  onSuccess: () => void;
}

export function StudentModal({ open, onClose, student, onSuccess }: StudentModalProps) {
  const [name, setName] = useState(student?.full_name || "");
  const [email, setEmail] = useState(student?.email || "");
  const [rollNumber, setRollNumber] = useState(student?.roll_number || "");
  const [schoolId, setSchoolId] = useState(student?.school_id || "");
  const [gradeId, setGradeId] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSchools();
    }
  }, [open]);

  useEffect(() => {
    if (schoolId) {
      fetchGrades();
    }
  }, [schoolId]);

  const fetchSchools = async () => {
    const { data } = await supabase.from("schools").select("*");
    setSchools(data || []);
  };

  const fetchGrades = async () => {
    const { data } = await supabase
      .from("grades")
      .select("*")
      .eq("school_id", schoolId);
    setGrades(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (student) {
        const { error } = await supabase
          .from("students")
          .update({ full_name: name, roll_number: rollNumber, school_id: schoolId, grade_id: gradeId })
          .eq("id", student.id);
        
        if (error) throw error;
        
        // Update enrollment if grade changed
        if (gradeId) {
          const { error: enrollError } = await supabase
            .from("student_enrollments")
            .upsert({ student_id: student.id, grade_id: gradeId, school_id: schoolId });
          
          if (enrollError) throw enrollError;
        }
        
        toast({ title: "Student updated successfully" });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: "Student@123",
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
              role: 'student',
              school_id: schoolId,
              grade_id: gradeId,
              roll_number: rollNumber
            }
          }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          const { error: enrollError } = await supabase
            .from("student_enrollments")
            .insert({ student_id: authData.user.id, grade_id: gradeId, school_id: schoolId });
          
          if (enrollError) throw enrollError;
        }
        
        toast({ title: "Student created successfully with password: Student@123" });
      }
      
      onSuccess();
      onClose();
      setName("");
      setEmail("");
      setRollNumber("");
      setSchoolId("");
      setGradeId("");
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
          <DialogTitle>{student ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!student}
                required
              />
            </div>
            <div>
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="school">School *</Label>
              <Select value={schoolId} onValueChange={setSchoolId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Grade *</Label>
              <Select value={gradeId} onValueChange={setGradeId} required disabled={!schoolId}>
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
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : student ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}