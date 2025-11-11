import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";

const MakeAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const makeAdmin = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "admin",
        });

      if (error) throw error;

      toast.success("You are now an admin!");
      setIsAdmin(true);
      setTimeout(() => navigate("/admin"), 1500);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.info("You are already an admin!");
        setIsAdmin(true);
      } else {
        toast.error("Failed to grant admin access");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Access</h1>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            {isAdmin
              ? "You already have admin access!"
              : "Click the button below to grant yourself admin access."}
          </p>

          {user && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Current User:</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          {isAdmin ? (
            <Button className="w-full" onClick={() => navigate("/admin")}>
              Go to Admin Dashboard
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={makeAdmin}
              disabled={loading}
            >
              {loading ? "Granting Access..." : "Make Me Admin"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MakeAdmin;
