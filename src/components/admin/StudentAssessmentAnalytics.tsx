import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "./FilterBar";
import { MetricsCard } from "./MetricsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Award, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssessmentData {
  school_id: string;
  school_name: string;
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_title: string;
  assessment_id: string;
  assessment_name: string;
  total_marks: number;
  pass_marks: number;
  student_id: string;
  marks_obtained: number;
}

export function StudentAssessmentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentData[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

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

    const { data: chaptersData } = await supabase.from("chapters").select("*");
    setChapters(chaptersData || []);

    // Fetch assessment data with all joins
    const { data: assessmentData } = await supabase
      .from("student_assessments")
      .select(`
        *,
        assessments (
          id,
          assessment_name,
          total_marks,
          pass_marks,
          chapters (
            id,
            title,
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
          )
        )
      `);

    const formattedData: AssessmentData[] = (assessmentData || []).map((item: any) => ({
      school_id: item.assessments?.chapters?.subjects?.grades?.schools?.id || "",
      school_name: item.assessments?.chapters?.subjects?.grades?.schools?.name || "N/A",
      grade_id: item.assessments?.chapters?.subjects?.grades?.id || "",
      grade_name: item.assessments?.chapters?.subjects?.grades?.name || "N/A",
      subject_id: item.assessments?.chapters?.subjects?.id || "",
      subject_name: item.assessments?.chapters?.subjects?.name || "N/A",
      chapter_id: item.assessments?.chapters?.id || "",
      chapter_title: item.assessments?.chapters?.title || "N/A",
      assessment_id: item.assessment_id,
      assessment_name: item.assessments?.assessment_name || "N/A",
      total_marks: item.assessments?.total_marks || 0,
      pass_marks: item.assessments?.pass_marks || 0,
      student_id: item.student_id,
      marks_obtained: item.marks_obtained,
    }));

    setAssessmentData(formattedData);
    setLoading(false);
  };

  // Filter data based on selections
  const filteredData = assessmentData.filter((item) => {
    if (selectedSchool && selectedSchool !== "all" && item.school_id !== selectedSchool) return false;
    if (selectedGrade && selectedGrade !== "all" && item.grade_id !== selectedGrade) return false;
    if (selectedSubject && selectedSubject !== "all" && item.subject_id !== selectedSubject) return false;
    if (selectedChapter && selectedChapter !== "all" && item.chapter_id !== selectedChapter) return false;
    return true;
  });

  // Filter cascading
  const filteredGrades = selectedSchool && selectedSchool !== "all" 
    ? grades.filter(g => g.school_id === selectedSchool)
    : grades;

  const filteredSubjects = selectedGrade && selectedGrade !== "all"
    ? subjects.filter(s => s.grade_id === selectedGrade)
    : subjects;

  const filteredChapters = selectedSubject && selectedSubject !== "all"
    ? chapters.filter(c => c.subject_id === selectedSubject)
    : chapters;

  // Calculate metrics
  const totalStudents = new Set(filteredData.map(d => d.student_id)).size;
  const passedStudents = filteredData.filter(d => d.marks_obtained >= d.pass_marks).length;
  const failedStudents = filteredData.length - passedStudents;
  const passRate = filteredData.length > 0 
    ? Math.round((passedStudents / filteredData.length) * 100) 
    : 0;
  const avgScore = filteredData.length > 0
    ? Math.round(filteredData.reduce((acc, d) => acc + d.marks_obtained, 0) / filteredData.length)
    : 0;

  // Pass/Fail pie chart data
  const pieData = [
    { name: "Passed", value: passedStudents, color: "hsl(142, 76%, 36%)" },
    { name: "Failed", value: failedStudents, color: "hsl(0, 84%, 60%)" },
  ];

  // Bar chart data by selected level
  const getBarChartData = () => {
    if (selectedChapter && selectedChapter !== "all") {
      const assessmentGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.assessment_id]) {
          acc[d.assessment_id] = { name: d.assessment_name, passed: 0, failed: 0 };
        }
        if (d.marks_obtained >= d.pass_marks) {
          acc[d.assessment_id].passed++;
        } else {
          acc[d.assessment_id].failed++;
        }
        return acc;
      }, {});
      return Object.values(assessmentGroups);
    } else if (selectedSubject && selectedSubject !== "all") {
      const chapterGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.chapter_id]) {
          acc[d.chapter_id] = { name: d.chapter_title, passed: 0, failed: 0 };
        }
        if (d.marks_obtained >= d.pass_marks) {
          acc[d.chapter_id].passed++;
        } else {
          acc[d.chapter_id].failed++;
        }
        return acc;
      }, {});
      return Object.values(chapterGroups);
    } else if (selectedGrade && selectedGrade !== "all") {
      const subjectGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.subject_id]) {
          acc[d.subject_id] = { name: d.subject_name, passed: 0, failed: 0 };
        }
        if (d.marks_obtained >= d.pass_marks) {
          acc[d.subject_id].passed++;
        } else {
          acc[d.subject_id].failed++;
        }
        return acc;
      }, {});
      return Object.values(subjectGroups);
    } else {
      const gradeGroups = filteredData.reduce((acc: any, d) => {
        if (!acc[d.grade_id]) {
          acc[d.grade_id] = { name: d.grade_name, passed: 0, failed: 0 };
        }
        if (d.marks_obtained >= d.pass_marks) {
          acc[d.grade_id].passed++;
        } else {
          acc[d.grade_id].failed++;
        }
        return acc;
      }, {});
      return Object.values(gradeGroups);
    }
  };

  const barChartData = getBarChartData();

  // Performance distribution histogram
  const scoreRanges = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];

  filteredData.forEach((d) => {
    const percentage = d.total_marks > 0 ? (d.marks_obtained / d.total_marks) * 100 : 0;
    if (percentage <= 20) scoreRanges[0].count++;
    else if (percentage <= 40) scoreRanges[1].count++;
    else if (percentage <= 60) scoreRanges[2].count++;
    else if (percentage <= 80) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

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
        <h2 className="text-3xl font-bold tracking-tight">Student Assessment Analytics</h2>
        <p className="text-muted-foreground mt-2">Track student performance and pass rates</p>
      </div>

      <FilterBar
        mode="assessment"
        schools={schools.map(s => ({ id: s.id, name: s.name }))}
        grades={filteredGrades.map(g => ({ id: g.id, name: g.name }))}
        subjects={filteredSubjects.map(s => ({ id: s.id, name: s.name }))}
        chapters={filteredChapters.map(c => ({ id: c.id, name: c.title }))}
        selectedSchool={selectedSchool}
        selectedGrade={selectedGrade}
        selectedSubject={selectedSubject}
        selectedChapter={selectedChapter}
        onSchoolChange={(v) => {
          setSelectedSchool(v === "all" ? null : v);
          setSelectedGrade(null);
          setSelectedSubject(null);
          setSelectedChapter(null);
        }}
        onGradeChange={(v) => {
          setSelectedGrade(v === "all" ? null : v);
          setSelectedSubject(null);
          setSelectedChapter(null);
        }}
        onSubjectChange={(v) => {
          setSelectedSubject(v === "all" ? null : v);
          setSelectedChapter(null);
        }}
        onChapterChange={(v) => setSelectedChapter(v === "all" ? null : v)}
      />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricsCard
          title="Pass Rate"
          value={`${passRate}%`}
          description={`${passedStudents} passed, ${failedStudents} failed`}
          icon={TrendingUp}
        />
        <MetricsCard
          title="Total Assessments"
          value={filteredData.length}
          description="Student submissions"
          icon={Award}
        />
        <MetricsCard
          title="Students Assessed"
          value={totalStudents}
          description="Unique students"
          icon={Users}
        />
        <MetricsCard
          title="Average Score"
          value={avgScore}
          description="Out of 100"
          icon={TrendingDown}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pass/Fail Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pass/Fail Distribution</CardTitle>
            <CardDescription>Overall performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {filteredData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance by Level */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>Pass/Fail breakdown by selected level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="passed" stackId="a" fill="hsl(142, 76%, 36%)" name="Passed" />
                    <Bar dataKey="failed" stackId="a" fill="hsl(0, 84%, 60%)" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>Number of students by score range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRanges}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Comprehensive breakdown of all assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Avg Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(
                filteredData.reduce((acc: any, item) => {
                  const key = `${item.school_id}-${item.grade_id}-${item.subject_id}-${item.chapter_id}-${item.assessment_id}`;
                  if (!acc[key]) {
                    acc[key] = {
                      school_name: item.school_name,
                      grade_name: item.grade_name,
                      subject_name: item.subject_name,
                      chapter_title: item.chapter_title,
                      assessment_name: item.assessment_name,
                      submissions: 0,
                      passed: 0,
                      totalMarks: 0,
                    };
                  }
                  acc[key].submissions++;
                  if (item.marks_obtained >= item.pass_marks) acc[key].passed++;
                  acc[key].totalMarks += item.marks_obtained;
                  return acc;
                }, {})
              ).map(([key, data]: [string, any]) => {
                const passRate = data.submissions > 0 ? Math.round((data.passed / data.submissions) * 100) : 0;
                const avgScore = data.submissions > 0 ? Math.round(data.totalMarks / data.submissions) : 0;
                return (
                  <TableRow key={key}>
                    <TableCell>{data.school_name}</TableCell>
                    <TableCell>{data.grade_name}</TableCell>
                    <TableCell>{data.subject_name}</TableCell>
                    <TableCell>{data.chapter_title}</TableCell>
                    <TableCell>{data.assessment_name}</TableCell>
                    <TableCell>{data.submissions}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${passRate >= 75 ? "text-green-600" : passRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {passRate}%
                      </span>
                    </TableCell>
                    <TableCell>{avgScore}</TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No assessment data available for selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
