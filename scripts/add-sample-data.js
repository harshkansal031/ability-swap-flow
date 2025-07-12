const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://hatsoujerbccpczcbgnv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdHNvdWplcmJjY2NwY3pjYmdudiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzE5NzIwLCJleHAiOjIwNTAyOTU3MjB9.0ca136d-c198-4a62-a23a-97eee6440308'
);

const sampleUsers = [
  {
    full_name: "Marc Demo",
    location: "New York",
    bio: "Experienced web developer passionate about React and modern frontend technologies. Always eager to learn new frameworks and share knowledge.",
    is_public: true,
    skills: [
      { skill_name: "Web Design", description: "Creating beautiful and functional websites", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "React", description: "Building modern web applications", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Node.js", description: "Backend development with Node.js", experience_level: "Intermediate", skill_type: "wanted" },
      { skill_name: "Python", description: "Data science and automation", experience_level: "Beginner", skill_type: "wanted" }
    ],
    rating: 4.8
  },
  {
    full_name: "Michelle Chen",
    location: "San Francisco",
    bio: "Data scientist with a passion for machine learning and AI. Love teaching Python and always looking to improve my design skills.",
    is_public: true,
    skills: [
      { skill_name: "Data Science", description: "Machine learning and data analysis", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Python", description: "Programming and data manipulation", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "UI/UX", description: "User interface and experience design", experience_level: "Beginner", skill_type: "wanted" },
      { skill_name: "Figma", description: "Design and prototyping", experience_level: "Beginner", skill_type: "wanted" }
    ],
    rating: 4.9
  },
  {
    full_name: "Joe Wills",
    location: "Austin",
    bio: "Professional musician and guitar instructor. Passionate about music theory and always excited to learn new creative skills.",
    is_public: true,
    skills: [
      { skill_name: "Guitar", description: "Acoustic and electric guitar instruction", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Music Theory", description: "Understanding music fundamentals", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Photography", description: "Digital and film photography", experience_level: "Beginner", skill_type: "wanted" },
      { skill_name: "Digital Art", description: "Digital painting and illustration", experience_level: "Beginner", skill_type: "wanted" }
    ],
    rating: 4.7
  },
  {
    full_name: "Sarah Johnson",
    location: "Seattle",
    bio: "Full-stack developer specializing in modern web technologies. Love teaching and always eager to learn new programming languages.",
    is_public: true,
    skills: [
      { skill_name: "JavaScript", description: "Modern JavaScript and ES6+", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "TypeScript", description: "Type-safe JavaScript development", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Rust", description: "Systems programming language", experience_level: "Beginner", skill_type: "wanted" },
      { skill_name: "Go", description: "Backend development with Go", experience_level: "Intermediate", skill_type: "wanted" }
    ],
    rating: 4.6
  },
  {
    full_name: "Alex Rodriguez",
    location: "Miami",
    bio: "Creative designer and illustrator. Passionate about visual arts and always looking to expand my digital skills.",
    is_public: true,
    skills: [
      { skill_name: "Illustration", description: "Digital and traditional illustration", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Graphic Design", description: "Branding and visual identity", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "3D Modeling", description: "Blender and 3D design", experience_level: "Beginner", skill_type: "wanted" },
      { skill_name: "Animation", description: "Motion graphics and animation", experience_level: "Intermediate", skill_type: "wanted" }
    ],
    rating: 4.5
  },
  {
    full_name: "Emma Thompson",
    location: "Portland",
    bio: "DevOps engineer with expertise in cloud infrastructure. Love teaching automation and always eager to learn new technologies.",
    is_public: true,
    skills: [
      { skill_name: "DevOps", description: "CI/CD and infrastructure automation", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "AWS", description: "Cloud infrastructure and services", experience_level: "Expert", skill_type: "offering" },
      { skill_name: "Kubernetes", description: "Container orchestration", experience_level: "Intermediate", skill_type: "wanted" },
      { skill_name: "Terraform", description: "Infrastructure as code", experience_level: "Beginner", skill_type: "wanted" }
    ],
    rating: 4.4
  }
];

async function addSampleData() {
  console.log('Starting to add sample data...');

  for (const userData of sampleUsers) {
    try {
      // Create a unique user_id for each sample user
      const userId = `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: userData.full_name,
          location: userData.location,
          bio: userData.bio,
          is_public: userData.is_public
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.full_name}:`, profileError);
        continue;
      }

      console.log(`Created profile for ${userData.full_name}`);

      // Insert skills
      for (const skill of userData.skills) {
        const { error: skillError } = await supabase
          .from('skills')
          .insert({
            user_id: userId,
            skill_name: skill.skill_name,
            description: skill.description,
            experience_level: skill.experience_level,
            skill_type: skill.skill_type
          });

        if (skillError) {
          console.error(`Error creating skill ${skill.skill_name} for ${userData.full_name}:`, skillError);
        }
      }

      console.log(`Added ${userData.skills.length} skills for ${userData.full_name}`);

      // Add some sample feedback/ratings (we'll simulate this by adding to a feedback table if it exists)
      // For now, we'll just log the rating
      console.log(`User ${userData.full_name} has rating: ${userData.rating}`);

    } catch (error) {
      console.error(`Error processing user ${userData.full_name}:`, error);
    }
  }

  console.log('Sample data addition completed!');
}

// Run the script
addSampleData().catch(console.error); 