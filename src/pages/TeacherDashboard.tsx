import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ChapterWithProgress {
  chapter_id: string;
  chapter_title: string;
  subject_name: string;
  grade_name: string;
  is_unlocked: boolean;
  is_completed: boolean;
  progress_percentage: number;
}

interface SubjectWithChapters {
  subject_name: string;
  chapters: ChapterWithProgress[];
}

interface GradeWithSubjects {
  grade_name: string;
  subjects: SubjectWithChapters[];
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [gradesData, setGradesData] = useState<GradeWithSubjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChapters: 0,
    totalSubjects: 0,
    avgProgress: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Use the security definer function to get chapters with progress
    const { data: chaptersData, error } = await supabase
      .rpc('get_teacher_unlocked_chapters', {
        _teacher_id: session.user.id
      });

    if (error) {
      console.error("Error fetching chapters:", error);
      setLoading(false);
      return;
    }

    if (!chaptersData || chaptersData.length === 0) {
      setLoading(false);
      return;
    }

    // Organize data by Grade → Subject → Chapter hierarchy
    const gradesMap = new Map<string, GradeWithSubjects>();

    chaptersData.forEach((chapter: ChapterWithProgress) => {
      if (!gradesMap.has(chapter.grade_name)) {
        gradesMap.set(chapter.grade_name, {
          grade_name: chapter.grade_name,
          subjects: []
        });
      }

      const grade = gradesMap.get(chapter.grade_name)!;
      let subject = grade.subjects.find(s => s.subject_name === chapter.subject_name);

      if (!subject) {
        subject = {
          subject_name: chapter.subject_name,
          chapters: []
        };
        grade.subjects.push(subject);
      }

      subject.chapters.push(chapter);
    });

    // Sort chapters by chapter number (implied by order)
    gradesMap.forEach(grade => {
      grade.subjects.forEach(subject => {
        subject.chapters.sort((a, b) => {
          // Extract chapter numbers from titles if available
          const aNum = parseInt(a.chapter_title.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.chapter_title.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });
      });
    });

    const gradesArray = Array.from(gradesMap.values());
    setGradesData(gradesArray);

    // Calculate stats
    const totalChapters = chaptersData.length;
    const uniqueSubjects = new Set(chaptersData.map((c: ChapterWithProgress) => c.subject_name)).size;
    const avgProgress = chaptersData.length > 0
      ? chaptersData.reduce((sum: number, c: ChapterWithProgress) => sum + c.progress_percentage, 0) / chaptersData.length
      : 0;

    setStats({
      totalChapters,
      totalSubjects: uniqueSubjects,
      avgProgress: Math.round(avgProgress)
    });

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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Complete chapters sequentially to unlock the next one
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChapters}</div>
              <p className="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProgress}%</div>
              <p className="text-xs text-muted-foreground">Overall completion</p>
            </CardContent>
          </Card>
        </div>

        {/* My Grades and Subjects */}
        {gradesData.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Chapters Assigned</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any subjects or chapters assigned yet. Please contact your administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Grades & Subjects
              </CardTitle>
              <CardDescription>Select a chapter to begin teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {gradesData.map((grade, gradeIndex) => (
                  <AccordionItem key={gradeIndex} value={`grade-${gradeIndex}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{grade.grade_name}</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({grade.subjects.length} {grade.subjects.length === 1 ? 'subject' : 'subjects'})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        {grade.subjects.map((subject, subjectIndex) => (
                          <div key={subjectIndex} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                              <h4 className="font-semibold text-base">{subject.subject_name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {subject.chapters.length} chapters
                              </Badge>
                            </div>
                            <div className="space-y-2 pl-4">
                              {subject.chapters.map((chapter, chapterIndex) => (
                                <Card
                                  key={chapterIndex}
                                  className={`transition-all ${
                                    chapter.is_unlocked
                                      ? 'hover:shadow-md cursor-pointer'
                                      : 'opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3 flex-1">
                                        {chapter.is_unlocked ? (
                                          chapter.is_completed ? (
                                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                          ) : (
                                            <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                          )
                                        ) : (
                                          <Lock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-sm mb-1">
                                            {chapter.chapter_title}
                                          </h5>
                                          {chapter.is_unlocked && (
                                            <div className="space-y-2 mt-2">
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{chapter.progress_percentage}% complete</span>
                                                {chapter.is_completed && (
                                                  <>
                                                    <span>•</span>
                                                    <Badge variant="default" className="text-xs">Completed</Badge>
                                                  </>
                                                )}
                                              </div>
                                              <Progress value={chapter.progress_percentage} className="h-2" />
                                            </div>
                                          )}
                                          {!chapter.is_unlocked && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Complete the previous chapter to unlock
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        {chapter.is_unlocked ? (
                                          <Button
                                            size="sm"
                                            onClick={() => navigate(`/teacher/chapter/${chapter.chapter_id}`)}
                                          >
                                            {chapter.is_completed ? 'Review' : 'Continue'}
                                          </Button>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            Locked
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;