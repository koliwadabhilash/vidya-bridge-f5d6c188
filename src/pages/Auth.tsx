import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check which table the user belongs to
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (admin) {
          navigate("/admin-dashboard");
          return;
        }

        const { data: teacher } = await supabase
          .from("teachers")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (teacher) {
          navigate("/teacher-dashboard");
          return;
        }

        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (student) {
          navigate("/student-dashboard");
        }
      }
    };
    checkUser();
  }, [navigate]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Check which table the user belongs to
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();
        
        if (admin) {
          navigate("/admin-dashboard");
          return;
        }

        const { data: teacher } = await supabase
          .from("teachers")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();
        
        if (teacher) {
          navigate("/teacher-dashboard");
          return;
        }

        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();
        
        if (student) {
          navigate("/student-dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VidyaSetu
          </CardTitle>
          <CardDescription>Your Digital Learning Platform</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Empowering education across India
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
