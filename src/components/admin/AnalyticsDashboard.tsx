import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherProgressAnalytics } from "./TeacherProgressAnalytics";
import { StudentAssessmentAnalytics } from "./StudentAssessmentAnalytics";

export function AnalyticsDashboard() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Tabs defaultValue="progress" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Monitor organizational performance and progress</p>
          </div>
          <TabsList>
            <TabsTrigger value="progress">Teacher Progress</TabsTrigger>
            <TabsTrigger value="assessments">Student Assessments</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="progress" className="space-y-6">
          <TeacherProgressAnalytics />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <StudentAssessmentAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
