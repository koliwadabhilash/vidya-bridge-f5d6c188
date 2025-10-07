import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, TrendingUp, Plus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TeacherDashboard = () => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch chapters created by teacher
    const { data: chaptersData } = await supabase
      .from("chapters")
      .select(`
        *,
        subjects (
          name,
          grades (name)
        )
      `)
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setChapters(chaptersData || []);

    // Fetch quizzes
    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select(`
        *,
        subjects (name),
        chapters (name)
      `)
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setQuizzes(quizzesData || []);

    // Fetch all subjects
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select(`
        *,
        grades (name)
      `)
      .limit(10);

    setSubjects(subjectsData || []);

    // Create mock performance data for chart
    const mockPerformanceData = [
      { subject: "Math", avgScore: 75 },
      { subject: "Science", avgScore: 82 },
      { subject: "English", avgScore: 68 },
      { subject: "History", avgScore: 79 },
      { subject: "Geography", avgScore: 71 },
    ];
    setPerformanceData(mockPerformanceData);

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Manage your classes and monitor student progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Chapter
            </Button>
            <Button variant="secondary" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chapters.length}</div>
              <p className="text-xs text-muted-foreground">Content created</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Created</CardTitle>
              <FileText className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
              <p className="text-xs text-muted-foreground">Assessments available</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <p className="text-xs text-muted-foreground">Class average</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Subject Performance Overview
            </CardTitle>
            <CardDescription>Average student scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="subject" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" name="Average Score %" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Chapters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recent Chapters
              </CardTitle>
              <CardDescription>Your latest content uploads</CardDescription>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Create your first chapter to get started
                </p>
              ) : (
                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{chapter.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {chapter.subjects.name} • {chapter.subjects.grades.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(chapter.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Recent Quizzes
              </CardTitle>
              <CardDescription>Your latest assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Create your first quiz to assess students
                </p>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.subjects?.name || quiz.chapters?.name}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{quiz.total_marks} marks</Badge>
                          {quiz.duration_minutes && (
                            <Badge variant="outline">{quiz.duration_minutes} min</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
