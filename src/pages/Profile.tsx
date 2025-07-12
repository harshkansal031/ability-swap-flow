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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Clock, MapPin, User, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  location: string;
  bio: string;
  is_public: boolean;
  profile_photo?: string;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
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

  // Test function to check database access
  const testDatabaseAccess = async () => {
    try {
      console.log('Testing database access...');
      
      // Test reading profiles
      const { data: readData, error: readError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .limit(1);
      
      console.log('Read test result:', { data: readData, error: readError });
      
      // Test writing to profiles (with minimal data)
      const testData = {
        user_id: user?.id,
        full_name: 'Test User',
      };
      
      const { data: writeData, error: writeError } = await supabase
        .from('profiles')
        .upsert(testData, { onConflict: 'user_id' });
      
      console.log('Write test result:', { data: writeData, error: writeError });
      
    } catch (error) {
      console.error('Database access test failed:', error);
    }
  };

  // Call the test function when component mounts
  useEffect(() => {
    if (user) {
      testDatabaseAccess();
    }
  }, [user]);

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
        setProfilePhoto(data.profile_photo || '');
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (error) {
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          toast({
            title: "Storage not configured",
            description: "Profile photo upload is not available yet. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setProfilePhoto(publicUrl);
      
      toast({
        title: "Photo uploaded successfully!",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
    setUploadingPhoto(false);
  };

  const handleSaveProfile = async () => {
    // Validate that user has at least one offering skill
    const offeringSkillsFromSkills = skills
      .filter(skill => skill.skill_type === 'offering')
      .map(skill => skill.skill_name);

    console.log('Offering skills from skills table:', offeringSkillsFromSkills);
    console.log('Current user id:', user?.id);
    console.log('Saving profile with:', {
      user_id: user?.id,
      full_name: fullName,
      location,
      bio,
      is_public: isPublic,
    });

    if (offeringSkillsFromSkills.length === 0) {
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

      // Use upsert to insert or update by user_id
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: ['user_id'] });
      if (error) {
        console.error('Error upserting profile:', error);
        throw error;
      }

      // Save availability
      const availabilityData = {
        user_id: user?.id,
        days: selectedDays,
        time_slots: selectedTimeSlots,
      };

      // Use upsert for availability as well
      const { error: availError } = await supabase
        .from('availability')
        .upsert(availabilityData, { onConflict: ['user_id'] });
      if (availError) {
        console.error('Error upserting availability:', availError);
        throw availError;
      }

      // Update local state instead of refetching
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      setAvailability(prev => prev ? { ...prev, ...availabilityData } : null);

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
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
            <div className="flex items-center space-x-2">
              <Label htmlFor="profilePhoto">Profile Photo</Label>
              <Input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>}
            </div>
            {profilePhoto && (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={profilePhoto} alt="Profile" />
                  <AvatarFallback>
                    {fullName ? fullName.charAt(0) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">Current profile photo</p>
              </div>
            )}
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
          disabled={saving || skills.filter(s => s.skill_type === 'offering').length === 0}
        >
          {saving ? 'Saving...' : 
           skills.filter(s => s.skill_type === 'offering').length === 0 ? 'Add Offering Skills to Save Profile' : 
           'Save Profile'}
        </Button>
        
        {skills.filter(s => s.skill_type === 'offering').length === 0 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ⚠️ You need to add at least one skill you can offer to others before saving your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}