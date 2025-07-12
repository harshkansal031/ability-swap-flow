import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin } from "lucide-react";

export const SkillShowcase = () => {
  const profiles = [
    {
      name: "Marc Demo",
      location: "New York",
      avatar: "/lovable-uploads/0efada5a-86f1-4efa-bc82-c894d6157609.png",
      rating: 4.8,
      skillsOffered: ["Web Design", "React"],
      skillsWanted: ["Node.js", "Python"],
      level: "Expert",
    },
    {
      name: "Michelle",
      location: "San Francisco", 
      avatar: "/lovable-uploads/fed92987-9265-4351-b7cd-a238b8daa4b5.png",
      rating: 4.9,
      skillsOffered: ["Data Science", "Python"],
      skillsWanted: ["UI/UX", "Figma"],
      level: "Intermediate",
    },
    {
      name: "Joe Wills",
      location: "Austin",
      avatar: "/lovable-uploads/e6d702ab-6bd3-4b6a-886e-590ec473bbc3.png", 
      rating: 4.7,
      skillsOffered: ["Guitar", "Music Theory"],
      skillsWanted: ["Photography", "Digital Art"],
      level: "Expert",
    },
  ];

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
          {profiles.map((profile, index) => (
            <Card key={index} className="border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 bg-background">
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground">{profile.name}</h3>
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
                    {profile.skillsOffered.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="bg-accent/50 text-accent-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Skills Wanted */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills Wanted</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skillsWanted.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="outline" className="border-primary/30 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="ml-1 text-sm font-medium">{profile.rating}/5</span>
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
          ))}
        </div>
      </div>
    </section>
  );
};