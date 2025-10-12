import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeacherModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: any;
  onSuccess: () => void;
}

export function TeacherModal({ open, onClose, teacher, onSuccess }: TeacherModalProps) {
  const [name, setName] = useState(teacher?.full_name || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [schoolId, setSchoolId] = useState(teacher?.school_id || "");
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSchools();
    }
  }, [open]);

  const fetchSchools = async () => {
    const { data } = await supabase.from("schools").select("*");
    setSchools(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (teacher) {
        const { error } = await supabase
          .from("teachers")
          .update({ full_name: name, school_id: schoolId })
          .eq("id", teacher.id);
        
        if (error) throw error;
        toast({ title: "Teacher updated successfully" });
      } else {
        // For new teachers, we need to create an auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: "Teacher@123",
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
              role: 'teacher',
              school_id: schoolId
            }
          }
        });
        
        if (authError) throw authError;
        
        toast({ title: "Teacher created successfully with password: Teacher@123" });
      }
      
      onSuccess();
      onClose();
      setName("");
      setEmail("");
      setSchoolId("");
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
          <DialogTitle>{teacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
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
                disabled={!!teacher}
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
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : teacher ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}