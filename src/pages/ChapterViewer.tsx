import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFViewer } from "@/components/PDFViewer";

interface Slide {
  id: string;
  slide_number: number;
  content_type: string;
  file_path: string;
}

interface Chapter {
  id: string;
  title: string;
  total_slides: number;
}

export default function ChapterViewer() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      fetchChapterData();
    }
  }, [chapterId]);

  useEffect(() => {
    // Debounced progress update
    const timer = setTimeout(() => {
      updateProgress();
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const fetchChapterData = async () => {
    try {
      // Fetch chapter details
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("id, title, total_slides")
        .eq("id", chapterId)
        .single();

      if (chapterError) throw chapterError;
      setChapter(chapterData);

      // Fetch slides
      const { data: slidesData, error: slidesError } = await supabase
        .from("chapter_slides")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("slide_number", { ascending: true });

      if (slidesError) throw slidesError;
      setSlides(slidesData || []);

      // Fetch current progress
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progressData } = await supabase
          .from("teacher_progress")
          .select("current_slide")
          .eq("teacher_id", user.id)
          .eq("chapter_id", chapterId)
          .maybeSingle();

        if (progressData) {
          setCurrentSlide(progressData.current_slide);
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Error loading chapter", 
        description: error.message, 
        variant: "destructive" 
      });
      navigate("/teacher-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !chapter) return;

      const completedSlides = currentSlide;
      const isCompleted = currentSlide >= chapter.total_slides;

      const { error } = await supabase
        .from("teacher_progress")
        .upsert({
          teacher_id: user.id,
          chapter_id: chapterId,
          current_slide: currentSlide,
          completed_slides: completedSlides,
          is_completed: isCompleted,
          last_viewed_at: new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : null
        }, {
          onConflict: "teacher_id,chapter_id"
        });

      if (error) throw error;

      if (isCompleted) {
        toast({ 
          title: "Chapter Completed!", 
          description: "You've finished this chapter. Great job!" 
        });
      }
    } catch (error: any) {
      console.error("Error updating progress:", error);
    }
  };

  const handleNext = () => {
    if (currentSlide < (chapter?.total_slides || 0)) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const getCurrentSlideData = () => {
    return slides.find(s => s.slide_number === currentSlide);
  };

  const renderSlideContent = (slide: Slide | undefined) => {
    if (!slide) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Slide content not available</p>
        </div>
      );
    }

    // Generate public URL for the file
    const { data } = supabase.storage
      .from('chapter-slides')
      .getPublicUrl(slide.file_path);
    
    const fileUrl = data.publicUrl;

    switch (slide.content_type) {
      case 'pdf':
        return <PDFViewer fileUrl={fileUrl} />;
      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={fileUrl} 
              alt={`Slide ${slide.slide_number}`} 
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            <video 
              src={fileUrl} 
              controls 
              className="w-full rounded-lg"
            />
          </div>
        );
      default:
        return <p className="text-muted-foreground">Unknown content type</p>;
    }
  };

  if (loading) {
  return (
    <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

    return (
      <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/teacher-dashboard")}
              className="mb-2"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">{chapter?.title}</h1>
            <p className="text-muted-foreground">
              Slide {currentSlide} of {chapter?.total_slides}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ 
              width: `${((currentSlide / (chapter?.total_slides || 1)) * 100)}%` 
            }}
          />
        </div>

        {/* Slide Content */}
        <Card>
          <CardContent className="p-8 min-h-[400px]">
            {renderSlideContent(getCurrentSlideData())}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentSlide >= (chapter?.total_slides || 0)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
