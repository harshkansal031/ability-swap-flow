-- Cleanup script to remove users with empty skills
-- This script will remove users who have no skills in the skills table

-- First, let's see how many users have no skills
SELECT 
  COUNT(DISTINCT p.user_id) as users_without_skills,
  COUNT(DISTINCT p.user_id) as total_users
FROM profiles p
LEFT JOIN skills s ON p.user_id = s.user_id
WHERE s.id IS NULL;

-- Show users who have no skills (for verification)
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.created_at
FROM profiles p
LEFT JOIN skills s ON p.user_id = s.user_id
WHERE s.id IS NULL
ORDER BY p.created_at DESC;

-- Delete users with no skills
-- This will cascade delete their profiles, availability, and any related data
DELETE FROM auth.users 
WHERE id IN (
  SELECT DISTINCT p.user_id
  FROM profiles p
  LEFT JOIN skills s ON p.user_id = s.user_id
  WHERE s.id IS NULL
);

-- Verify the cleanup
SELECT 
  COUNT(DISTINCT p.user_id) as remaining_users_with_skills,
  COUNT(DISTINCT s.user_id) as users_with_skills
FROM profiles p
INNER JOIN skills s ON p.user_id = s.user_id;

-- Show remaining users and their skill counts
SELECT 
  p.full_name,
  p.location,
  COUNT(s.id) as skill_count,
  COUNT(CASE WHEN s.skill_type = 'offering' THEN 1 END) as offering_skills,
  COUNT(CASE WHEN s.skill_type = 'wanted' THEN 1 END) as wanted_skills
FROM profiles p
INNER JOIN skills s ON p.user_id = s.user_id
GROUP BY p.id, p.full_name, p.location
ORDER BY skill_count DESC; 