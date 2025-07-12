import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const HeroSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search submitted with term:', searchTerm);
    if (searchTerm.trim()) {
      const searchUrl = `/browse?search=${encodeURIComponent(searchTerm.trim())}`;
      console.log('Navigating to:', searchUrl);
      navigate(searchUrl);
    } else {
      console.log('No search term, navigating to browse');
      navigate('/browse');
    }
  };

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
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for skills like 'Python', 'Guitar', 'Spanish'..."
              className="pl-12 pr-32 h-14 text-lg border-border/50 bg-background/50 backdrop-blur-sm shadow-card"
            />
            <Button type="submit" variant="gradient" size="lg" className="absolute right-2 top-2">
              Search Skills
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={user ? "/profile" : "/auth"}>
            <Button variant="hero" size="xl">
              {user ? "My Profile" : "Join SkillSwap"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" size="xl">
              Browse Skills
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};