import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Assessment {
  id: string;
  assessment_name: string;
  total_marks: number;
  pass_marks: number;
  chapters: {
    title: string;
    subjects: {
      name: string;
      grade_id: string;
      grades: {
        name: string;
      };
    };
  };
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
}

interface StudentMark {
  student_id: string;
  marks_obtained: number;
}

const AssessmentMarks = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [existingMarks, setExistingMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select(`
          id,
          assessment_name,
          total_marks,
          pass_marks,
          chapters (
            title,
            subjects (
              name,
              grade_id,
              grades (
                name
              )
            )
          )
        `)
        .eq("id", assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch students in the grade
      const gradeId = assessmentData.chapters.subjects.grade_id;
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, roll_number")
        .eq("grade_id", gradeId)
        .order("roll_number", { ascending: true });

      if (studentsError) throw studentsError;
      setStudents(studentsData);

      // Fetch existing marks
      const { data: marksData, error: marksError } = await supabase
        .from("student_assessments")
        .select("student_id, marks_obtained")
        .eq("assessment_id", assessmentId);

      if (marksError) throw marksError;

      const marksMap: Record<string, number> = {};
      marksData.forEach((mark: StudentMark) => {
        marksMap[mark.student_id] = mark.marks_obtained;
      });
      setMarks(marksMap);
      setExistingMarks(marksMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    if (value === "") {
      setMarks((prev) => ({
        ...prev,
        [studentId]: 0,
      }));
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= (assessment?.total_marks || 0)) {
      setMarks((prev) => ({
        ...prev,
        [studentId]: numValue,
      }));
    }
  };

  const saveMarks = async (studentId: string) => {
    if (marks[studentId] === undefined) return;

    setIsSaving(studentId);
    try {
      const { error } = await supabase
        .from("student_assessments")
        .upsert({
          assessment_id: assessmentId,
          student_id: studentId,
          marks_obtained: marks[studentId],
        }, {
          onConflict: 'assessment_id,student_id'
        });

      if (error) throw error;

      setExistingMarks((prev) => ({
        ...prev,
        [studentId]: marks[studentId],
      }));

      toast({
        title: "Success",
        description: "Marks saved successfully",
      });
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({
        title: "Error",
        description: "Failed to save marks",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
  };


  const calculateStats = () => {
    const totalStudents = students.length;
    const marksEntered = Object.keys(existingMarks).length;
    const passedCount = Object.values(existingMarks).filter(
      (mark) => mark >= (assessment?.pass_marks || 0)
    ).length;
    const passRate = marksEntered > 0 ? Math.round((passedCount / marksEntered) * 100) : 0;

    return { totalStudents, marksEntered, passedCount, passRate };
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assessment) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Assessment not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = calculateStats();

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/teacher-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{assessment.assessment_name}</h1>
          <p className="text-muted-foreground mt-2">
            {assessment.chapters.subjects.grades.name} - {assessment.chapters.subjects.name} - {assessment.chapters.title}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{assessment.total_marks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pass Marks</p>
                <p className="text-2xl font-bold">{assessment.pass_marks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passedCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enter Student Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Marks (out of {assessment.total_marks})</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentMark = marks[student.id];
                    const isPassing = studentMark !== undefined && studentMark >= assessment.pass_marks;
                    const hasChanges = existingMarks[student.id] !== studentMark;

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.roll_number || "-"}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={assessment.total_marks}
                            value={studentMark !== undefined ? studentMark : ""}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          {studentMark !== undefined && existingMarks[student.id] !== undefined && (
                            <Badge variant={isPassing ? "default" : "destructive"}>
                              {isPassing ? "Pass" : "Fail"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => saveMarks(student.id)}
                            disabled={!hasChanges || isSaving === student.id}
                          >
                            {isSaving === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssessmentMarks;
