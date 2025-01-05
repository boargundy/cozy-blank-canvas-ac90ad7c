import { useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>
        
        {errorMessage && (
          <p className="text-red-500 text-center mb-4">
            {errorMessage}
          </p>
        )}

        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: 'rgb(var(--primary))',
                color: 'white'
              },
              input: {
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
              },
              anchor: {
                color: 'rgb(var(--primary))'
              }
            },
          }}
          providers={[]}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Auth;