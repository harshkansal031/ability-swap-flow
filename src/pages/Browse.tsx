import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, User, MessageCircle, LogIn, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  location: string;
  bio: string;
  is_public: boolean;
}

interface Skill {
  id: string;
  skill_name: string;
  description: string;
  experience_level: string;
  skill_type: string;
}

interface UserWithSkills extends Profile {
  skills: Skill[];
  profile_photo?: string;
}

export default function Browse() {
  console.log('Browse component rendering...');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  console.log('Current user:', user);
  console.log('Search params:', searchParams.toString());
  
  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  
  // Swap request form
  const [selectedUser, setSelectedUser] = useState<UserWithSkills | null>(null);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedWantedSkill, setSelectedWantedSkill] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [userOfferedSkills, setUserOfferedSkills] = useState<Skill[]>([]);

  // Read search parameter from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    console.log('Search parameter from URL:', searchFromUrl);
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('Fetching users...');
    fetchUsers();
    if (user) {
      console.log('User authenticated, fetching user skills...');
      fetchCurrentUserSkills();
    }
  }, [user]);

  useEffect(() => {
    console.log('Filtering users with search term:', searchTerm);
    filterUsers();
  }, [users, searchTerm, locationFilter, experienceFilter]);

  const fetchUsers = async () => {
    try {
      setError(null);
      console.log('Starting to fetch users from Supabase...');
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user?.id || '');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0);

      const usersWithSkills = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: skills, error: skillsError } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', profile.user_id);

          if (skillsError) {
            console.error('Error fetching skills for user:', profile.user_id, skillsError);
            throw skillsError;
          }

          return {
            ...profile,
            skills: skills || [],
          };
        })
      );

      console.log('Users with skills processed:', usersWithSkills.length);
      setUsers(usersWithSkills);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchCurrentUserSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_type', 'offering');

      if (error) throw error;
      setUserOfferedSkills(data || []);
    } catch (error) {
      console.error('Error fetching user skills:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.skills.some(skill =>
          skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(user =>
        user.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (experienceFilter && experienceFilter !== 'all') {
      filtered = filtered.filter(user =>
        user.skills.some(skill => skill.experience_level === experienceFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRequestSwap = (user: UserWithSkills) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request skill swaps.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    setSelectedUser(user);
    setShowRequestDialog(true);
    setSelectedOfferedSkill('');
    setSelectedWantedSkill('');
    setRequestMessage('');
  };

  const submitSwapRequest = async () => {
    if (!selectedUser || !selectedOfferedSkill || !selectedWantedSkill) {
      toast({
        title: "Error",
        description: "Please select both skills for the swap request.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('swap_requests')
        .insert({
          requester_id: user?.id,
          requested_user_id: selectedUser.user_id,
          offered_skill_id: selectedOfferedSkill,
          wanted_skill_id: selectedWantedSkill,
          message: requestMessage,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your swap request has been sent successfully.",
      });

      setShowRequestDialog(false);
    } catch (error) {
      console.error('Error sending swap request:', error);
      toast({
        title: "Error",
        description: "Failed to send swap request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => {
              setError(null);
              setLoading(true);
              fetchUsers();
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Browse Skills</h1>
          <p className="text-muted-foreground">Find people to swap skills with</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setExperienceFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredUsers.map((userData) => (
            <Card key={userData.id} className="border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 bg-background">
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={userData.profile_photo || ''} alt={userData.full_name} />
                  <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                    {userData.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground">{userData.full_name}</h3>
                {userData.location && (
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {userData.location}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {userData.bio && (
                  <p className="text-sm text-muted-foreground text-center">{userData.bio}</p>
                )}
                
                {/* Skills Offered */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills
                      .filter(skill => skill.skill_type === 'offering')
                      .map(skill => (
                        <Badge key={skill.id} variant="secondary" className="bg-accent/50 text-accent-foreground">
                          {skill.skill_name} ({skill.experience_level})
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Skills Wanted */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills Wanted</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills
                      .filter(skill => skill.skill_type === 'wanted')
                      .map(skill => (
                        <Badge key={skill.id} variant="outline" className="border-primary/30 text-primary">
                          {skill.skill_name}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Rating and Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="ml-1 text-sm font-medium">4.8/5</span>
                  </div>
                  <Badge className="bg-gradient-primary text-white">
                    {userData.skills.find(skill => skill.skill_type === 'offering')?.experience_level || 'Beginner'}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={() => handleRequestSwap(userData)}
                  disabled={!user}
                >
                  {user ? (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Request Swap
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login to Request
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || locationFilter || experienceFilter !== 'all'
                  ? "No users match your current filters. Try adjusting your search criteria."
                  : "No users are currently available. Check back later or be the first to join!"
                }
              </p>
              {!user && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Want to connect with skill swappers?</p>
                  <Button onClick={() => navigate('/auth')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Join SkillSwap
                  </Button>
                </div>
              )}
              {(searchTerm || locationFilter || experienceFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setExperienceFilter('all');
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Swap Request Dialog - Only show if user is authenticated */}
        {user && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Skill Swap</DialogTitle>
                <DialogDescription>
                  Send a swap request to {selectedUser?.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Skill to Offer</Label>
                  <Select value={selectedOfferedSkill} onValueChange={setSelectedOfferedSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a skill you offer" />
                    </SelectTrigger>
                    <SelectContent>
                      {userOfferedSkills.map(skill => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.skill_name} ({skill.experience_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Skill You Want</Label>
                  <Select value={selectedWantedSkill} onValueChange={setSelectedWantedSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill you want to learn" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedUser?.skills
                        .filter(skill => skill.skill_type === 'offering')
                        .map(skill => (
                          <SelectItem key={skill.id} value={skill.id}>
                            {skill.skill_name} ({skill.experience_level})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you'd like to swap skills..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={submitSwapRequest} className="flex-1">
                    Send Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}