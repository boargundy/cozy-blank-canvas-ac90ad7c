import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_in");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome</h1>
        <div className="flex gap-4 justify-center mb-6">
          <Button 
            variant={view === "sign_in" ? "default" : "outline"}
            onClick={() => setView("sign_in")}
          >
            Sign In
          </Button>
          <Button 
            variant={view === "sign_up" ? "default" : "outline"}
            onClick={() => setView("sign_up")}
          >
            Sign Up
          </Button>
        </div>
        <SupabaseAuth 
          supabaseClient={supabase} 
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgb(var(--primary))',
                color: 'white',
              },
              input: {
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
              },
              anchor: {
                color: 'rgb(var(--primary))',
              },
            },
          }}
          providers={[]}
          view={view}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Auth;