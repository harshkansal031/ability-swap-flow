import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, User, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  
  // Swap request form
  const [selectedUser, setSelectedUser] = useState<UserWithSkills | null>(null);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedWantedSkill, setSelectedWantedSkill] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [userOfferedSkills, setUserOfferedSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserSkills();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, locationFilter, experienceFilter]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user?.id);

      if (profilesError) throw profilesError;

      const usersWithSkills = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: skills, error: skillsError } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', profile.user_id);

          if (skillsError) throw skillsError;

          return {
            ...profile,
            skills: skills || [],
          };
        })
      );

      setUsers(usersWithSkills);
    } catch (error) {
      console.error('Error fetching users:', error);
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

    if (experienceFilter) {
      filtered = filtered.filter(user =>
        user.skills.some(skill => skill.experience_level === experienceFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRequestSwap = (user: UserWithSkills) => {
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
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
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
                    <SelectItem value="">All levels</SelectItem>
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
                    setExperienceFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userData) => (
            <Card key={userData.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={userData.profile_photo || ''} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{userData.full_name}</CardTitle>
                    {userData.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {userData.location}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.bio && (
                  <p className="text-sm text-muted-foreground">{userData.bio}</p>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Skills Offered</h4>
                  <div className="flex flex-wrap gap-1">
                    {userData.skills
                      .filter(skill => skill.skill_type === 'offering')
                      .map(skill => (
                        <Badge key={skill.id} variant="secondary" className="text-xs">
                          {skill.skill_name} ({skill.experience_level})
                        </Badge>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Skills Wanted</h4>
                  <div className="flex flex-wrap gap-1">
                    {userData.skills
                      .filter(skill => skill.skill_type === 'wanted')
                      .map(skill => (
                        <Badge key={skill.id} variant="outline" className="text-xs">
                          {skill.skill_name}
                        </Badge>
                      ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleRequestSwap(userData)}
                  disabled={!user}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Request Swap
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found matching your criteria.</p>
          </div>
        )}

        {/* Swap Request Dialog */}
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
      </div>
    </div>
  );
}