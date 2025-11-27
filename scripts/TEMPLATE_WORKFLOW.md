# Template Upload & Clearing Workflow

> **For Testing:** See [TESTING_WORKFLOW.md](TESTING_WORKFLOW.md) for quick reset instructions.

## Understanding the Upload Script

### 1. Re-uploading Templates (`python scripts/upload_templates.py`)

#### What Happens:
```python
# Line 290 in upload_templates.py
db.collection('templates').document(job_id).set(schema)
```

**The `.set()` method COMPLETELY REPLACES the template document.**

#### Impact on Existing Data:

**Templates Collection:**
- ✅ **Replaced**: The entire template document is overwritten
- ❌ **Lost**: Any fields not in the new schema are removed
- ⚠️ **Version NOT incremented**: The script always sets `version: 1`

**Responses Collection:**
- ✅ **Safe**: Response documents are NOT touched
- ✅ **Preserved**: All draft and submitted responses remain intact
- ⚠️ **Orphaned**: Responses reference `templateVersion: 1` (from original template)

#### Example Scenario:

**Before re-upload:**
```
templates/simple-survey:
  jobId: "simple-survey"
  version: 1
  fields: [8 fields]

responses/user@email_simple-survey_123:
  jobId: "simple-survey"
  templateVersion: 1
  status: "draft"
  data: { name: "John", ... }
```

**After re-upload:**
```
templates/simple-survey:
  jobId: "simple-survey"
  version: 1  ← STILL 1 (not incremented!)
  fields: [8 NEW fields]  ← COMPLETELY REPLACED

responses/user@email_simple-survey_123:
  jobId: "simple-survey"
  templateVersion: 1
  status: "draft"
  data: { name: "John", ... }  ← UNCHANGED
```

### 2. The Problem: Orphaned Responses

When you re-upload a template, **existing responses become orphaned**:

1. **Response data** was created with old field structure
2. **New template** has different fields
3. **Field IDs might not match** between old and new
4. **Form won't render correctly** when user opens their draft

#### What Happens to Users:

**User with draft response:**
1. Opens their draft from dashboard
2. Form tries to render with NEW template fields
3. OLD response data doesn't match NEW field IDs
4. **Result:** Missing data, broken form, or errors

**Example:**
```javascript
// Old template field
{ id: "customer_name", type: "text", label: "Name" }

// User's draft data
{ customer_name: "John Doe" }

// New template field (renamed)
{ id: "full_name", type: "text", label: "Full Name" }

// Problem: Form looks for "full_name", but data has "customer_name"
// User sees empty field even though they entered data!
```

### 3. Clearing Templates (`python scripts/upload_templates.py --clear`)

#### What Happens:
```python
# Lines 304-308 in upload_templates.py
templates = db.collection('templates').stream()
count = 0
for template in templates:
    db.collection('templates').document(template.id).delete()
    count += 1
```

**This deletes ALL template documents from Firestore.**

#### Impact:

**Templates Collection:**
- ❌ **Deleted**: All template documents removed
- ⚠️ **No backup**: Irreversible (unless you re-upload from CSV)

**Responses Collection:**
- ✅ **Untouched**: Response documents are NOT deleted
- ⚠️ **Orphaned**: All responses now reference non-existent templates

**Users Collection:**
- ✅ **Untouched**: User documents are NOT deleted
- ⚠️ **Jobs still assigned**: Users still have jobIds in `assignedJobs` array

#### What Users See:

**After clearing templates:**
1. User signs in
2. Dashboard tries to load templates for assigned jobs
3. **Templates don't exist**
4. **Result:** Empty dashboard or error message

## Recommended Workflows

### For Testing (Current Development)

✅ **Safe to do:**
```bash
# Clear everything and start fresh
python scripts/upload_templates.py --clear
python scripts/upload_templates.py

# All responses are orphaned, but that's OK for testing
```

**Why it's OK:**
- You're still testing
- No real data to preserve
- Easy to recreate test responses

### For Production (With Real Users)

⚠️ **DO NOT re-upload templates with active users!**

**Problems:**
1. Existing drafts become orphaned
2. Users lose their work
3. No version tracking (always version: 1)

**Instead, you need:**
1. **Template versioning** (increment version number)
2. **Response migration** (update old responses to new schema)
3. **Backward compatibility** (old responses work with new template)

## Current Limitations

### 1. No Template Versioning
```python
# upload_templates.py always sets version to 1
'version': 1  # HARDCODED!
```

**Problem:** No way to track template changes

**Solution needed:**
- Check existing template version
- Increment version number
- Store version history

### 2. No Response Migration
When template changes, existing responses are not updated.

**Problem:** Old response data doesn't match new template

**Solution needed:**
- Detect schema changes
- Migrate response data to new field IDs
- Map old fields to new fields

### 3. No Safeguards
Script will happily overwrite templates even with active responses.

**Problem:** Easy to accidentally orphan user data

**Solution needed:**
- Check for existing responses before re-upload
- Warn if responses will be orphaned
- Require `--force` flag for destructive operations

## Workarounds for Current System

### Option 1: Test with Fresh Database
```bash
# Clear EVERYTHING (templates + responses)
# Go to Firebase Console > Firestore
# Delete all documents in 'responses' collection
# Then re-upload templates
python scripts/upload_templates.py --clear
python scripts/upload_templates.py
```

### Option 2: Use Different Job IDs
```bash
# Instead of re-uploading "simple-survey"
# Create a new template "simple-survey-v2"
# This leaves old responses intact
```

**In TEMPLATES dict:**
```python
"simple-survey-v2": {
    "file": "templates/simple-survey.csv",
    "title": "Customer Satisfaction Survey v2",
    ...
}
```

### Option 3: Manual Response Cleanup
```bash
# Before re-uploading template
# Go to Firebase Console > Firestore
# Delete all responses for that jobId
# Filter: where jobId == "simple-survey"
# Delete all matching documents
# Then re-upload template
```

## Summary

### Current Re-upload Behavior:
✅ **Templates**: Completely replaced
⚠️ **Responses**: Orphaned (data preserved but won't match new template)
⚠️ **Users**: Unchanged (still assigned to job, but template is different)
⚠️ **Version**: Always stays at 1 (not incremented)

### Current Clear Behavior:
❌ **Templates**: All deleted
✅ **Responses**: Preserved (but orphaned)
✅ **Users**: Preserved (but jobs have no templates)

### For Testing:
- ✅ Safe to re-upload and clear repeatedly
- ⚠️ Expect orphaned responses (test data)
- ✅ Just recreate test responses after re-upload

### For Production:
- ❌ **DO NOT re-upload** templates with active users
- ❌ **DO NOT clear** templates with saved responses
- ✅ **Use new job IDs** for new template versions
- ✅ **Or implement proper versioning** (future work)

## Future Improvements Needed

### Proposed: Template ID Versioning System

Instead of re-uploading templates with same ID, create versioned IDs:

**Current (problematic):**
```
simple-survey (version always = 1)
```

**Future (better):**
```
simple-survey-v1
simple-survey-v2
simple-survey-v3
```

**Benefits:**
- No orphaned responses (each version is separate template)
- Admin panel can show version history
- Users can be migrated to new versions explicitly
- Old versions archived, not deleted
- Easy rollback to previous versions

**Implementation:**
1. **Template Versioning**: Include version in jobId
2. **Admin Panel**: Track which version is "current" for each base template
3. **User Migration**: Admin can migrate users from v1 → v2
4. **Response Preservation**: Old responses stay linked to old template versions
5. **Archive UI**: Show archived templates in admin panel

**Track this in:** CLAUDE.md > Future Enhancements
