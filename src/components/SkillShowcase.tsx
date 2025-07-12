import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin } from "lucide-react";

interface Skill {
  id: string;
  skill_name: string;
  experience_level: string;
  skill_type: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  location: string;
  profile_photo?: string;
  bio?: string;
}

interface FeaturedUser extends Profile {
  rating: number;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  level: string;
}

export const SkillShowcase = () => {
  const [featured, setFeatured] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      // 1. Get all public profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, location, profile_photo, bio, is_public")
        .eq("is_public", true);
      if (profilesError) return setLoading(false);
      if (!profiles || profiles.length === 0) return setLoading(false);

      // 2. Get all feedback for these users
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("reviewee_id, rating");
      if (feedbackError) return setLoading(false);

      // 3. Calculate average rating per user
      const ratings: Record<string, number[]> = {};
      (feedback || []).forEach(fb => {
        if (!ratings[fb.reviewee_id]) ratings[fb.reviewee_id] = [];
        ratings[fb.reviewee_id].push(fb.rating);
      });
      const avgRating: Record<string, number> = {};
      Object.entries(ratings).forEach(([userId, arr]) => {
        avgRating[userId] = arr.reduce((a, b) => a + b, 0) / arr.length;
      });

      // 4. Get all skills for these users
      const { data: allSkills, error: skillsError } = await supabase
        .from("skills")
        .select("id, user_id, skill_name, experience_level, skill_type");
      if (skillsError) return setLoading(false);

      // 5. Compose featured users
      const users: FeaturedUser[] = (profiles as Profile[]).map(profile => {
        const skills = (allSkills || []).filter(s => s.user_id === profile.user_id);
        const skillsOffered = skills.filter(s => s.skill_type === "offering");
        const skillsWanted = skills.filter(s => s.skill_type === "wanted");
        // Pick the highest level among offered skills for badge
        const level = skillsOffered.length > 0 ? skillsOffered[0].experience_level : "Beginner";
        return {
          ...profile,
          rating: avgRating[profile.user_id] ?? 0,
          skillsOffered,
          skillsWanted,
          level,
        };
      });
      // 6. Sort by rating desc, fallback to users with most skills if no ratings
      users.sort((a, b) => b.rating - a.rating || b.skillsOffered.length - a.skillsOffered.length);
      setFeatured(users.slice(0, 3));
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured Skill Swappers
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Meet some of our amazing community members ready to share their expertise and learn new skills.
          </p>
        </div>
        {/* Profiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center text-muted-foreground">Loading featured users...</div>
          ) : featured.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground">No featured users yet.</div>
          ) : (
            featured.map((profile, index) => (
              <Card key={index} className="border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 bg-background">
                <CardHeader className="text-center pb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={profile.profile_photo || ''} alt={profile.full_name} />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                      {profile.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-foreground">{profile.full_name}</h3>
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skills Offered */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Skills Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsOffered.length > 0 ? profile.skillsOffered.map((skill, skillIndex) => (
                        <Badge key={skill.id} variant="secondary" className="bg-accent/50 text-accent-foreground">
                          {skill.skill_name}
                        </Badge>
                      )) : <span className="text-muted-foreground text-sm">No skills offered</span>}
                    </div>
                  </div>
                  {/* Skills Wanted */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Skills Wanted</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsWanted.length > 0 ? profile.skillsWanted.map((skill, skillIndex) => (
                        <Badge key={skill.id} variant="outline" className="border-primary/30 text-primary">
                          {skill.skill_name}
                        </Badge>
                      )) : <span className="text-muted-foreground text-sm">No skills wanted</span>}
                    </div>
                  </div>
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="ml-1 text-sm font-medium">{profile.rating ? profile.rating.toFixed(1) : "-"}/5</span>
                    </div>
                    <Badge className="bg-gradient-primary text-white">
                      {profile.level}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="gradient" className="w-full">
                    Request Swap
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};