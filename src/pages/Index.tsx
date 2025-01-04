import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <UserMenu user={user} />
        </div>
      </header>
      <main className="flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Welcome to Your New Project
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Start building something amazing with React, Tailwind CSS, and modern web technologies.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="default"
              size="lg"
              className="font-medium"
              onClick={() => window.open("https://docs.lovable.dev", "_blank")}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-medium"
              onClick={() => window.open("https://github.com/your-username/your-project", "_blank")}
            >
              View Source
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;