# Quick Setup Guide

## Get Your Firebase Service Account Key

Follow these steps **once** to set up the upload script:

### Step 1: Open Firebase Console

Go to: https://console.firebase.google.com/

### Step 2: Select Your Project

Click on: **data-collector-2025**

### Step 3: Navigate to Service Accounts

1. Click the **⚙️ Settings icon** (top left, next to "Project Overview")
2. Click **Project settings**
3. Click the **Service accounts** tab

### Step 4: Generate Key

1. Click the button: **"Generate new private key"**
2. Click **"Generate key"** in the confirmation dialog
3. A JSON file will download automatically

### Step 5: Save the Key File

1. Rename the downloaded file to: `firebase-config.json`
2. Move it to: `scripts/firebase-config.json`

```bash
# Example:
mv ~/Downloads/data-collector-2025-abc123.json scripts/firebase-config.json
```

### Step 6: Verify Setup

```bash
# Install dependencies (if not already done)
pip install firebase-admin

# Test the script
python scripts/upload_templates.py --list
```

You should see:
```
✓ Initialized with service account: firebase-config.json
Available templates:
  simple-survey        - Customer Satisfaction Survey
  conditional-form     - Country Governance Assessment
  ...
```

## Security Notes

✅ **Good news:** The `firebase-config.json` file is in `.gitignore` and will **never** be committed to git.

⚠️ **Important:** Keep this file private! It has admin access to your Firebase project.

## What's in the Key File?

The JSON file contains:
- Your project ID
- Service account email
- Private key (encrypted credentials)
- Token URLs

This is what allows the script to authenticate as an admin and write to Firestore.

## Troubleshooting

### File doesn't exist error

```
Error: Service account key not found at scripts/firebase-config.json
```

**Solution:** Check that the file is named exactly `firebase-config.json` (not `firebase-config (1).json` or similar) and is in the `scripts/` directory.

### Permission denied

If you get permission errors:
1. Make sure you downloaded the key from the correct project
2. Check that the key file isn't corrupted (should be valid JSON)
3. Verify the service account has Firestore permissions in IAM & Admin

### Invalid JSON

```
Error initializing Firebase: ...
```

**Solution:** Your key file might be corrupted. Download a new one from Firebase Console.

## Next Steps

Once setup is complete, see [README.md](README.md) for usage instructions.

Quick start:
```bash
# Upload all templates
python scripts/upload_templates.py

# Upload specific template
python scripts/upload_templates.py simple-survey
```
