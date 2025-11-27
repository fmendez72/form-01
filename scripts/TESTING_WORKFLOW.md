# Testing Workflow: Clean Slate

## Quick Reset (Recommended for Testing)

### Option 1: Manual Delete in Firebase Console (Fastest! ⚡)
```
1. Go to Firebase Console > Firestore Database
2. Delete collections (in any order):
   - templates (delete entire collection)
   - responses (delete entire collection)
3. Run upload script:
   source venv/bin/activate
   python scripts/upload_templates.py
```

**Why this is fastest:**
- No waiting for Python script
- Delete both collections in ~10 seconds
- Visual confirmation in console

### Option 2: Python Script for Templates Only
```bash
# Activate virtual environment
source venv/bin/activate

# Clear and re-upload in one command
python scripts/upload_templates.py --clear && python scripts/upload_templates.py

# What this does:
# ✓ Deletes all templates from Firestore
# ✓ Uploads fresh templates from CSV files
# ✗ Does NOT delete responses (must do manually)
# ✗ Does NOT delete users
```

**Do NOT delete the `users` collection** - users/coders persist across resets.

## What Users See After Reset

### If you only delete templates:
- ✅ User can still sign in
- ✅ Dashboard loads
- ⚠️ No jobs appear (templates don't exist)
- ⚠️ Old draft responses are orphaned (can't be opened)

### If you delete templates + responses:
- ✅ User can still sign in
- ✅ Dashboard loads
- ✅ Clean slate - no orphaned drafts
- ✅ Jobs appear if you re-upload templates and they're still assigned

## Recommended Testing Flow

```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Clean everything
python scripts/upload_templates.py --clear

# 3. Manually delete responses in Firebase Console
#    (Python script doesn't touch responses)
#    Go to Firestore > responses > Delete collection

# 4. Re-upload templates
python scripts/upload_templates.py

# 5. Users can now sign in to fresh templates
#    - Their accounts still exist
#    - No orphaned drafts
#    - Jobs appear if still in assignedJobs array
```

## User/Coder Assignments

Users are assigned jobs via the `assignedJobs` array in their user document:

```javascript
users/john@example.com
  assignedJobs: ["simple-survey", "document-coding"]
```

**After template reset:**
- ✅ User still has these job IDs assigned
- ✅ If templates exist → jobs appear in dashboard
- ⚠️ If templates deleted → jobs don't appear
- ✅ Dashboard gracefully handles missing templates (no errors)

## Future: Proper Version Management

**Current limitation:** No template versioning

**Future solution:**
1. Template IDs include version: `simple-survey-v1`, `simple-survey-v2`
2. Admin panel shows version history
3. Users are migrated to new versions
4. Old versions archived, not deleted

**Track this in:** Future Enhancements section of CLAUDE.md

## Quick Reference

| Action | Templates | Responses | Users | User sees |
|--------|-----------|-----------|-------|-----------|
| `--clear` only | Deleted | Kept | Kept | Empty dashboard |
| `--clear` + manual response delete | Deleted | Deleted | Kept | Clean slate |
| Full manual delete | Deleted | Deleted | Deleted | Can't sign in |

**Best for testing:** `--clear` + manual response delete
