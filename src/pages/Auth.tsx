import { useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const getErrorMessage = (error: AuthError) => {
  if (AuthApiError.isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'user_not_found':
        return 'No user found with these credentials.';
      case 'email_not_confirmed':
        return 'Please verify your email address before signing in.';
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/");
      }
      if (event === 'SIGNED_OUT') {
        setErrorMessage("");
      }
      if (event === 'USER_ERROR') {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setErrorMessage(getErrorMessage(error));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthError = async () => {
    const { error } = await supabase.auth.getSession();
    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMessage}
          </div>
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
          onError={handleAuthError}
        />
      </div>
    </div>
  );
};

export default Auth;