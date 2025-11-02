import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  schools: FilterOption[];
  grades: FilterOption[];
  subjects: FilterOption[];
  teachers?: FilterOption[];
  chapters?: FilterOption[];
  selectedSchool: string | null;
  selectedGrade: string | null;
  selectedSubject: string | null;
  selectedTeacher?: string | null;
  selectedChapter?: string | null;
  onSchoolChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTeacherChange?: (value: string) => void;
  onChapterChange?: (value: string) => void;
  mode: "teacher" | "assessment";
}

export function FilterBar({
  schools,
  grades,
  subjects,
  teachers,
  chapters,
  selectedSchool,
  selectedGrade,
  selectedSubject,
  selectedTeacher,
  selectedChapter,
  onSchoolChange,
  onGradeChange,
  onSubjectChange,
  onTeacherChange,
  onChapterChange,
  mode,
}: FilterBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <Select value={selectedSchool || "all"} onValueChange={onSchoolChange}>
        <SelectTrigger>
          <SelectValue placeholder="All Schools" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Schools</SelectItem>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedGrade || "all"} onValueChange={onGradeChange} disabled={!selectedSchool}>
        <SelectTrigger>
          <SelectValue placeholder="All Grades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grades</SelectItem>
          {grades.map((grade) => (
            <SelectItem key={grade.id} value={grade.id}>
              {grade.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedSubject || "all"} onValueChange={onSubjectChange} disabled={!selectedGrade}>
        <SelectTrigger>
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.id}>
              {subject.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mode === "teacher" && teachers && onTeacherChange && (
        <Select value={selectedTeacher || "all"} onValueChange={onTeacherChange} disabled={!selectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="All Teachers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {mode === "assessment" && chapters && onChapterChange && (
        <Select value={selectedChapter || "all"} onValueChange={onChapterChange} disabled={!selectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chapters.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
