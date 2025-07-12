import { Button } from "@/components/ui/button";
import { Users, Search, User, MessageSquare, LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSwap
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors font-medium ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Home
            </Link>
            {user && (
              <>
                <Link 
                  to="/browse" 
                  className={`transition-colors font-medium ${
                    isActive('/browse') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  Browse
                </Link>
                <Link 
                  to="/profile" 
                  className={`transition-colors font-medium ${
                    isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  My Profile
                </Link>
                <Link 
                  to="/requests" 
                  className={`transition-colors font-medium ${
                    isActive('/requests') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  Requests
                </Link>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient" size="sm">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};