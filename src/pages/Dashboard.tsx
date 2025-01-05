import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleNewAction = () => {
    toast({
      title: "Coming soon",
      description: "This feature is under development.",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Start New Action</h2>
          <p className="text-muted-foreground mb-4">
            Begin a new action and explore possibilities.
          </p>
          <Button onClick={handleNewAction} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            New Action
          </Button>
        </div>

        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground">
            Your recent activities will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;