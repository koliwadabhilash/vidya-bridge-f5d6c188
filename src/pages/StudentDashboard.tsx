import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Award, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const StudentDashboard = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch enrollments with grades
    const { data: enrollmentData } = await supabase
      .from("student_enrollments")
      .select(`
        *,
        grades (*)
      `)
      .eq("student_id", session.user.id);

    setEnrollments(enrollmentData || []);

    // Fetch recent progress
    const { data: progressData } = await supabase
      .from("student_progress")
      .select(`
        *,
        chapters (
          name,
          subjects (
            name,
            grades (name)
          )
        )
      `)
      .eq("student_id", session.user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(5);

    setRecentProgress(progressData || []);

    // Fetch quiz attempts
    const { data: quizData } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quizzes (
          title,
          subjects (name)
        )
      `)
      .eq("student_id", session.user.id)
      .order("started_at", { ascending: false })
      .limit(5);

    setUpcomingQuizzes(quizData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground mt-2">
            Continue your learning journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <p className="text-xs text-muted-foreground">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentProgress.filter(p => p.progress_percentage === 100).length}
              </div>
              <p className="text-xs text-muted-foreground">Finished chapters</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingQuizzes.length > 0
                  ? Math.round(
                      upcomingQuizzes
                        .filter(q => q.score !== null)
                        .reduce((acc, q) => acc + (q.score / q.total_marks) * 100, 0) /
                        upcomingQuizzes.filter(q => q.score !== null).length
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingQuizzes.filter(q => q.is_completed).length}
              </div>
              <p className="text-xs text-muted-foreground">Completed assessments</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Start learning to see your progress here
                </p>
              ) : (
                <div className="space-y-4">
                  {recentProgress.map((progress) => (
                    <div key={progress.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {progress.chapters.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {progress.chapters.subjects.name} • {progress.chapters.subjects.grades.name}
                          </p>
                        </div>
                        <Badge variant={progress.progress_percentage === 100 ? "default" : "secondary"}>
                          {progress.progress_percentage}%
                        </Badge>
                      </div>
                      <Progress value={progress.progress_percentage} className="h-2" />
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
                <Award className="h-5 w-5 text-secondary" />
                Quiz Performance
              </CardTitle>
              <CardDescription>Your recent quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No quizzes attempted yet
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{quiz.quizzes.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.quizzes.subjects?.name}
                        </p>
                      </div>
                      {quiz.is_completed ? (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {quiz.score}/{quiz.total_marks}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((quiz.score / quiz.total_marks) * 100)}%
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="h-auto py-6 flex-col gap-2">
                <BookOpen className="h-6 w-6" />
                <span>Browse Subjects</span>
              </Button>
              <Button variant="secondary" className="h-auto py-6 flex-col gap-2">
                <Award className="h-6 w-6" />
                <span>Take a Quiz</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Progress</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
