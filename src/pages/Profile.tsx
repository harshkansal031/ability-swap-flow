import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Clock, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
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
  is_priority: boolean;
}

interface Availability {
  id: string;
  days: string[];
  time_slots: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  // Skill form states
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [skillType, setSkillType] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['Morning', 'Afternoon', 'Evening'];
  const experienceLevels = ['Beginner', 'Intermediate', 'Expert'];

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSkills();
      fetchAvailability();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setIsPublic(data.is_public);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAvailability(data);
        setSelectedDays(data.days || []);
        setSelectedTimeSlots(data.time_slots || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    // Validate that user has at least one skill
    if (skills.length === 0) {
      toast({
        title: "Skills Required",
        description: "Please add at least one skill before saving your profile. You need to specify what you can offer or what you want to learn.",
        variant: "destructive",
      });
      return;
    }

    // Validate that user has at least one offering skill
    const offeringSkills = skills.filter(skill => skill.skill_type === 'offering');
    if (offeringSkills.length === 0) {
      toast({
        title: "Offering Skills Required",
        description: "Please add at least one skill you can offer to others. This helps other users know what you can teach.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        user_id: user?.id,
        full_name: fullName,
        location,
        bio,
        is_public: isPublic,
      };

      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        if (error) throw error;
      }

      // Save availability
      const availabilityData = {
        user_id: user?.id,
        days: selectedDays,
        time_slots: selectedTimeSlots,
      };

      if (availability) {
        const { error } = await supabase
          .from('availability')
          .update(availabilityData)
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('availability')
          .insert(availabilityData);
        if (error) throw error;
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });

      fetchProfile();
      fetchAvailability();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleAddSkill = async () => {
    // Validate required fields
    if (!skillName.trim()) {
      toast({
        title: "Skill Name Required",
        description: "Please enter a skill name.",
        variant: "destructive",
      });
      return;
    }

    if (!skillType) {
      toast({
        title: "Skill Type Required",
        description: "Please select whether this is a skill you offer or want to learn.",
        variant: "destructive",
      });
      return;
    }

    if (!skillLevel) {
      toast({
        title: "Experience Level Required",
        description: "Please select your experience level for this skill.",
        variant: "destructive",
      });
      return;
    }

    // Check if skill already exists
    const existingSkill = skills.find(
      skill => skill.skill_name.toLowerCase() === skillName.trim().toLowerCase() && 
               skill.skill_type === skillType
    );

    if (existingSkill) {
      toast({
        title: "Skill Already Exists",
        description: "You already have this skill in your profile.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('skills')
        .insert({
          user_id: user?.id,
          skill_name: skillName.trim(),
          description: skillDescription.trim(),
          experience_level: skillLevel,
          skill_type: skillType,
        });

      if (error) throw error;

      setSkillName('');
      setSkillDescription('');
      setSkillLevel('');
      setSkillType('');
      setShowSkillForm(false);
      
      toast({
        title: "Skill added successfully!",
        description: "Your skill has been added to your profile.",
      });

      fetchSkills();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: "Skill removed",
        description: "The skill has been removed from your profile.",
      });

      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleTimeSlot = (slot: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Manage your personal information and profile visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make profile public</Label>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Add skills you can offer and skills you want to learn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Skills</h3>
              <Button
                onClick={() => setShowSkillForm(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>

            {showSkillForm && (
              <Card className="p-4 border-dashed">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Skill Name</Label>
                      <Input
                        value={skillName}
                        onChange={(e) => setSkillName(e.target.value)}
                        placeholder="e.g., JavaScript, Guitar, Cooking"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={skillType} onValueChange={setSkillType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offering">Skill I Offer</SelectItem>
                          <SelectItem value="wanted">Skill I Want</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select value={skillLevel} onValueChange={setSkillLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={skillDescription}
                      onChange={(e) => setSkillDescription(e.target.value)}
                      placeholder="Describe your skill level and experience"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddSkill}>Add Skill</Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSkillForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Skills I Offer</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.filter(s => s.skill_type === 'offering').map(skill => (
                    <Badge key={skill.id} variant="secondary" className="flex items-center gap-2">
                      {skill.skill_name} ({skill.experience_level})
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleDeleteSkill(skill.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Skills I Want</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.filter(s => s.skill_type === 'wanted').map(skill => (
                    <Badge key={skill.id} variant="outline" className="flex items-center gap-2">
                      {skill.skill_name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleDeleteSkill(skill.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Availability
            </CardTitle>
            <CardDescription>
              Set your availability for skill swapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">Available Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {days.map(day => (
                  <Button
                    key={day}
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base font-medium">Available Time Slots</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {timeSlots.map(slot => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlots.includes(slot) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTimeSlot(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSaveProfile}
          className="w-full"
          disabled={saving || skills.length === 0}
        >
          {saving ? 'Saving...' : 
           skills.length === 0 ? 'Add Skills to Save Profile' : 
           skills.filter(s => s.skill_type === 'offering').length === 0 ? 'Add Offering Skills to Save Profile' : 
           'Save Profile'}
        </Button>
        
        {skills.length === 0 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ⚠️ You need to add at least one skill before saving your profile.
            </p>
          </div>
        )}
        
        {skills.length > 0 && skills.filter(s => s.skill_type === 'offering').length === 0 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ⚠️ You need to add at least one skill you can offer to others.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}