import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading || !user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-16 pb-28">
      <div className="max-w-sm mx-auto space-y-6">
        <h1 className="font-display text-3xl tracking-wider">ADMIN</h1>
        <p className="font-body text-sm text-muted-foreground">
          Internal area for testing new features.
        </p>
      </div>
    </div>
  );
};

export default Admin;
