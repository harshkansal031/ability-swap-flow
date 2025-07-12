import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const StatsSection = () => {
  const [stats, setStats] = useState([
    { number: "-", label: "Active Members" },
    { number: "-", label: "Skills Exchanged" },
    { number: "-", label: "Satisfaction Rate" },
    { number: "-", label: "Skill Categories" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Active Members: count of public profiles
      const { count: memberCount } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("is_public", true);
      // 2. Skills Exchanged: count of completed swap_requests
      const { count: swapsCount } = await supabase
        .from("swap_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed");
      // 3. Satisfaction Rate: percent of feedback with rating >= 4
      const { data: feedback } = await supabase
        .from("feedback")
        .select("rating");
      let satisfaction = "-";
      if (feedback && feedback.length > 0) {
        const satisfied = feedback.filter(fb => fb.rating >= 4).length;
        satisfaction = `${Math.round((satisfied / feedback.length) * 100)}%`;
      }
      // 4. Skill Categories: count of unique skill names
      const { data: skills } = await supabase
        .from("skills")
        .select("skill_name");
      const uniqueSkills = new Set((skills || []).map(s => s.skill_name));
      setStats([
        { number: memberCount ? memberCount.toLocaleString() : "-", label: "Active Members" },
        { number: swapsCount ? swapsCount.toLocaleString() : "-", label: "Skills Exchanged" },
        { number: satisfaction, label: "Satisfaction Rate" },
        { number: uniqueSkills.size ? uniqueSkills.size.toLocaleString() : "-", label: "Skill Categories" },
      ]);
    };
    fetchStats();
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};