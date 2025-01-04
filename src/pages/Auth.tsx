import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>
        <SupabaseAuth 
          supabaseClient={supabase} 
          appearance={{
            theme: 'light',
            style: {
              button: {
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
              },
              input: {
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Auth;