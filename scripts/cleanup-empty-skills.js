import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = "https://hatsoujerbccpczcbgnv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env file

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanupEmptySkills() {
  try {
    console.log('🔍 Starting cleanup of users with empty skills...\n');

    // First, let's see how many profiles have no skills
    const { data: profilesWithoutSkills, error: countError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        location,
        created_at,
        skills!inner(*)
      `)
      .not('skills.id', 'is', null);

    if (countError) {
      console.error('Error counting profiles:', countError);
      return;
    }

    // Get all profiles
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, location, created_at');

    if (allProfilesError) {
      console.error('Error fetching all profiles:', allProfilesError);
      return;
    }

    // Get all users with skills
    const { data: usersWithSkills, error: skillsError } = await supabase
      .from('skills')
      .select('user_id')
      .not('user_id', 'is', null);

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      return;
    }

    const usersWithSkillsSet = new Set(usersWithSkills.map(s => s.user_id));
    const profilesToDelete = allProfiles.filter(p => !usersWithSkillsSet.has(p.user_id));

    console.log(`📊 Database Statistics:`);
    console.log(`   Total profiles: ${allProfiles.length}`);
    console.log(`   Profiles with skills: ${usersWithSkillsSet.size}`);
    console.log(`   Profiles without skills: ${profilesToDelete.length}\n`);

    if (profilesToDelete.length === 0) {
      console.log('✅ No profiles to clean up! All users have skills.');
      return;
    }

    console.log('🗑️  Profiles to be deleted:');
    profilesToDelete.forEach(profile => {
      console.log(`   - ${profile.full_name} (${profile.user_id})`);
    });

    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete these profiles and all related data.');
    console.log('   Type "YES" to confirm:');
    
    // For automated scripts, you can set this to true
    const autoConfirm = process.env.AUTO_CONFIRM === 'true';
    
    if (!autoConfirm) {
      // In a real scenario, you'd want to implement proper user input
      console.log('   (Skipping confirmation for demo - set AUTO_CONFIRM=true to auto-confirm)');
      return;
    }

    // Delete profiles without skills
    const userIdsToDelete = profilesToDelete.map(p => p.user_id);
    
    console.log('\n🗑️  Deleting profiles without skills...');
    
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('user_id', userIdsToDelete);

    if (deleteError) {
      console.error('❌ Error deleting profiles:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${profilesToDelete.length} profiles without skills.`);

    // Clean up orphaned availability records
    const { error: availabilityError } = await supabase
      .from('availability')
      .delete()
      .not('user_id', 'in', `(${Array.from(usersWithSkillsSet).map(id => `'${id}'`).join(',')})`);

    if (availabilityError) {
      console.error('❌ Error cleaning up availability:', availabilityError);
    } else {
      console.log('✅ Cleaned up orphaned availability records.');
    }

    // Clean up orphaned swap requests
    const { error: swapRequestsError } = await supabase
      .from('swap_requests')
      .delete()
      .or(`requester_id.not.in.(${Array.from(usersWithSkillsSet).map(id => `'${id}'`).join(',')}),requested_user_id.not.in.(${Array.from(usersWithSkillsSet).map(id => `'${id}'`).join(',')})`);

    if (swapRequestsError) {
      console.error('❌ Error cleaning up swap requests:', swapRequestsError);
    } else {
      console.log('✅ Cleaned up orphaned swap requests.');
    }

    // Final verification
    const { data: remainingProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', Array.from(usersWithSkillsSet));

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
    } else {
      console.log(`\n✅ Cleanup complete! ${remainingProfiles.length} profiles with skills remain.`);
    }

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
cleanupEmptySkills(); 