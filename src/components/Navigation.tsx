import { Button } from "@/components/ui/button";
import { Users, Search, User, MessageSquare, LogIn } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSwap
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Browse
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              My Profile
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Requests
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button variant="gradient" size="sm">
              Join Now
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};