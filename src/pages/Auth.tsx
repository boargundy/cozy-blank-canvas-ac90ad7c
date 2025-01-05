import { useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthError, AuthApiError } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getErrorMessage = (error: AuthError) => {
  if (error instanceof AuthApiError) {
    switch (error.status) {
      case 400:
        switch (error.code) {
          case 'invalid_credentials':
            return 'Invalid email or password. Please check your credentials and try again.';
          case 'email_not_confirmed':
            return 'Please verify your email address before signing in.';
          default:
            return error.message;
        }
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  }
  // Handle client-side auth errors
  switch (error.name) {
    case 'AuthSessionMissingError':
      return 'No active session found. Please sign in.';
    case 'AuthInvalidCredentialsError':
      return 'Invalid credentials provided.';
    default:
      return error.message;
  }
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
      if (event === 'USER_UPDATED') {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setErrorMessage(getErrorMessage(error));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
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
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in'
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password',
                button_label: 'Sign up',
                loading_button_label: 'Signing up...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: "Don't have an account? Sign up"
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Auth;