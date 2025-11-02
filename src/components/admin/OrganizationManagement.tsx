import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SchoolModal } from "./SchoolModal";
import { GradeModal } from "./GradeModal";
import { TeacherModal } from "./TeacherModal";
import { StudentModal } from "./StudentModal";
import { SubjectModal } from "./SubjectModal";
import { ChapterModal } from "./ChapterModal";
import { SlideUploadModal } from "./SlideUploadModal";
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

export function OrganizationManagement() {
  const [schools, setSchools] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [schoolModal, setSchoolModal] = useState<{ open: boolean; school: any }>({ open: false, school: null });
  const [gradeModal, setGradeModal] = useState<{ open: boolean; grade: any }>({ open: false, grade: null });
  const [teacherModal, setTeacherModal] = useState<{ open: boolean; teacher: any }>({ open: false, teacher: null });
  const [studentModal, setStudentModal] = useState<{ open: boolean; student: any }>({ open: false, student: null });
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject: any }>({ open: false, subject: null });
  const [chapterModal, setChapterModal] = useState<{ open: boolean; chapter: any }>({ open: false, chapter: null });
  const [slideUploadModal, setSlideUploadModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; filePath?: string }>({ open: false, type: "", id: "" });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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

    const { data: slidesData } = await supabase.from("chapter_slides").select("*, chapters(title, subjects(name))");
    setSlides(slidesData || []);

    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      const { type, id, filePath } = deleteDialog;
      let error;
      
      if (type === "teacher" || type === "student") {
        const response = await supabase.functions.invoke('delete-user', {
          body: { user_id: id },
        });
        
        if (response.error) throw new Error(response.error.message || 'Failed to delete user');
      } else if (type === "school") {
        ({ error } = await supabase.from("schools").delete().eq("id", id));
        if (error) throw error;
      } else if (type === "grade") {
        ({ error } = await supabase.from("grades").delete().eq("id", id));
        if (error) throw error;
      } else if (type === "subject") {
        ({ error } = await supabase.from("subjects").delete().eq("id", id));
        if (error) throw error;
      } else if (type === "chapter") {
        ({ error } = await supabase.from("chapters").delete().eq("id", id));
        if (error) throw error;
      } else if (type === "slide") {
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('chapter-slides')
            .remove([filePath]);
          if (storageError) console.error("Storage delete error:", storageError);
        }
        
        ({ error } = await supabase.from("chapter_slides").delete().eq("id", id));
        if (error) throw error;
      }
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      fetchData();
      setDeleteDialog({ open: false, type: "", id: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organization Management</h2>
        <p className="text-muted-foreground mt-2">Manage schools, users, content, and more</p>
      </div>

      <Tabs defaultValue="schools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="slides">Slides</TabsTrigger>
        </TabsList>

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
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.roll_number || "-"}</TableCell>
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
                      <TableCell>{subject.teachers?.full_name || "-"}</TableCell>
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

        <TabsContent value="slides">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Slides</CardTitle>
                <Button onClick={() => setSlideUploadModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Upload Slide
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Slide #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide) => (
                    <TableRow key={slide.id}>
                      <TableCell className="font-medium">{slide.chapters?.title || "-"}</TableCell>
                      <TableCell>{slide.slide_number}</TableCell>
                      <TableCell>
                        {slide.content_type === 'pdf' && '📄 PDF'}
                        {slide.content_type === 'image' && '🖼️ Image'}
                        {slide.content_type === 'video' && '🎥 Video'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{slide.file_path}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => setDeleteDialog({ open: true, type: "slide", id: slide.id, filePath: slide.file_path })}
                        >
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

      <SchoolModal {...schoolModal} onClose={() => setSchoolModal({ open: false, school: null })} onSuccess={fetchData} />
      <GradeModal {...gradeModal} onClose={() => setGradeModal({ open: false, grade: null })} onSuccess={fetchData} />
      <TeacherModal {...teacherModal} onClose={() => setTeacherModal({ open: false, teacher: null })} onSuccess={fetchData} />
      <StudentModal {...studentModal} onClose={() => setStudentModal({ open: false, student: null })} onSuccess={fetchData} />
      <SubjectModal {...subjectModal} onClose={() => setSubjectModal({ open: false, subject: null })} onSuccess={fetchData} />
      <ChapterModal {...chapterModal} onClose={() => setChapterModal({ open: false, chapter: null })} onSuccess={fetchData} />
      <SlideUploadModal open={slideUploadModal} onClose={() => setSlideUploadModal(false)} onSuccess={fetchData} />

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
    </div>
  );
}
