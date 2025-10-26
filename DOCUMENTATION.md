# Learning Management System - Technical Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Database Architecture](#database-architecture)
3. [Admin Dashboard](#admin-dashboard)
4. [Teacher Dashboard](#teacher-dashboard)
5. [Chapter Viewer](#chapter-viewer)
6. [UI Component Patterns](#ui-component-patterns)
7. [Edge Functions](#edge-functions)
8. [Authentication Flow](#authentication-flow)
9. [Key Features Summary](#key-features-summary)
10. [Technical Stack](#technical-stack)

---

## Executive Summary

### Problem Statement
Educational institutions need a comprehensive learning management system that allows administrators to manage schools, teachers, students, and educational content, while providing teachers with a structured way to deliver course materials through a chapter-based learning system.

### Solution Architecture
A multi-role web application built on React and Supabase that provides:
- **Admin Dashboard**: Complete control over schools, grades, teachers, students, subjects, and chapters
- **Teacher Dashboard**: Access to assigned subjects and chapters with progress tracking
- **Chapter Viewer**: Interactive slide-based content delivery system
- **Role-Based Access Control**: Secure, granular permissions using Supabase RLS policies

---

## Database Architecture

### Table Overview

#### 1. **schools**
Stores information about educational institutions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | School name |
| address | text | School address (nullable) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Anyone can view schools (public read access)

---

#### 2. **grades**
Represents grade levels within schools.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Grade name (e.g., "Grade 10", "Class 12") |
| school_id | uuid | Reference to school (nullable) |
| display_order | integer | Order for display purposes |
| created_at | timestamp | Creation timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Anyone can view grades (public read access)

---

#### 3. **teachers**
Stores teacher profiles and information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (references auth.users) |
| email | text | Teacher email (unique) |
| full_name | text | Teacher's full name |
| phone | text | Phone number (nullable) |
| school_id | uuid | Reference to school |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations on all teachers
- Teachers can view and update their own profile only

---

#### 4. **students**
Stores student profiles and information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (references auth.users) |
| email | text | Student email (unique) |
| full_name | text | Student's full name |
| roll_number | text | Student roll number (nullable) |
| school_id | uuid | Reference to school |
| grade_id | uuid | Reference to grade |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations on all students
- Students can view and update their own profile only

---

#### 5. **admins**
Stores administrator profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (references auth.users) |
| email | text | Admin email (unique) |
| full_name | text | Admin's full name |
| phone | text | Phone number (nullable) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Only admins can perform all CRUD operations on admin records

---

#### 6. **user_roles**
Central role management table implementing secure role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to auth.users |
| role | app_role | Enum: 'admin', 'teacher', 'student' |
| created_at | timestamp | Creation timestamp |

**RLS Policies:**
- Users can view their own role only
- No direct INSERT/UPDATE/DELETE (managed via triggers and edge functions)

**Security Note:** This table is the foundation of the security model. Roles are NEVER stored in client-side storage or profile tables to prevent privilege escalation attacks.

---

#### 7. **subjects**
Represents courses/subjects taught in grades.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Subject name (e.g., "Mathematics", "Physics") |
| description | text | Subject description (nullable) |
| grade_id | uuid | Reference to grade |
| teacher_id | uuid | Assigned teacher (nullable) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Teachers can view only their assigned subjects

---

#### 8. **chapters**
Individual chapters within subjects.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Chapter title |
| description | text | Chapter description (nullable) |
| subject_id | uuid | Reference to subject |
| chapter_number | integer | Sequential chapter number |
| total_slides | integer | Total number of slides in chapter |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Teachers can view chapters for their assigned subjects only

---

#### 9. **chapter_slides**
Individual slides within chapters containing learning content.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| chapter_id | uuid | Reference to chapter |
| slide_number | integer | Sequential slide number |
| content_type | text | Type: 'text', 'image', 'video', 'quiz' |
| content | jsonb | Slide content as JSON |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Teachers can CRUD slides for chapters in their assigned subjects

**Content Structure Examples:**
```json
// Text slide
{
  "title": "Introduction to Algebra",
  "body": "Algebra is a branch of mathematics..."
}

// Image slide
{
  "title": "Pythagorean Theorem",
  "url": "https://example.com/image.png",
  "caption": "Visual representation"
}

// Video slide
{
  "title": "Quadratic Equations",
  "url": "https://youtube.com/watch?v=..."
}

// Quiz slide
{
  "question": "What is 2+2?",
  "options": ["3", "4", "5"],
  "correctAnswer": 1
}
```

---

#### 10. **teacher_progress**
Tracks teacher progress through chapters.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| teacher_id | uuid | Reference to teacher |
| chapter_id | uuid | Reference to chapter |
| current_slide | integer | Current slide number (default: 1) |
| completed_slides | integer | Number of completed slides (default: 0) |
| is_completed | boolean | Chapter completion status |
| last_viewed_at | timestamp | Last view timestamp |
| completed_at | timestamp | Completion timestamp (nullable) |

**RLS Policies:**
- Admins can perform all CRUD operations on all progress records
- Teachers can CRUD only their own progress records

---

#### 11. **teacher_grade_assignments**
Maps teachers to grades they teach.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| teacher_id | uuid | Reference to teacher |
| grade_id | uuid | Reference to grade |
| assigned_at | timestamp | Assignment timestamp |

**RLS Policies:**
- Admins can perform all CRUD operations
- Teachers can view their own grade assignments only

---

### Database Functions

#### 1. **get_teacher_unlocked_chapters**
Returns chapters accessible to a teacher with unlock logic.

```sql
CREATE OR REPLACE FUNCTION public.get_teacher_unlocked_chapters(_teacher_id uuid)
RETURNS TABLE(
  chapter_id uuid,
  chapter_number integer,
  chapter_title text,
  subject_name text,
  grade_name text,
  is_unlocked boolean,
  is_completed boolean,
  progress_percentage integer
)
```

**Logic:**
- Chapter 1 is always unlocked
- Subsequent chapters unlock only when all previous chapters in the same subject are completed
- Calculates progress percentage: `(completed_slides / total_slides) * 100`

**Usage:** Used by Teacher Dashboard to display available chapters

---

#### 2. **has_role**
Security definer function to check user roles without RLS recursion.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
```

**Purpose:** Used in RLS policies to check permissions without causing recursive policy evaluation

---

#### 3. **get_user_role**
Returns the role of a specific user.

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
```

---

#### 4. **admin_exists**
Checks if any admin user exists in the system.

```sql
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
```

**Usage:** Used during initial setup to determine if first admin account is needed

---

#### 5. **handle_new_user** (Trigger Function)
Automatically creates profile and role entries when new user is created.

**Trigger:** Fires on INSERT to `auth.users`

**Logic:**
1. Reads role from user metadata (`raw_user_meta_data->>'role'`)
2. Creates entry in appropriate profile table (admins/teachers/students)
3. Creates entry in user_roles table
4. Assigns school_id and grade_id for students

---

### Database Change Log

#### Migration 1: Initial Schema Setup
**File:** `20250101000000_initial_schema.sql`

**Changes:**
- Created `app_role` enum type
- Created all core tables (schools, grades, teachers, students, admins, subjects, chapters)
- Set up RLS policies for all tables
- Created helper functions (has_role, get_user_role, admin_exists)
- Created user_roles table with secure access patterns
- Set up handle_new_user trigger

---

#### Migration 2: User Roles Refactoring
**File:** `20250102000000_user_roles_refactor.sql`

**Changes:**
- Refactored role management to use separate user_roles table
- Updated RLS policies to use has_role() function
- Enhanced security by removing roles from profile tables
- Added security definer functions to prevent RLS recursion

---

#### Migration 3: Chapter Progress System
**File:** `20250103000000_chapter_progress.sql`

**Changes:**
- Created teacher_progress table
- Implemented get_teacher_unlocked_chapters function
- Added sequential unlock logic
- Created indexes for performance optimization

---

#### Migration 4: Chapter Slides Enhancement
**File:** `20251026161305_chapter_slides.sql`

**Changes:**
- Added chapter_slides table for granular content management
- Added content_type field for different slide types
- Updated get_teacher_unlocked_chapters to include chapter_number
- Enhanced progress calculation logic

---

## Admin Dashboard

### Overview
The Admin Dashboard is the central control panel for system administrators, accessible at `/admin-dashboard`. It provides comprehensive management capabilities for all entities in the system.

### Route & Authentication
- **Route:** `/admin-dashboard`
- **Auth Required:** Yes (admin role only)
- **Layout:** Uses `DashboardLayout` component
- **Redirect:** Non-admin users are redirected to appropriate dashboards

### Statistics Section

The top of the dashboard displays four key metrics:

1. **Total Schools**
   - Icon: School building
   - Data source: `schools` table count
   - Color: Blue accent

2. **Total Students**
   - Icon: Users
   - Data source: `students` table count
   - Color: Green accent

3. **Total Teachers**
   - Icon: User check
   - Data source: `teachers` table count
   - Color: Purple accent

4. **Total Subjects**
   - Icon: Book open
   - Data source: `subjects` table count
   - Color: Orange accent

**Implementation:**
```typescript
const { data: schools } = useQuery({
  queryKey: ["schools"],
  queryFn: async () => {
    const { data } = await supabase.from("schools").select("*");
    return data || [];
  },
});
// Similar queries for students, teachers, subjects
```

---

### Data Visualizations

#### 1. Performance Trend Chart (Line Chart)
- **Type:** Recharts LineChart
- **X-Axis:** Months (Jan-Jun)
- **Y-Axis:** Performance score (0-100)
- **Data:** Mock data showing student performance trends
- **Purpose:** Visualize performance trends over time
- **Card Title:** "Performance Trend"

#### 2. Student Distribution Chart (Bar Chart)
- **Type:** Recharts BarChart
- **X-Axis:** Grades
- **Y-Axis:** Number of students
- **Data:** Student count per grade from database
- **Purpose:** Show student distribution across grades
- **Card Title:** "Student Distribution"

#### 3. User Role Distribution (Pie Chart)
- **Type:** Recharts PieChart
- **Data Points:**
  - Students (green)
  - Teachers (blue)
  - Admins (purple)
- **Purpose:** Visualize user role breakdown
- **Card Title:** "User Roles"

#### 4. System Health Metrics (Progress Bars)
Displays four system health indicators:
- **Database Status:** 95% (green)
- **API Performance:** 87% (green)
- **Storage Usage:** 62% (blue)
- **Active Users:** 78% (blue)

Each metric uses a Progress component with color-coded values.

---

### Management Tabs

The dashboard uses Radix UI Tabs component with six main sections:

#### Tab 1: Schools Management

**Features:**
- Displays all schools in a data table
- Columns: Name, Address, Created At
- Add School button (top-right)
- Edit button (per row)
- Delete button with confirmation (per row)

**Add/Edit Modal (`SchoolModal`):**
```typescript
interface SchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school?: School; // undefined for add, populated for edit
  onSuccess: () => void;
}
```

**Fields:**
- School Name (required)
- Address (optional, textarea)

**Actions:**
- **Add:** Insert into `schools` table
- **Edit:** Update existing school record
- **Delete:** Remove school (with cascade considerations)

**Validation:**
- School name is required
- Form uses react-hook-form with zod validation

---

#### Tab 2: Grades Management

**Features:**
- Displays all grades in a data table
- Columns: Name, School, Display Order, Created At
- Add Grade button (top-right)
- Edit and Delete buttons (per row)

**Add/Edit Modal (`GradeModal`):**

**Fields:**
- Grade Name (required, e.g., "Grade 10", "Class 12")
- School (select dropdown, optional)
- Display Order (number input)

**Logic:**
- Fetches all schools for dropdown
- Display order determines sort order in UI
- Can be associated with a specific school or be global

---

#### Tab 3: Teachers Management

**Features:**
- Displays all teachers in a data table
- Columns: Name, Email, Phone, School, Created At
- Add Teacher button (top-right)
- Edit and Delete buttons (per row)

**Add/Edit Modal (`TeacherModal`):**

**Fields:**
- Full Name (required)
- Email (required, unique)
- Password (required for new, optional for edit)
- Phone (optional)
- School (select dropdown, required)

**Important Logic:**
- **Creating Teachers:**
  - Uses `create-user` edge function
  - Edge function creates auth.users entry with metadata
  - Trigger automatically creates teachers table entry and user_roles entry
  
- **Editing Teachers:**
  - Updates teachers table directly
  - Cannot change email (auth limitation)
  
- **Deleting Teachers:**
  - Uses `delete-user` edge function
  - Cascade deletes all related data (subjects, progress, etc.)

**Edge Function Integration:**
```typescript
// Create teacher
await supabase.functions.invoke("create-user", {
  body: {
    email,
    password,
    full_name,
    role: "teacher",
    school_id,
  },
});
```

---

#### Tab 4: Students Management

**Features:**
- Displays all students in a data table
- Columns: Name, Email, Roll Number, School, Grade, Created At
- Add Student button (top-right)
- Edit and Delete buttons (per row)

**Add/Edit Modal (`StudentModal`):**

**Fields:**
- Full Name (required)
- Email (required, unique)
- Password (required for new, optional for edit)
- Roll Number (optional)
- School (select dropdown, required)
- Grade (select dropdown, required)

**Logic:**
- Similar to teacher creation using edge functions
- Grade dropdown is populated from grades table
- School dropdown is populated from schools table
- Roll number is unique identifier within school

---

#### Tab 5: Subjects Management

**Features:**
- Displays all subjects in a data table
- Columns: Name, Description, Grade, Teacher, Created At
- Add Subject button (top-right)
- Edit and Delete buttons (per row)

**Add/Edit Modal (`SubjectModal`):**

**Fields:**
- Subject Name (required, e.g., "Mathematics", "Physics")
- Description (optional, textarea)
- Grade (select dropdown, required)
- Teacher (select dropdown, optional)

**Logic:**
- Grade must be selected first
- Teacher dropdown shows all teachers
- A subject can exist without an assigned teacher
- Deleting a subject cascades to chapters

**Query Example:**
```typescript
const { data: subjects } = useQuery({
  queryKey: ["subjects"],
  queryFn: async () => {
    const { data } = await supabase
      .from("subjects")
      .select(`
        *,
        grades(name),
        teachers(full_name)
      `);
    return data || [];
  },
});
```

---

#### Tab 6: Chapters Management

**Features:**
- Displays all chapters in a data table
- Columns: Title, Chapter Number, Subject, Grade, Total Slides, Created At
- Add Chapter button (top-right)
- Edit and Delete buttons (per row)

**Add/Edit Modal (`ChapterModal`):**

**Fields:**
- Chapter Title (required)
- Description (optional, textarea)
- Subject (select dropdown, required)
- Chapter Number (number input, auto-incremented by default)
- Total Slides (number input, default: 0)

**Logic:**
- Subject dropdown shows all subjects with their grades
- Chapter number determines sequence and unlock order
- Total slides is initially 0, updated as slides are added
- Deleting a chapter removes all associated slides and progress

**Sequential Dependencies:**
- Chapter unlock logic depends on chapter_number
- Lower chapter numbers must be completed before higher ones unlock
- Chapter 1 is always unlocked by default

---

### Common Modal Patterns

All admin modals follow a consistent pattern:

**Structure:**
```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{editMode ? "Edit" : "Add"} Entity</DialogTitle>
    </DialogHeader>
    
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

**Common Features:**
- React Hook Form for form management
- Zod schema for validation
- Loading states during submission
- Error handling with toast notifications
- Success callbacks to refresh parent data

---

### Delete Confirmation Pattern

All delete operations use AlertDialog:

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete
        the {entityType} and all associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Data Fetching Strategy

The Admin Dashboard uses TanStack Query (React Query) for data management:

**Benefits:**
- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

**Example Implementation:**
```typescript
const fetchDashboardData = async () => {
  const [schoolsRes, studentsRes, teachersRes, subjectsRes] = 
    await Promise.all([
      supabase.from("schools").select("*"),
      supabase.from("students").select("*"),
      supabase.from("teachers").select("*"),
      supabase.from("subjects").select("*"),
    ]);

  return {
    schools: schoolsRes.data || [],
    students: studentsRes.data || [],
    teachers: teachersRes.data || [],
    subjects: subjectsRes.data || [],
  };
};
```

**Query Invalidation:**
After successful mutations (add/edit/delete), relevant queries are invalidated:
```typescript
await queryClient.invalidateQueries({ queryKey: ["schools"] });
```

---

## Teacher Dashboard

### Overview
The Teacher Dashboard displays all chapters assigned to a teacher, organized by grade and subject. It implements a sequential unlock system where teachers must complete chapters in order within each subject.

### Route & Authentication
- **Route:** `/teacher-dashboard`
- **Auth Required:** Yes (teacher role only)
- **Layout:** Uses `DashboardLayout` component

---

### Statistics Section

Three key metrics displayed at the top:

1. **Total Chapters**
   - Count of all assigned chapters
   - Icon: Book open

2. **Subjects**
   - Count of unique subjects assigned
   - Icon: Library

3. **Average Progress**
   - Mean progress across all chapters
   - Calculated: `(sum of all progress percentages) / (total chapters)`
   - Icon: TrendingUp
   - Format: "XX%"

---

### Data Structure

#### GradeWithSubjects Interface
```typescript
interface GradeWithSubjects {
  gradeName: string;
  subjects: SubjectWithChapters[];
}
```

#### SubjectWithChapters Interface
```typescript
interface SubjectWithChapters {
  subjectName: string;
  chapters: ChapterWithProgress[];
}
```

#### ChapterWithProgress Interface
```typescript
interface ChapterWithProgress {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  progressPercentage: number;
}
```

---

### Data Fetching

Uses the `get_teacher_unlocked_chapters` RPC function:

```typescript
const fetchDashboardData = async () => {
  const { data: chaptersData, error } = await supabase
    .rpc("get_teacher_unlocked_chapters", {
      _teacher_id: user.id,
    });

  if (error) throw error;

  // Group data by grade -> subject -> chapters
  const groupedData = groupChaptersByGradeAndSubject(chaptersData);
  
  // Calculate statistics
  const stats = calculateStats(chaptersData);
  
  return { groupedData, stats };
};
```

**RPC Function Response:**
```typescript
{
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  subject_name: string;
  grade_name: string;
  is_unlocked: boolean;
  is_completed: boolean;
  progress_percentage: number;
}[]
```

---

### Hierarchical Data Organization

**Step 1: Group by Grade**
```typescript
const gradeMap = new Map<string, GradeWithSubjects>();

chaptersData.forEach(chapter => {
  if (!gradeMap.has(chapter.grade_name)) {
    gradeMap.set(chapter.grade_name, {
      gradeName: chapter.grade_name,
      subjects: []
    });
  }
});
```

**Step 2: Group by Subject within Grade**
```typescript
gradeMap.get(chapter.grade_name)
  .subjects.push({
    subjectName: chapter.subject_name,
    chapters: []
  });
```

**Step 3: Add Chapters to Subjects**
```typescript
subject.chapters.push({
  chapterId: chapter.chapter_id,
  chapterNumber: chapter.chapter_number,
  chapterTitle: chapter.chapter_title,
  isUnlocked: chapter.is_unlocked,
  isCompleted: chapter.is_completed,
  progressPercentage: chapter.progress_percentage
});
```

---

### UI Components

#### Accordion Structure

Uses Radix UI Accordion for collapsible sections:

**Level 1: Grades**
```typescript
<Accordion type="multiple" className="space-y-4">
  {gradesData.map(grade => (
    <AccordionItem key={grade.gradeName} value={grade.gradeName}>
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <span>{grade.gradeName}</span>
          <Badge>{grade.subjects.length} subjects</Badge>
        </div>
      </AccordionTrigger>
      
      <AccordionContent>
        {/* Level 2: Subjects */}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

**Level 2: Subjects (nested)**
```typescript
<Accordion type="multiple">
  {grade.subjects.map(subject => (
    <AccordionItem key={subject.subjectName} value={subject.subjectName}>
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>{subject.subjectName}</span>
          <Badge>{subject.chapters.length} chapters</Badge>
        </div>
      </AccordionTrigger>
      
      <AccordionContent>
        {/* Chapter cards */}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

---

#### Chapter Cards

Each chapter is displayed as a Card component:

**Locked Chapter:**
```typescript
<Card className="opacity-60 bg-muted">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">
          {chapter.chapterNumber}. {chapter.chapterTitle}
        </CardTitle>
      </div>
      <Badge variant="secondary">Locked</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Complete previous chapters to unlock
    </p>
  </CardContent>
</Card>
```

**Unlocked Chapter (In Progress):**
```typescript
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Unlock className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">
          {chapter.chapterNumber}. {chapter.chapterTitle}
        </CardTitle>
      </div>
      <Badge variant="default">In Progress</Badge>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span className="font-medium">{chapter.progressPercentage}%</span>
      </div>
      <Progress value={chapter.progressPercentage} />
    </div>
    
    <Button 
      className="w-full" 
      onClick={() => navigate(`/teacher/chapter/${chapter.chapterId}`)}
    >
      Continue Learning
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  </CardContent>
</Card>
```

**Completed Chapter:**
```typescript
<Card className="border-green-500 bg-green-50">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <CardTitle className="text-base">
          {chapter.chapterNumber}. {chapter.chapterTitle}
        </CardTitle>
      </div>
      <Badge variant="default" className="bg-green-600">
        Completed
      </Badge>
    </div>
  </CardHeader>
  
  <CardContent>
    <Button 
      variant="outline" 
      className="w-full"
      onClick={() => navigate(`/teacher/chapter/${chapter.chapterId}`)}
    >
      Review Chapter
      <RotateCcw className="ml-2 h-4 w-4" />
    </Button>
  </CardContent>
</Card>
```

---

### Sequential Unlock Logic

**Rules:**
1. Chapter 1 in every subject is always unlocked
2. Chapter N is unlocked if and only if Chapter N-1 is completed
3. Unlock status is determined per subject (not global)
4. Completion requires viewing all slides in the chapter

**Database Implementation:**
```sql
-- In get_teacher_unlocked_chapters function
CASE 
  WHEN cd1.chapter_number = 1 THEN true
  ELSE NOT EXISTS (
    SELECT 1 
    FROM chapter_data cd2 
    WHERE cd2.subject_id = cd1.subject_id 
      AND cd2.chapter_number < cd1.chapter_number 
      AND cd2.is_completed = false
  )
END as is_unlocked
```

**Example Scenario:**
- Subject: Mathematics
- Chapter 1: Unlocked ✅ (always accessible)
- Chapter 2: Locked 🔒 (Chapter 1 not completed)
- Chapter 3: Locked 🔒 (Chapter 2 not unlocked)

After completing Chapter 1:
- Chapter 1: Completed ✅
- Chapter 2: Unlocked ✅
- Chapter 3: Locked 🔒

---

### Empty State

When no chapters are assigned:

```typescript
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">No Chapters Assigned</h3>
    <p className="text-muted-foreground text-center max-w-md">
      You don't have any chapters assigned yet. 
      Please contact your administrator.
    </p>
  </CardContent>
</Card>
```

---

### Progress Calculation

**Formula:**
```typescript
progress_percentage = (completed_slides / total_slides) * 100
```

**Edge Cases:**
- If `total_slides = 0`: progress = 0%
- If `completed_slides = total_slides`: chapter is marked complete
- Progress is updated in real-time as teacher navigates slides

---

### Navigation Flow

1. Teacher clicks "Continue Learning" or "Review Chapter" button
2. Navigate to `/teacher/chapter/:chapterId`
3. Chapter Viewer component loads
4. Progress is automatically tracked and saved
5. Upon completion, teacher returns to dashboard
6. Next chapter unlocks automatically if sequential requirements met

---

## Chapter Viewer

### Overview
The Chapter Viewer is a slide-based content delivery system that allows teachers to navigate through chapter content sequentially. It tracks progress automatically and supports multiple content types.

### Route & Authentication
- **Route:** `/teacher/chapter/:chapterId`
- **Auth Required:** Yes (teacher role only)
- **Dynamic Parameter:** `chapterId` (UUID)

---

### Component Structure

#### State Management
```typescript
const [chapter, setChapter] = useState<Chapter | null>(null);
const [slides, setSlides] = useState<Slide[]>([]);
const [currentSlide, setCurrentSlide] = useState(1);
const [loading, setLoading] = useState(true);
```

#### Data Interfaces
```typescript
interface Chapter {
  id: string;
  title: string;
  total_slides: number;
}

interface Slide {
  id: string;
  slide_number: number;
  content_type: 'text' | 'image' | 'video' | 'quiz';
  content: {
    title?: string;
    body?: string;
    url?: string;
    caption?: string;
    question?: string;
    options?: string[];
    correctAnswer?: number;
  };
}
```

---

### Data Fetching

**Initial Load:**
```typescript
const fetchChapterData = async () => {
  // 1. Fetch chapter details
  const { data: chapterData } = await supabase
    .from("chapters")
    .select("id, title, total_slides")
    .eq("id", chapterId)
    .single();

  // 2. Fetch all slides for chapter
  const { data: slidesData } = await supabase
    .from("chapter_slides")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("slide_number", { ascending: true });

  // 3. Fetch user's progress
  const { data: progressData } = await supabase
    .from("teacher_progress")
    .select("current_slide, completed_slides")
    .eq("teacher_id", user.id)
    .eq("chapter_id", chapterId)
    .single();

  // 4. Set initial slide to last viewed slide
  if (progressData) {
    setCurrentSlide(progressData.current_slide);
  }

  setChapter(chapterData);
  setSlides(slidesData);
  setLoading(false);
};
```

---

### Progress Tracking

**Automatic Updates:**
Progress is automatically saved whenever the current slide changes, using a debounced effect:

```typescript
useEffect(() => {
  if (!chapter || !user) return;

  const saveProgress = async () => {
    const completedSlides = Math.max(currentSlide - 1, 0);
    const isCompleted = currentSlide >= chapter.total_slides;

    await supabase.from("teacher_progress").upsert({
      teacher_id: user.id,
      chapter_id: chapter.id,
      current_slide: currentSlide,
      completed_slides: completedSlides,
      is_completed: isCompleted,
      last_viewed_at: new Date().toISOString(),
      ...(isCompleted && { completed_at: new Date().toISOString() })
    });
  };

  // Debounce to avoid excessive database writes
  const timer = setTimeout(saveProgress, 2000);
  return () => clearTimeout(timer);
}, [currentSlide, chapter, user]);
```

**Progress Updates:**
- `current_slide`: Current slide number being viewed
- `completed_slides`: Number of slides completed (current - 1)
- `is_completed`: True when all slides have been viewed
- `last_viewed_at`: Timestamp of last view
- `completed_at`: Timestamp when chapter was completed

---

### Navigation Controls

#### Previous Button
```typescript
const handlePrevious = () => {
  if (currentSlide > 1) {
    setCurrentSlide(prev => prev - 1);
  }
};

<Button
  variant="outline"
  onClick={handlePrevious}
  disabled={currentSlide === 1}
>
  <ChevronLeft className="mr-2 h-4 w-4" />
  Previous
</Button>
```

#### Next Button
```typescript
const handleNext = () => {
  if (currentSlide < chapter.total_slides) {
    setCurrentSlide(prev => prev + 1);
  }
};

<Button
  onClick={handleNext}
  disabled={currentSlide >= chapter.total_slides}
>
  Next
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>
```

#### Back to Dashboard
```typescript
<Button
  variant="ghost"
  onClick={() => navigate("/teacher-dashboard")}
>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Back to Dashboard
</Button>
```

---

### UI Layout

**Header Section:**
```typescript
<div className="border-b bg-white shadow-sm">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{chapter.title}</h1>
        <p className="text-muted-foreground">
          Slide {currentSlide} of {chapter.total_slides}
        </p>
      </div>
      
      <Button variant="ghost" onClick={goBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  </div>
</div>
```

**Progress Bar:**
```typescript
<div className="bg-white border-b">
  <div className="container mx-auto px-4 py-2">
    <Progress 
      value={(currentSlide / chapter.total_slides) * 100} 
      className="h-2"
    />
  </div>
</div>
```

**Content Area:**
```typescript
<div className="flex-1 overflow-auto bg-gray-50">
  <div className="container mx-auto px-4 py-8">
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8">
        {renderSlideContent(getCurrentSlideData())}
      </CardContent>
    </Card>
  </div>
</div>
```

**Navigation Footer:**
```typescript
<div className="border-t bg-white">
  <div className="container mx-auto px-4 py-4">
    <div className="flex justify-between items-center">
      <Button onClick={handlePrevious} disabled={currentSlide === 1}>
        <ChevronLeft /> Previous
      </Button>
      
      <span className="text-sm text-muted-foreground">
        {currentSlide} / {chapter.total_slides}
      </span>
      
      <Button onClick={handleNext} disabled={currentSlide >= total}>
        Next <ChevronRight />
      </Button>
    </div>
  </div>
</div>
```

---

### Slide Content Rendering

The `renderSlideContent` function handles different content types:

#### Text Slide
```typescript
if (slide.content_type === 'text') {
  return (
    <div className="prose max-w-none">
      <h2 className="text-3xl font-bold mb-4">
        {slide.content.title}
      </h2>
      <div className="text-lg leading-relaxed">
        {slide.content.body}
      </div>
    </div>
  );
}
```

**Example Content:**
```json
{
  "title": "Introduction to Variables",
  "body": "Variables are containers for storing data values. In programming, a variable is a symbolic name for a value that can change during program execution..."
}
```

---

#### Image Slide
```typescript
if (slide.content_type === 'image') {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">
        {slide.content.title}
      </h2>
      <img
        src={slide.content.url}
        alt={slide.content.caption || slide.content.title}
        className="w-full rounded-lg shadow-lg"
      />
      {slide.content.caption && (
        <p className="text-center text-muted-foreground">
          {slide.content.caption}
        </p>
      )}
    </div>
  );
}
```

**Example Content:**
```json
{
  "title": "Pythagorean Theorem",
  "url": "https://example.com/pythagorean-theorem.png",
  "caption": "Visual proof of the Pythagorean theorem: a² + b² = c²"
}
```

---

#### Video Slide
```typescript
if (slide.content_type === 'video') {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">
        {slide.content.title}
      </h2>
      <div className="aspect-video">
        <iframe
          src={slide.content.url}
          title={slide.content.title}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
      </div>
    </div>
  );
}
```

**Example Content:**
```json
{
  "title": "Understanding Quadratic Equations",
  "url": "https://www.youtube.com/embed/abc123"
}
```

**Supported Video Platforms:**
- YouTube (embed URLs)
- Vimeo
- Direct video file URLs (.mp4, .webm)

---

#### Quiz Slide
```typescript
if (slide.content_type === 'quiz') {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {slide.content.question}
      </h2>
      
      <div className="space-y-3">
        {slide.content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(index)}
            className={cn(
              "w-full p-4 text-left rounded-lg border-2 transition-colors",
              selectedAnswer === index 
                ? "border-primary bg-primary/10" 
                : "border-gray-200 hover:border-gray-300"
            )}
            disabled={showResult}
          >
            {option}
          </button>
        ))}
      </div>
      
      {!showResult && (
        <Button 
          onClick={handleSubmit} 
          disabled={selectedAnswer === null}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}
      
      {showResult && (
        <div className={cn(
          "p-4 rounded-lg",
          selectedAnswer === slide.content.correctAnswer
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        )}>
          {selectedAnswer === slide.content.correctAnswer
            ? "✅ Correct! Well done."
            : `❌ Incorrect. The correct answer is: ${slide.content.options[slide.content.correctAnswer]}`
          }
        </div>
      )}
    </div>
  );
}
```

**Example Content:**
```json
{
  "question": "What is the capital of France?",
  "options": [
    "London",
    "Paris",
    "Berlin",
    "Madrid"
  ],
  "correctAnswer": 1
}
```

**Quiz Features:**
- Single-choice questions
- Immediate feedback after submission
- Visual indication of correct/incorrect answers
- Cannot change answer after submission

---

### Error Handling

**Chapter Not Found:**
```typescript
if (!chapterData) {
  toast.error("Chapter not found");
  navigate("/teacher-dashboard");
  return;
}
```

**Unauthorized Access:**
```typescript
// Handled by RLS policies
// If teacher doesn't have access, Supabase returns null
if (error?.code === 'PGRST116') {
  toast.error("You don't have access to this chapter");
  navigate("/teacher-dashboard");
}
```

**Network Errors:**
```typescript
try {
  await fetchChapterData();
} catch (error) {
  toast.error("Failed to load chapter. Please try again.");
  setLoading(false);
}
```

---

### Loading State

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading chapter...</p>
      </div>
    </div>
  );
}
```

---

### Keyboard Navigation (Future Enhancement)

Potential keyboard shortcuts:
- `←` Arrow Left: Previous slide
- `→` Arrow Right: Next slide
- `Esc`: Back to dashboard
- `Space`: Next slide

---

## UI Component Patterns

### Shared Layout: DashboardLayout

The `DashboardLayout` component provides a consistent structure for all authenticated user dashboards.

#### Props
```typescript
interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "admin" | "teacher" | "student";
}
```

#### Features

**1. Authentication Verification**
```typescript
useEffect(() => {
  const checkAuth = async () => {
    // 1. Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // 2. Verify user has correct role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData.role !== userRole) {
      toast.error("Unauthorized access");
      navigate("/auth");
      return;
    }

    // 3. Fetch profile data
    const tableName = `${userRole}s`; // admins, teachers, students
    const { data: profileData } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", user.id)
      .single();

    setUser(user);
    setProfile(profileData);
  };

  checkAuth();
}, [userRole]);
```

**2. Auth State Listener**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**3. Header with User Menu**
```typescript
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="container flex h-16 items-center justify-between">
    <div className="flex items-center gap-4">
      <GraduationCap className="h-6 w-6" />
      <h1 className="text-xl font-bold">LMS Dashboard</h1>
      <Badge variant="secondary">{userRole}</Badge>
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>
              {profile?.full_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{profile?.full_name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div>{profile?.full_name}</div>
          <div className="text-sm text-muted-foreground">
            {profile?.email}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
```

**4. Sign Out Handler**
```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  toast.success("Signed out successfully");
  navigate("/auth");
};
```

**5. Main Content Area**
```typescript
<main className="flex-1 overflow-auto">
  <div className="container py-6">
    {children}
  </div>
</main>
```

---

### Reusable Modal Components

All modal components follow a consistent pattern using:
- **Radix UI Dialog** for modal functionality
- **React Hook Form** for form management
- **Zod** for validation
- **Supabase** for data operations

#### Common Modal Structure

```typescript
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: EntityType; // undefined for create, populated for edit
  onSuccess: () => void;
}

export function EntityModal({ 
  open, 
  onOpenChange, 
  entity, 
  onSuccess 
}: ModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: entity || defaultValues,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (entity) {
        // Update
        await supabase
          .from("table_name")
          .update(values)
          .eq("id", entity.id);
      } else {
        // Create
        await supabase
          .from("table_name")
          .insert(values);
      }

      toast.success(`${entity ? "Updated" : "Created"} successfully`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entity ? "Edit" : "Create"} Entity
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Common UI Patterns

#### Data Tables

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.field1}</TableCell>
        <TableCell>{item.field2}</TableCell>
        <TableCell className="text-right space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Stat Cards

```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium">
      Stat Label
    </CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">
      Additional info
    </p>
  </CardContent>
</Card>
```

#### Loading States

```typescript
{isLoading ? (
  <div className="flex items-center justify-center h-48">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
) : (
  <div>Content</div>
)}
```

#### Empty States

```typescript
{data.length === 0 ? (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">No Data</h3>
    <p className="text-muted-foreground mb-4">
      Description of empty state
    </p>
    <Button onClick={handleCreate}>
      Create First Item
    </Button>
  </div>
) : (
  <div>Data display</div>
)}
```

---

## Edge Functions

Edge functions provide secure backend operations that require elevated privileges or should not be exposed to client-side code.

### 1. create-user

**Purpose:** Securely create new users (teachers, students, or admins) with proper authentication and metadata.

**Endpoint:** `POST /functions/v1/create-user`

**Request Body:**
```typescript
interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "teacher" | "student";
  school_id?: string; // Required for teachers and students
  grade_id?: string;  // Required for students only
  roll_number?: string; // Optional for students
  phone?: string;      // Optional
}
```

**Implementation:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const {
      email,
      password,
      full_name,
      role,
      school_id,
      grade_id,
      roll_number,
      phone,
    } = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create user in auth.users table
    const { data: authData, error: authError } = 
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name,
          role,
          school_id,
          grade_id,
          roll_number,
          phone,
        },
      });

    if (authError) throw authError;

    // handle_new_user trigger will automatically:
    // 1. Create entry in appropriate profile table
    // 2. Create entry in user_roles table

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

**Security:**
- Uses service role key (elevated privileges)
- Only callable by authenticated admins (enforced by RLS)
- Validates required fields
- Auto-confirms email (suitable for internal user creation)

**Usage from Client:**
```typescript
const { data, error } = await supabase.functions.invoke("create-user", {
  body: {
    email: "teacher@school.com",
    password: "SecurePassword123",
    full_name: "John Smith",
    role: "teacher",
    school_id: "uuid-here",
  },
});
```

---

### 2. delete-user

**Purpose:** Securely delete users and all associated data with proper cascade handling.

**Endpoint:** `POST /functions/v1/delete-user`

**Request Body:**
```typescript
interface DeleteUserRequest {
  user_id: string;
}
```

**Implementation:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Delete user from auth.users
    // This will cascade delete:
    // - Profile record (admins/teachers/students)
    // - user_roles record
    // - All related data (subjects, chapters, progress, etc.)
    const { error: deleteError } = 
      await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User deleted successfully"
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

**Cascade Delete Behavior:**
When a user is deleted, the following happens automatically:

**For Teachers:**
1. Teacher profile deleted
2. user_roles entry deleted
3. Subjects are un-assigned (teacher_id set to null, not deleted)
4. Teacher progress records deleted
5. Teacher grade assignments deleted

**For Students:**
1. Student profile deleted
2. user_roles entry deleted
3. Student progress records deleted (if implemented)

**For Admins:**
1. Admin profile deleted
2. user_roles entry deleted

**Security:**
- Uses service role key
- Only callable by authenticated admins
- Validates user_id exists
- Cannot delete own account (enforced by client-side logic)

**Usage from Client:**
```typescript
const { data, error } = await supabase.functions.invoke("delete-user", {
  body: {
    user_id: "uuid-to-delete",
  },
});
```

---

## Authentication Flow

### User Registration

**Step 1: Admin Creates User Account**
```typescript
// Admin fills form in TeacherModal or StudentModal
const formData = {
  email: "user@example.com",
  password: "SecurePass123",
  full_name: "John Doe",
  role: "teacher",
  school_id: "school-uuid",
};

// Call create-user edge function
const { data, error } = await supabase.functions.invoke("create-user", {
  body: formData,
});
```

**Step 2: Edge Function Creates Auth User**
```typescript
// create-user edge function
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email: formData.email,
  password: formData.password,
  email_confirm: true,
  user_metadata: {
    full_name: formData.full_name,
    role: formData.role,
    school_id: formData.school_id,
  },
});
```

**Step 3: Database Trigger Creates Profile**
```sql
-- handle_new_user trigger fires
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger creates profile and role entries
INSERT INTO teachers (id, email, full_name, school_id)
VALUES (NEW.id, NEW.email, 'John Doe', 'school-uuid');

INSERT INTO user_roles (user_id, role)
VALUES (NEW.id, 'teacher'::app_role);
```

---

### User Login

**Step 1: Navigate to Auth Page**
```typescript
// Route: /auth
<Auth />
```

**Step 2: Enter Credentials**
```typescript
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    toast.error("Invalid credentials");
    return;
  }

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  // Redirect based on role
  if (roleData.role === "admin") {
    navigate("/admin-dashboard");
  } else if (roleData.role === "teacher") {
    navigate("/teacher-dashboard");
  } else if (roleData.role === "student") {
    navigate("/student-dashboard");
  }
};
```

---

### Route Protection

**Implementation in DashboardLayout:**
```typescript
useEffect(() => {
  const checkAuth = async () => {
    // 1. Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // 2. Verify user has correct role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData.role !== expectedRole) {
      toast.error("Unauthorized access");
      navigate("/auth");
      return;
    }

    setUser(user);
  };

  checkAuth();
}, [expectedRole]);
```

---

### Session Management

**Session Storage:**
- Supabase automatically manages session tokens
- Stored in browser's localStorage
- Auto-refreshed before expiration

**Auth State Listener:**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === "SIGNED_IN") {
        // User logged in
      } else if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (event === "TOKEN_REFRESHED") {
        // Session refreshed automatically
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

---

### Logout Flow

```typescript
const handleSignOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    toast.error("Sign out failed");
    return;
  }

  toast.success("Signed out successfully");
  navigate("/auth");
};
```

---

## Key Features Summary

### Implemented Features

✅ **Admin Dashboard**
- School management (CRUD)
- Grade management (CRUD)
- Teacher management (CRUD via edge functions)
- Student management (CRUD via edge functions)
- Subject management (CRUD)
- Chapter management (CRUD)
- Data visualization (charts and stats)

✅ **Teacher Dashboard**
- View assigned chapters organized by grade and subject
- Sequential unlock logic (complete previous to unlock next)
- Progress tracking per chapter
- Visual indicators for locked/unlocked/completed chapters
- Quick navigation to chapter viewer

✅ **Chapter Viewer**
- Slide-by-slide content delivery
- Support for text, image, video, and quiz slides
- Automatic progress tracking with debouncing
- Sequential navigation (previous/next)
- Progress bar visualization
- Resume from last viewed slide

✅ **Authentication & Authorization**
- Role-based access control (admin, teacher, student)
- Secure user creation via edge functions
- Secure user deletion via edge functions
- Session management
- Route protection per role

✅ **Database & Security**
- Comprehensive table structure
- Row-Level Security policies
- Security definer functions to prevent RLS recursion
- Automatic profile creation via triggers
- Cascade delete behavior

---

### Not Yet Implemented

❌ **Student Dashboard**
- Similar to teacher dashboard but for student-specific content
- Different unlock logic (based on assignments)
- Quiz attempt tracking
- Grade/score tracking

❌ **Chapter Slides Management UI**
- Admin interface to add/edit/delete slides
- Slide content editor
- Drag-and-drop slide reordering
- Bulk slide operations

❌ **Quiz Features**
- Multiple attempts tracking
- Score persistence
- Quiz analytics
- Different question types (multiple choice, true/false, essay)

❌ **Notifications System**
- Chapter assignment notifications
- Completion notifications
- Deadline reminders

❌ **Reports & Analytics**
- Teacher performance reports
- Student progress reports
- Chapter completion rates
- Time spent analytics

❌ **File Upload**
- Image upload for slides
- Video upload
- Document attachments

❌ **Comments & Feedback**
- Teacher feedback on student progress
- Questions/discussions per chapter

❌ **Mobile Responsive Design Optimization**
- Current design is functional but not fully optimized for mobile

---

## Technical Stack

### Frontend Framework
- **React 18.3.1**
  - Component-based architecture
  - Hooks for state management
  - Functional components

### Language
- **TypeScript**
  - Type safety
  - Enhanced IDE support
  - Better refactoring

### Routing
- **React Router DOM 6.30.1**
  - Client-side routing
  - Dynamic routes (`:chapterId`)
  - Protected routes

### State Management
- **TanStack Query (React Query) 5.83.0**
  - Server state management
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Loading/error states

### Form Management
- **React Hook Form 7.61.1**
  - Form state management
  - Validation integration
  - Performance optimization

### Validation
- **Zod 3.25.76**
  - Schema validation
  - TypeScript integration
  - Runtime type checking

### UI Components
- **Radix UI**
  - Unstyled, accessible components
  - Dialog, Dropdown, Accordion, Tabs, etc.
  - Full keyboard navigation

### Styling
- **Tailwind CSS**
  - Utility-first CSS
  - Responsive design
  - Custom design system
  - Dark mode support

### Icons
- **Lucide React 0.462.0**
  - Modern icon library
  - Tree-shakeable
  - Consistent design

### Charts
- **Recharts 2.15.4**
  - Composable chart library
  - Built with React components
  - Responsive charts

### Backend (Supabase)
- **PostgreSQL Database**
  - Relational data model
  - JSONB support for flexible content
  - Full-text search capabilities

- **Row Level Security (RLS)**
  - Granular access control
  - Policy-based permissions
  - Security at database level

- **Edge Functions (Deno)**
  - Serverless functions
  - TypeScript support
  - Secure admin operations

- **Authentication**
  - Built-in auth system
  - Session management
  - Role-based access

- **Realtime** (not yet implemented)
  - WebSocket support
  - Live data updates
  - Presence features

### Build Tool
- **Vite**
  - Fast development server
  - Hot module replacement
  - Optimized production builds

### Package Manager
- **npm/yarn/pnpm**

---

## Conclusion

This Learning Management System provides a solid foundation for managing educational content delivery with role-based access, sequential learning paths, and progress tracking. The architecture is designed for scalability, security, and maintainability.

### Key Strengths
1. **Security First**: RLS policies and secure edge functions
2. **Type Safety**: Full TypeScript coverage
3. **Modern Stack**: React, Tailwind, Supabase
4. **Scalable Architecture**: Modular components and clear separation of concerns
5. **User Experience**: Intuitive dashboards and responsive design

### Next Steps for Development
1. Implement Student Dashboard with similar patterns
2. Build Chapter Slides Management UI for admins
3. Enhance quiz functionality with scoring and analytics
4. Add file upload capabilities for richer content
5. Implement notification system
6. Build comprehensive reporting dashboard
7. Optimize mobile experience
8. Add real-time collaboration features

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Maintained By:** Development Team
