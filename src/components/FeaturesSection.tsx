import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, Star, Shield } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Connect with Skilled People",
      description: "Find others who have the skills you want to learn and are interested in what you can teach.",
    },
    {
      icon: MessageSquare,
      title: "Easy Skill Exchange",
      description: "Send requests, schedule sessions, and exchange knowledge in a safe, structured environment.",
    },
    {
      icon: Star,
      title: "Build Your Reputation",
      description: "Leave and receive feedback to build trust and showcase your teaching abilities.",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Verified profiles and community guidelines ensure a positive experience for everyone.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How SkillSwap Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, safe, and effective skill exchange in four easy steps
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};