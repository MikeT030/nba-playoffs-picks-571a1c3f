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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminSeriesConfirmPanel from "@/components/AdminSeriesConfirmPanel";
import AdminFlyerAwardPanel from "@/components/AdminFlyerAwardPanel";
import AdminPointsByRoundPanel from "@/components/AdminPointsByRoundPanel";
import HeroBannerMinimal from "@/components/HeroBannerMinimal";
import DemoAllMatchupsInnovation from "@/components/DemoAllMatchupsInnovation";
import DemoAdvancedRoundView from "@/components/DemoAdvancedRoundView";
import DemoMatchCard from "@/components/DemoMatchCard";
import DemoMatchCardColoredWithRecap from "@/components/DemoMatchCardColoredWithRecap";
import DemoMatchDetailDialog from "@/components/DemoMatchDetailDialog";
import DemoMatchCardFonts from "@/components/DemoMatchCardFonts";
import DemoBracketPlayedOut from "@/components/DemoBracketPlayedOut";
import DemoAllPicksTable from "@/components/DemoAllPicksTable";
import DemoVisualScoreboard from "@/components/DemoVisualScoreboard";
import { DemoFlyerCardV3, DemoFlyerCardPaxson, DemoFlyerCardDavis, DemoFlyerCardMiller } from "@/components/DemoFlyerCardVariants";
import DemoFullWidthNav from "@/components/DemoFullWidthNav";
import FloatingNav from "@/components/FloatingNav";
import { DeadpoolRecapPanel } from "@/components/DeadpoolRecapDrawer";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

const WadeTakeAccordion = () => {
  const [value, setValue] = useState<string>("");
  const isOpen = value === "wades-take";
  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className="bg-[#181C23] rounded-lg px-5"
    >
      <AccordionItem value="wades-take" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <h2 className="font-display text-lg tracking-wider text-left">
            WADE'S TAKE — SUMMARY
          </h2>
        </AccordionTrigger>
        <AccordionContent>
          <DeadpoolRecapPanel active={isOpen} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

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
    <div className="min-h-screen bg-background pb-28">
      <HeroBannerMinimal title="Admin Area" />
      <div className="max-w-sm mx-auto space-y-6 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <p className="font-body text-sm text-muted-foreground">
          Internal area for testing new features.
        </p>

        <AdminSeriesConfirmPanel />

        <WadeTakeAccordion />

        <Accordion type="single" collapsible className="bg-[#181C23] rounded-lg px-5">
          <AccordionItem value="flyer-award" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <h2 className="font-display text-lg tracking-wider">FLYER — THE SHOT · AWARD CARDS</h2>
            </AccordionTrigger>
            <AccordionContent>
              <AdminFlyerAwardPanel />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="bg-[#181C23] rounded-lg px-5">
          <AccordionItem value="points-by-round" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <h2 className="font-display text-lg tracking-wider text-left">POINTS BY ROUND</h2>
            </AccordionTrigger>
            <AccordionContent>
              <AdminPointsByRoundPanel />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {[
          {
            group: "MATCH CARDS",
            items: [
              { value: "match-card", label: "DEMO MATCH CARD", content: <DemoMatchCard /> },
              { value: "match-card-colored", label: "DEMO MATCH CARD — TEAM COLORS", content: <DemoMatchCardColoredWithRecap /> },
              { value: "match-card-fonts", label: "FONT VARIANTS", content: <DemoMatchCardFonts /> },
            ],
          },
          {
            group: "MATCH DETAILS",
            items: [
              { value: "match-detail", label: "DEMO MATCH DETAIL DIALOG", content: <DemoMatchDetailDialog /> },
              {
                value: "match-detail-was-uta",
                label: "DEMO MATCH DETAIL — WAS vs UTA",
                content: (
                  <DemoMatchDetailDialog
                    heading="DEMO MATCH DETAIL — WAS vs UTA"
                    data={{
                      away: { abbreviation: "WAS", name: "Wizards", seed: 7, color: "#002B5C" },
                      home: { abbreviation: "UTA", name: "Jazz", seed: 2, color: "#F9A01B" },
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
                ),
              },
            ],
          },
          {
            group: "FLYER CARDS",
            items: [
              { value: "flyer-v3", label: "DEMO FLYER CARD — V3", content: <DemoFlyerCardV3 /> },
              { value: "flyer-paxson", label: "DEMO FLYER CARD — PAXSON", content: <DemoFlyerCardPaxson /> },
              { value: "flyer-davis", label: "DEMO FLYER CARD — DAVIS", content: <DemoFlyerCardDavis /> },
              { value: "flyer-miller", label: "DEMO FLYER CARD — MILLER", content: <DemoFlyerCardMiller /> },
            ],
          },
          {
            group: "ROUND & BRACKET VIEWS",
            items: [
              { value: "all-matchups", label: "DEMO ALL MATCHUPS INNOVATION", content: <DemoAllMatchupsInnovation /> },
              { value: "advanced-round", label: "DEMO ADVANCED ROUND VIEW", content: <DemoAdvancedRoundView /> },
              { value: "bracket-played-out", label: "DEMO BRACKET — PLAYED OUT", content: <DemoBracketPlayedOut /> },
            ],
          },
          {
            group: "SCOREBOARD & PICKS",
            items: [
              { value: "visual-scoreboard", label: "DEMO VISUAL SCOREBOARD", content: <DemoVisualScoreboard /> },
              { value: "all-picks-table", label: "DEMO ALL PICKS TABLE", content: <DemoAllPicksTable /> },
            ],
          },
          {
            group: "NAVIGATION",
            items: [
              {
                value: "regular-nav",
                label: "HOVERING NAV BAR",
                content: (
                  <div className="space-y-3">
                    <p className="font-body text-xs text-muted-foreground">
                      Expand to preview — the pill-shaped nav floats above the bottom.
                    </p>
                    <FloatingNav />
                  </div>
                ),
              },
              {
                value: "full-width-nav",
                label: "DEMO FULL-WIDTH NAV",
                content: (
                  <div className="space-y-3">
                    <p className="font-body text-xs text-muted-foreground">
                      Expand to preview — the nav docks to the bottom of the screen.
                    </p>
                    <DemoFullWidthNav />
                  </div>
                ),
              },
            ],
          },
        ].map((section) => (
          <div key={section.group} className="space-y-2">
            <h3 className="font-display text-xs tracking-[0.2em] text-muted-foreground px-1 pt-2">
              {section.group}
            </h3>
            <Accordion type="multiple" className="space-y-3">
              {section.items.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="bg-[#181C23] rounded-lg px-5 border-b-0"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <h2 className="font-display text-lg tracking-wider text-left">{item.label}</h2>
                  </AccordionTrigger>
                  <AccordionContent>{item.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

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
