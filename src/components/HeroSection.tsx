import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto text-center">
        {/* Hero Content */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Exchange Skills,{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Build
            </span>
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Community
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with others to teach what you know and learn what you want. 
            Join thousands of skill swappers worldwide.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search for skills like 'Python', 'Guitar', 'Spanish'..."
              className="pl-12 pr-32 h-14 text-lg border-border/50 bg-background/50 backdrop-blur-sm shadow-card"
            />
            <Button variant="gradient" size="lg" className="absolute right-2 top-2">
              Search Skills
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="xl">
            Join SkillSwap
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" size="xl">
            Browse Skills
          </Button>
        </div>
      </div>
    </section>
  );
};