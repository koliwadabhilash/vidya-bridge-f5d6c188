import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { School, Users, BookOpen, TrendingUp, Plus, BarChart3, Edit, Trash2, GraduationCap, UserCheck, Library } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { SchoolModal } from "@/components/admin/SchoolModal";
import { GradeModal } from "@/components/admin/GradeModal";
import { TeacherModal } from "@/components/admin/TeacherModal";
import { StudentModal } from "@/components/admin/StudentModal";
import { SubjectModal } from "@/components/admin/SubjectModal";
import { ChapterModal } from "@/components/admin/ChapterModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [schoolModal, setSchoolModal] = useState<{ open: boolean; school: any }>({ open: false, school: null });
  const [gradeModal, setGradeModal] = useState<{ open: boolean; grade: any }>({ open: false, grade: null });
  const [teacherModal, setTeacherModal] = useState<{ open: boolean; teacher: any }>({ open: false, teacher: null });
  const [studentModal, setStudentModal] = useState<{ open: boolean; student: any }>({ open: false, student: null });
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject: any }>({ open: false, subject: null });
  const [chapterModal, setChapterModal] = useState<{ open: boolean; chapter: any }>({ open: false, chapter: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({ open: false, type: "", id: "" });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: schoolsData } = await supabase.from("schools").select("*");
    setSchools(schoolsData || []);

    const { data: gradesData } = await supabase.from("grades").select("*, schools(name)");
    setGrades(gradesData || []);

    const { data: studentsData } = await supabase.from("students").select("*, schools(name)");
    setStudents(studentsData || []);

    const { data: teachersData } = await supabase.from("teachers").select("*, schools(name)");
    setTeachers(teachersData || []);

    const { data: subjectsData } = await supabase.from("subjects").select("*, grades(name), teachers(full_name)");
    setSubjects(subjectsData || []);

    const { data: chaptersData } = await supabase.from("chapters").select("*, subjects(name)");
    setChapters(chaptersData || []);

    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      const { type, id } = deleteDialog;
      let error;
      
      if (type === "teacher") {
        ({ error } = await supabase.from("teachers").delete().eq("id", id));
      } else if (type === "student") {
        ({ error } = await supabase.from("students").delete().eq("id", id));
      } else if (type === "school") {
        ({ error } = await supabase.from("schools").delete().eq("id", id));
      } else if (type === "grade") {
        ({ error } = await supabase.from("grades").delete().eq("id", id));
      } else if (type === "subject") {
        ({ error } = await supabase.from("subjects").delete().eq("id", id));
      } else if (type === "chapter") {
        ({ error } = await supabase.from("chapters").delete().eq("id", id));
      }
      
      if (error) throw error;
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      fetchDashboardData();
      setDeleteDialog({ open: false, type: "", id: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const performanceTrend = [
    { month: "Jan", performance: 65 },
    { month: "Feb", performance: 68 },
    { month: "Mar", performance: 72 },
    { month: "Apr", performance: 75 },
    { month: "May", performance: 78 },
    { month: "Jun", performance: 82 },
  ];

  const gradeDistribution = [
    { grade: "Class 9", students: 120 },
    { grade: "Class 10", students: 115 },
    { grade: "Class 11", students: 95 },
    { grade: "Class 12", students: 88 },
  ];

  const roleDistribution = [
    { name: "Students", value: students.length, color: "hsl(var(--primary))" },
    { name: "Teachers", value: teachers.length, color: "hsl(var(--secondary))" },
    { name: "Admins", value: 5, color: "hsl(var(--accent))" },
  ];

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground mt-2">Monitor and manage VidyaSetu platform</p>
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <School className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schools.length}</div>
              <p className="text-xs text-muted-foreground">Active institutions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-secondary bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Enrolled learners</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-accent bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Active educators</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Available courses</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Platform Performance Trend
              </CardTitle>
              <CardDescription>Overall student performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      name="Avg Performance %"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Student Distribution by Grade
              </CardTitle>
              <CardDescription>Number of students per grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="grade" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="students" name="Students" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Distribution & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                User Role Distribution
              </CardTitle>
              <CardDescription>Platform users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>Platform status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users (24h)</span>
                    <span className="text-sm font-bold text-primary">245</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Content Upload Rate</span>
                    <span className="text-sm font-bold text-secondary">78%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quiz Completion Rate</span>
                    <span className="text-sm font-bold text-accent">91%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm font-bold text-primary">99.8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '99.8%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schools</CardTitle>
                <Button onClick={() => setSchoolModal({ open: true, school: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add School
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.address || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSchoolModal({ open: true, school })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "school", id: school.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Grades</CardTitle>
                <Button onClick={() => setGradeModal({ open: true, grade: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Grade
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.name}</TableCell>
                      <TableCell>{grade.schools?.name || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setGradeModal({ open: true, grade })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "grade", id: grade.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teachers</CardTitle>
                <Button onClick={() => setTeacherModal({ open: true, teacher: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Teacher
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.schools?.name || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setTeacherModal({ open: true, teacher })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "teacher", id: teacher.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Students</CardTitle>
                <Button onClick={() => setStudentModal({ open: true, student: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.roll_number || "-"}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.schools?.name || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setStudentModal({ open: true, student })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "student", id: student.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subjects</CardTitle>
                <Button onClick={() => setSubjectModal({ open: true, subject: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.grades?.name || "-"}</TableCell>
                      <TableCell>{subject.profiles?.full_name || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSubjectModal({ open: true, subject })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "subject", id: subject.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chapters</CardTitle>
                <Button onClick={() => setChapterModal({ open: true, chapter: null })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Chapter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell className="font-medium">{chapter.title}</TableCell>
                      <TableCell>{chapter.subjects?.name || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setChapterModal({ open: true, chapter })}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, type: "chapter", id: chapter.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SchoolModal {...schoolModal} onClose={() => setSchoolModal({ open: false, school: null })} onSuccess={fetchDashboardData} />
      <GradeModal {...gradeModal} onClose={() => setGradeModal({ open: false, grade: null })} onSuccess={fetchDashboardData} />
      <TeacherModal {...teacherModal} onClose={() => setTeacherModal({ open: false, teacher: null })} onSuccess={fetchDashboardData} />
      <StudentModal {...studentModal} onClose={() => setStudentModal({ open: false, student: null })} onSuccess={fetchDashboardData} />
      <SubjectModal {...subjectModal} onClose={() => setSubjectModal({ open: false, subject: null })} onSuccess={fetchDashboardData} />
      <ChapterModal {...chapterModal} onClose={() => setChapterModal({ open: false, chapter: null })} onSuccess={fetchDashboardData} />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: "", id: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteDialog.type}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
