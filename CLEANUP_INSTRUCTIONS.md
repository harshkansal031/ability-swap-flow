# Database Cleanup: Remove Users with Empty Skills

This guide provides multiple ways to clean up users who have no skills in the database.

## 🚨 Important Notes

- **Backup First**: Always backup your database before running cleanup scripts
- **Test Environment**: Test these scripts on a development environment first
- **Service Role Key**: You'll need the Supabase service role key for programmatic cleanup

## 📋 Methods

### Method 1: SQL Scripts (Recommended for Manual Cleanup)

#### Option A: Safe Cleanup (Recommended)
```bash
# Run this in Supabase SQL Editor
# This only removes profiles, not auth users
cat cleanup_empty_skills_safe.sql
```

#### Option B: Full Cleanup (Removes Auth Users)
```bash
# Run this in Supabase SQL Editor
# This removes auth users completely
cat cleanup_empty_skills.sql
```

### Method 2: Node.js Script (Automated)

#### Setup
1. Create a `.env` file in your project root:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
AUTO_CONFIRM=true  # Set to false for manual confirmation
```

2. Install dependencies:
```bash
npm install dotenv
```

3. Run the cleanup script:
```bash
node scripts/cleanup-empty-skills.js
```

## 🔍 What Each Script Does

### SQL Scripts
1. **Counts** users without skills
2. **Shows** which users will be deleted
3. **Deletes** profiles with no skills
4. **Cleans up** orphaned records (availability, swap requests)
5. **Verifies** the cleanup

### Node.js Script
1. **Analyzes** database statistics
2. **Shows** detailed information about what will be deleted
3. **Confirms** before deletion (unless AUTO_CONFIRM=true)
4. **Performs** the cleanup
5. **Verifies** the results

## 📊 What Gets Deleted

### Profiles Table
- User profiles with no skills
- Related availability records
- Related swap requests

### Cascade Effects
- When a profile is deleted, related records are automatically removed due to foreign key constraints

## ✅ Verification

After running cleanup, verify with these queries:

```sql
-- Check remaining profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check profiles with skills
SELECT 
  p.full_name,
  COUNT(s.id) as skill_count
FROM profiles p
INNER JOIN skills s ON p.user_id = s.user_id
GROUP BY p.id, p.full_name
ORDER BY skill_count DESC;

-- Check for any orphaned records
SELECT COUNT(*) as orphaned_availability 
FROM availability a 
LEFT JOIN profiles p ON a.user_id = p.user_id 
WHERE p.user_id IS NULL;

SELECT COUNT(*) as orphaned_swap_requests 
FROM swap_requests sr 
LEFT JOIN profiles p ON sr.requester_id = p.user_id 
WHERE p.user_id IS NULL;
```

## 🛡️ Safety Measures

1. **Backup**: Always backup before cleanup
2. **Preview**: Run count queries first to see what will be deleted
3. **Test**: Test on development environment
4. **Verify**: Always verify results after cleanup
5. **Rollback**: Keep backup for potential rollback

## 🚀 Quick Start

For immediate cleanup:

1. **Get your Supabase service role key** from your Supabase dashboard
2. **Add it to `.env`**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   AUTO_CONFIRM=true
   ```
3. **Run the script**:
   ```bash
   node scripts/cleanup-empty-skills.js
   ```

## 📈 Expected Results

After cleanup, you should have:
- ✅ Only profiles with at least one skill
- ✅ No orphaned availability records
- ✅ No orphaned swap requests
- ✅ Clean database with meaningful user data

## 🆘 Troubleshooting

### Common Issues

1. **Service Role Key Error**
   - Ensure you have the correct service role key
   - Check that it has the necessary permissions

2. **Permission Errors**
   - Verify your service role key has delete permissions
   - Check RLS policies if applicable

3. **Foreign Key Constraint Errors**
   - The scripts handle this automatically
   - If manual cleanup, delete in correct order

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your Supabase configuration
3. Test with a small subset of data first
4. Contact support if needed

## 📝 Logs

The Node.js script provides detailed logging:
- 📊 Database statistics before cleanup
- 🗑️ List of profiles to be deleted
- ✅ Confirmation of successful deletions
- 🔍 Verification of final state

This ensures transparency and helps with troubleshooting. 