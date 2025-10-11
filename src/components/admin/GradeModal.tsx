import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GradeModalProps {
  open: boolean;
  onClose: () => void;
  grade?: any;
  onSuccess: () => void;
}

export function GradeModal({ open, onClose, grade, onSuccess }: GradeModalProps) {
  const [name, setName] = useState(grade?.name || "");
  const [schoolId, setSchoolId] = useState(grade?.school_id || "");
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
      if (grade) {
        const { error } = await supabase
          .from("grades")
          .update({ name, school_id: schoolId })
          .eq("id", grade.id);
        
        if (error) throw error;
        toast({ title: "Grade updated successfully" });
      } else {
        const { error } = await supabase
          .from("grades")
          .insert({ name, school_id: schoolId, display_order: 1 });
        
        if (error) throw error;
        toast({ title: "Grade created successfully" });
      }
      
      onSuccess();
      onClose();
      setName("");
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
          <DialogTitle>{grade ? "Edit Grade" : "Add Grade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 6"
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
              {loading ? "Saving..." : grade ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}