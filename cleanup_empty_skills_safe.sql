-- Safe cleanup script to remove profiles with empty skills
-- This script only removes profiles and related data, not auth users

-- First, let's see how many profiles have no skills
SELECT 
  COUNT(DISTINCT p.user_id) as profiles_without_skills,
  COUNT(DISTINCT p.user_id) as total_profiles
FROM profiles p
LEFT JOIN skills s ON p.user_id = s.user_id
WHERE s.id IS NULL;

-- Show profiles who have no skills (for verification)
SELECT 
  p.user_id,
  p.full_name,
  p.location,
  p.created_at
FROM profiles p
LEFT JOIN skills s ON p.user_id = s.user_id
WHERE s.id IS NULL
ORDER BY p.created_at DESC;

-- Delete profiles with no skills (this will cascade delete availability and other related data)
DELETE FROM profiles 
WHERE user_id IN (
  SELECT DISTINCT p.user_id
  FROM profiles p
  LEFT JOIN skills s ON p.user_id = s.user_id
  WHERE s.id IS NULL
);

-- Also clean up any orphaned availability records
DELETE FROM availability 
WHERE user_id NOT IN (
  SELECT user_id FROM profiles
);

-- Clean up any orphaned swap requests
DELETE FROM swap_requests 
WHERE requester_id NOT IN (
  SELECT user_id FROM profiles
) OR requested_user_id NOT IN (
  SELECT user_id FROM profiles
);

-- Verify the cleanup
SELECT 
  COUNT(DISTINCT p.user_id) as remaining_profiles_with_skills,
  COUNT(DISTINCT s.user_id) as users_with_skills
FROM profiles p
INNER JOIN skills s ON p.user_id = s.user_id;

-- Show remaining profiles and their skill counts
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