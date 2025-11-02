import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "./FilterBar";
import { MetricsCard } from "./MetricsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BookOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressData {
  school_id: string;
  school_name: string;
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  total_slides: number;
  completed_slides: number;
  is_completed: boolean;
}

export function TeacherProgressAnalytics() {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: schoolsData } = await supabase.from("schools").select("*");
    setSchools(schoolsData || []);

    const { data: gradesData } = await supabase.from("grades").select("*");
    setGrades(gradesData || []);

    const { data: subjectsData } = await supabase.from("subjects").select("*, grades(name)");
    setSubjects(subjectsData || []);

    const { data: teachersData } = await supabase.from("teachers").select("*");
    setTeachers(teachersData || []);

    // Fetch progress data with all joins
    const { data: progressData } = await supabase
      .from("teacher_progress")
      .select(`
        *,
        chapters (
          id,
          title,
          chapter_number,
          total_slides,
          subjects (
            id,
            name,
            grade_id,
            grades (
              id,
              name,
              school_id,
              schools (
                id,
                name
              )
            )
          )
        ),
        teachers (
          id,
          full_name
        )
      `);

    const formattedData: ProgressData[] = (progressData || []).map((item: any) => ({
      school_id: item.chapters?.subjects?.grades?.schools?.id || "",
      school_name: item.chapters?.subjects?.grades?.schools?.name || "N/A",
      grade_id: item.chapters?.subjects?.grades?.id || "",
      grade_name: item.chapters?.subjects?.grades?.name || "N/A",
      subject_id: item.chapters?.subjects?.id || "",
      subject_name: item.chapters?.subjects?.name || "N/A",
      teacher_id: item.teacher_id,
      teacher_name: item.teachers?.full_name || "N/A",
      chapter_id: item.chapter_id,
      chapter_title: item.chapters?.title || "N/A",
      chapter_number: item.chapters?.chapter_number || 0,
      total_slides: item.chapters?.total_slides || 0,
      completed_slides: item.completed_slides,
      is_completed: item.is_completed,
    }));

    setProgressData(formattedData);
    setLoading(false);
  };

  // Filter data based on selections
  const filteredData = progressData.filter((item) => {
    if (selectedSchool && selectedSchool !== "all" && item.school_id !== selectedSchool) return false;
    if (selectedGrade && selectedGrade !== "all" && item.grade_id !== selectedGrade) return false;
    if (selectedSubject && selectedSubject !== "all" && item.subject_id !== selectedSubject) return false;
    if (selectedTeacher && selectedTeacher !== "all" && item.teacher_id !== selectedTeacher) return false;
    return true;
  });

  // Filter cascading
  const filteredGrades = selectedSchool && selectedSchool !== "all" 
    ? grades.filter(g => g.school_id === selectedSchool)
    : grades;

  const filteredSubjects = selectedGrade && selectedGrade !== "all"
    ? subjects.filter(s => s.grade_id === selectedGrade)
    : subjects;

  const filteredTeachers = selectedSubject && selectedSubject !== "all"
    ? teachers.filter(t => subjects.find(s => s.id === selectedSubject && s.teacher_id === t.id))
    : teachers;

  // Calculate metrics
  const totalChapters = filteredData.length;
  const completedChapters = filteredData.filter(d => d.is_completed).length;
  const inProgressChapters = filteredData.filter(d => !d.is_completed && d.completed_slides > 0).length;
  const notStartedChapters = filteredData.filter(d => d.completed_slides === 0).length;
  const avgCompletionRate = totalChapters > 0 
    ? Math.round((completedChapters / totalChapters) * 100) 
    : 0;

  // Chart data - group by selected level
  const getChartData = () => {
    if (selectedTeacher && selectedTeacher !== "all") {
      return filteredData.map(d => ({
        name: `Ch ${d.chapter_number}`,
        completion: d.total_slides > 0 ? Math.round((d.completed_slides / d.total_slides) * 100) : 0,
      }));
    } else if (selectedSubject && selectedSubject !== "all") {
      const teacherGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.teacher_id]) {
          acc[d.teacher_id] = { name: d.teacher_name, completed: 0, total: 0 };
        }
        acc[d.teacher_id].total++;
        if (d.is_completed) acc[d.teacher_id].completed++;
        return acc;
      }, {});
      return Object.values(teacherGroups).map((g: any) => ({
        name: g.name,
        completion: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
      }));
    } else if (selectedGrade && selectedGrade !== "all") {
      const subjectGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.subject_id]) {
          acc[d.subject_id] = { name: d.subject_name, completed: 0, total: 0 };
        }
        acc[d.subject_id].total++;
        if (d.is_completed) acc[d.subject_id].completed++;
        return acc;
      }, {});
      return Object.values(subjectGroups).map((g: any) => ({
        name: g.name,
        completion: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
      }));
    } else {
      const gradeGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.grade_id]) {
          acc[d.grade_id] = { name: d.grade_name, completed: 0, total: 0 };
        }
        acc[d.grade_id].total++;
        if (d.is_completed) acc[d.grade_id].completed++;
        return acc;
      }, {});
      return Object.values(gradeGroups).map((g: any) => ({
        name: g.name,
        completion: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
      }));
    }
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teacher Progress Analytics</h2>
        <p className="text-muted-foreground mt-2">Track chapter completion across the organization</p>
      </div>

      <FilterBar
        mode="teacher"
        schools={schools.map(s => ({ id: s.id, name: s.name }))}
        grades={filteredGrades.map(g => ({ id: g.id, name: g.name }))}
        subjects={filteredSubjects.map(s => ({ id: s.id, name: s.name }))}
        teachers={filteredTeachers.map(t => ({ id: t.id, name: t.full_name }))}
        selectedSchool={selectedSchool}
        selectedGrade={selectedGrade}
        selectedSubject={selectedSubject}
        selectedTeacher={selectedTeacher}
        onSchoolChange={(v) => {
          setSelectedSchool(v === "all" ? null : v);
          setSelectedGrade(null);
          setSelectedSubject(null);
          setSelectedTeacher(null);
        }}
        onGradeChange={(v) => {
          setSelectedGrade(v === "all" ? null : v);
          setSelectedSubject(null);
          setSelectedTeacher(null);
        }}
        onSubjectChange={(v) => {
          setSelectedSubject(v === "all" ? null : v);
          setSelectedTeacher(null);
        }}
        onTeacherChange={(v) => setSelectedTeacher(v === "all" ? null : v)}
      />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricsCard
          title="Total Chapters"
          value={totalChapters}
          description="Across selected filters"
          icon={BookOpen}
        />
        <MetricsCard
          title="Completed"
          value={completedChapters}
          description={`${avgCompletionRate}% completion rate`}
          icon={CheckCircle2}
        />
        <MetricsCard
          title="In Progress"
          value={inProgressChapters}
          description="Currently being taught"
          icon={Clock}
        />
        <MetricsCard
          title="Not Started"
          value={notStartedChapters}
          description="Yet to begin"
          icon={TrendingUp}
        />
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Overview</CardTitle>
          <CardDescription>Chapter completion percentage by selected level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter-Level Progress</CardTitle>
          <CardDescription>Detailed breakdown of all chapters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No data available for selected filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, idx) => {
                  const progressPercent = item.total_slides > 0 
                    ? Math.round((item.completed_slides / item.total_slides) * 100) 
                    : 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell>{item.school_name}</TableCell>
                      <TableCell>{item.grade_name}</TableCell>
                      <TableCell>{item.subject_name}</TableCell>
                      <TableCell>{item.teacher_name}</TableCell>
                      <TableCell>{item.chapter_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercent} className="w-[100px]" />
                          <span className="text-xs">{progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.is_completed 
                            ? "bg-green-100 text-green-800" 
                            : item.completed_slides > 0 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {item.is_completed ? "Completed" : item.completed_slides > 0 ? "In Progress" : "Not Started"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
