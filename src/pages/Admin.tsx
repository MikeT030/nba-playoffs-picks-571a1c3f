import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Shield, ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import AdminSeriesConfirmPanel from "@/components/AdminSeriesConfirmPanel";
import DemoAllMatchupsInnovation from "@/components/DemoAllMatchupsInnovation";
import DemoAdvancedRoundView from "@/components/DemoAdvancedRoundView";
import DemoMatchCard from "@/components/DemoMatchCard";
import DemoMatchCardColored from "@/components/DemoMatchCardColored";
import DemoMatchDetailDialog from "@/components/DemoMatchDetailDialog";
import DemoMatchCardFonts from "@/components/DemoMatchCardFonts";
import DemoBracketPlayedOut from "@/components/DemoBracketPlayedOut";
import DemoAllPicksTable from "@/components/DemoAllPicksTable";
import DemoVisualScoreboard from "@/components/DemoVisualScoreboard";
import { DemoFlyerCardV3, DemoFlyerCardPaxson, DemoFlyerCardDavis, DemoFlyerCardMiller } from "@/components/DemoFlyerCardVariants";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    const { data, error } = await supabase.functions.invoke("admin-roles", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Failed to load admins");
      setAdmins([]);
    } else {
      setAdmins(data.admins ?? []);
    }
    setLoadingAdmins(false);
  }, []);

  useEffect(() => {
    if (user && isAdmin) fetchAdmins();
  }, [user, isAdmin, fetchAdmins]);

  const handleRemove = async (admin: AdminUser) => {
    if (admin.user_id === user?.id) {
      toast.error("You cannot remove your own admin role");
      return;
    }
    if (!confirm(`Remove admin role from ${admin.email}?`)) return;

    setRemovingId(admin.id);
    const { data, error } = await supabase.functions.invoke("admin-roles", {
      body: { action: "remove", user_id: admin.user_id },
    });
    setRemovingId(null);

    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Failed to remove admin");
      return;
    }
    toast.success(`Removed admin role from ${admin.email}`);
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
  };

  if (authLoading || roleLoading || !user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-16 pb-28">
      <div className="max-w-sm mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="font-display text-3xl tracking-wider">ADMIN section</h1>
        <p className="font-body text-sm text-muted-foreground">
          Internal area for testing new features.
        </p>

        <AdminSeriesConfirmPanel />

        <DemoVisualScoreboard />

        <DemoAllMatchupsInnovation />

        <DemoAdvancedRoundView />

        <DemoFlyerCardV3 />

        <DemoFlyerCardPaxson />

        <DemoFlyerCardDavis />

        <DemoFlyerCardMiller />

        <div className="space-y-2">
          <h2 className="font-display text-lg tracking-wider text-muted-foreground">DEMO MATCH CARD</h2>
          <DemoMatchCard />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg tracking-wider text-muted-foreground">DEMO MATCH CARD — TEAM COLORS</h2>
          <DemoMatchCardColored />
        </div>

        <DemoMatchDetailDialog />

        <DemoMatchDetailDialog
          heading="DEMO MATCH DETAIL — WAS vs UTA"
          data={{
            away: {
              abbreviation: "WAS",
              name: "Wizards",
              seed: 7,
              color: "#002B5C",
            },
            home: {
              abbreviation: "UTA",
              name: "Jazz",
              seed: 2,
              color: "#F9A01B",
            },
            awayScore: 96,
            homeScore: 104,
            seriesAway: 1,
            seriesHome: 4,
            gameNumber: 5,
            date: "May 02",
            conference: "WEST",
            round: "First Round",
            yourPick: { winner: "UTA", games_in_series: 5 },
            yourPickResult: "Shiiiiit 3 Points",
          }}
          seriesResult={{ winner: "UTA", games_played: 5 }}
          picks={[
            { user_id: "w1", profile_name: "Erik", winner: "UTA", games_in_series: 5 },
            { user_id: "w2", profile_name: "Alexander", winner: "UTA", games_in_series: 6 },
            { user_id: "w3", profile_name: "David", winner: "WAS", games_in_series: 7 },
            { user_id: "w4", profile_name: "Fabian", winner: "UTA", games_in_series: 4 },
            { user_id: "w5", profile_name: "Hannes", winner: "UTA", games_in_series: 5 },
          ]}
        />

        <div className="space-y-2">
          <h2 className="font-display text-lg tracking-wider text-muted-foreground">FONT VARIANTS</h2>
          <DemoMatchCardFonts />
        </div>

        <DemoBracketPlayedOut />

        <DemoAllPicksTable />

        <Accordion type="single" collapsible className="bg-[#181C23] rounded-lg px-5">
          <AccordionItem value="roles" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                <h2 className="font-display text-lg tracking-wider">ROLES</h2>
                {!loadingAdmins && admins.length > 0 && (
                  <span className="font-body text-xs text-muted-foreground ml-1">
                    ({admins.length})
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {loadingAdmins ? (
                <p className="font-body text-sm text-muted-foreground">Loading…</p>
              ) : admins.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">
                  No admins found.
                </p>
              ) : (
                <ul className="space-y-2">
                  {admins.map((admin) => {
                    const isSelf = admin.user_id === user.id;
                    return (
                      <li
                        key={admin.id}
                        className="flex items-center justify-between gap-3 bg-background/40 rounded-md px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-body text-sm truncate">
                            {admin.email}
                            {isSelf && (
                              <span className="text-muted-foreground text-xs ml-2">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            admin
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(admin)}
                          disabled={isSelf || removingId === admin.id}
                          className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Remove admin role from ${admin.email}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Admin;
