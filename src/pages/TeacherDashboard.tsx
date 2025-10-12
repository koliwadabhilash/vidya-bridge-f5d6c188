import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, Plus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TeacherDashboard = () => {
  const [chapters, setChapters] = useState<any[]>([]);
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No chapters created yet</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Chapter
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{chapter.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{chapter.subjects?.name}</span>
                        <span>•</span>
                        <span>{chapter.subjects?.grades?.name}</span>
                        <span>•</span>
                        <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="mr-2 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;