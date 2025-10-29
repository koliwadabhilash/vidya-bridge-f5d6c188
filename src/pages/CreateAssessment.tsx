import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const formSchema = z.object({
  assessment_name: z.string().min(1, "Assessment name is required").max(100, "Name must be less than 100 characters"),
  total_marks: z.coerce.number().min(1, "Total marks must be at least 1").max(1000, "Total marks cannot exceed 1000"),
  pass_marks: z.coerce.number().min(0, "Pass marks cannot be negative"),
}).refine((data) => data.pass_marks <= data.total_marks, {
  message: "Pass marks cannot exceed total marks",
  path: ["pass_marks"],
});

type FormData = z.infer<typeof formSchema>;

const CreateAssessment = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [chapterInfo, setChapterInfo] = useState<{ title: string; subject_name: string; grade_name: string } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assessment_name: "",
      total_marks: 100,
      pass_marks: 40,
    },
  });

  useEffect(() => {
    fetchChapterInfo();
  }, [chapterId]);

  const fetchChapterInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select(`
          title,
          subjects (
            name,
            grades (
              name
            )
          )
        `)
        .eq("id", chapterId)
        .single();

      if (error) throw error;

      setChapterInfo({
        title: data.title,
        subject_name: data.subjects.name,
        grade_name: data.subjects.grades.name,
      });
    } catch (error) {
      console.error("Error fetching chapter info:", error);
      toast({
        title: "Error",
        description: "Failed to load chapter information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          chapter_id: chapterId,
          teacher_id: user.id,
          assessment_name: values.assessment_name,
          total_marks: values.total_marks,
          pass_marks: values.pass_marks,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment created successfully",
      });

      navigate(`/teacher/assessment/${assessment.id}`);
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/teacher-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Create Assessment</h1>
          {chapterInfo && (
            <p className="text-muted-foreground mt-2">
              {chapterInfo.grade_name} - {chapterInfo.subject_name} - {chapterInfo.title}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              Create a new assessment for this chapter. Students will be evaluated based on these criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="assessment_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chapter 1 Quiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pass_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pass Marks</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max={form.watch("total_marks")} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/teacher-dashboard")}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create & Continue"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateAssessment;
