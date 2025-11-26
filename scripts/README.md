# Firestore Upload Scripts

Python scripts for uploading templates directly to Firestore, bypassing the admin panel for faster testing and debugging.

## Setup

### 1. Install Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **data-collector-2025**
3. Go to **Project Settings** (⚙️ icon) > **Service Accounts**
4. Click **"Generate New Private Key"**
5. Click **"Generate Key"** to download the JSON file
6. Save it as `scripts/firebase-config.json`

```bash
# The file should be saved here:
# scripts/firebase-config.json
#
# ⚠️ This file is in .gitignore and will NOT be committed to git
```

**Important:** Never commit this file to git! It contains sensitive credentials.

## Usage

### List Available Templates

```bash
python scripts/upload_templates.py --list
```

Output:
```
Available templates:
  simple-survey        - Customer Satisfaction Survey
  conditional-form     - Country Governance Assessment
  grouped-likert       - Employee Engagement Survey
  document-coding      - Research Document Coding
```

### Upload All Templates

```bash
python scripts/upload_templates.py
```

### Upload Specific Templates

```bash
# Single template
python scripts/upload_templates.py simple-survey

# Multiple templates
python scripts/upload_templates.py simple-survey conditional-form
```

### Clear and Re-upload

```bash
# Clear all templates first, then upload
python scripts/upload_templates.py --clear
```

### Dry Run (Validation Only)

```bash
# Validate without uploading
python scripts/upload_templates.py --dry-run
```

## Example Workflow

```bash
# 1. Clear all existing templates
python scripts/upload_templates.py --clear

# 2. Upload all templates
python scripts/upload_templates.py

# 3. Test in browser
# Visit your app URL and verify templates appear

# 4. Make changes to CSV
# Edit templates/simple-survey.csv

# 5. Re-upload just that template
python scripts/upload_templates.py simple-survey
```

## Output Example

```
Initializing Firebase...
✓ Initialized with Application Default Credentials

Clearing all templates...
  ✓ Deleted 4 templates

Uploading 4 template(s)...

Processing: simple-survey
  Title: Customer Satisfaction Survey
  File: simple-survey.csv
  Fields: 8
  ✓ Validation passed
  ✓ Uploaded to Firestore

Processing: conditional-form
  Title: Country Governance Assessment
  File: conditional-form.csv
  Fields: 10
  Groups: Basic Information, Governance, Direct Democracy
  ✓ Validation passed
  ✓ Uploaded to Firestore

Processing: grouped-likert
  Title: Employee Engagement Survey
  File: grouped-likert.csv
  Fields: 17
  Groups: Demographics, Work Environment, Management, Career Development, Overall
  ✓ Validation passed
  ✓ Uploaded to Firestore

Processing: document-coding
  Title: Research Document Coding
  File: document-coding.csv
  Fields: 17
  Groups: Document Metadata, Content Analysis, Quality Assessment
  ✓ Validation passed
  ✓ Uploaded to Firestore

Summary:
  Successful: 4/4
```

## Validation

The script performs the same validation as `template-parser.js`:

- ✓ Required columns present
- ✓ Valid field types
- ✓ No duplicate field IDs
- ✓ No duplicate item IDs
- ✓ Dropdown/radio have options
- ✓ Skip logic references valid fields
- ✓ Min/max values are logical

If validation fails, the script will report errors and NOT upload.

## Troubleshooting

### "Error: Service account key not found"

**Solution**:
1. Download service account key from Firebase Console
2. Save as `scripts/firebase-config.json`
3. Check the example file: `scripts/firebase-config.json.example`

### "Error initializing Firebase"

**Solution**: Check that your `firebase-config.json` is valid JSON and matches the format in `firebase-config.json.example`

### "File not found"

**Solution**: Run script from project root directory:
```bash
cd /path/to/form-01
python scripts/upload_templates.py
```

### "Permission denied"

**Solution**: The service account has admin access by default. If you still get permission errors:
1. Check your Firestore security rules
2. Verify the service account email in Firebase Console > IAM & Admin

### "Duplicate field IDs"

**Solution**: Check your CSV for duplicate `field_id` values. Each must be unique.

### "skip_to_field_id does not exist"

**Solution**: Ensure the target field ID in `skip_to_field_id` column matches an existing `field_id`.

## Script Features

- ✅ Parses CSV exactly like `template-parser.js`
- ✅ Validates schema before upload
- ✅ Supports all 12 CSV columns
- ✅ Sorts fields by `item_id`
- ✅ Extracts unique groups
- ✅ Dry-run mode for testing
- ✅ Clear existing templates
- ✅ Upload specific templates
- ✅ Detailed error reporting

## Adding New Templates

To add a new template:

1. Create CSV file in `templates/` directory
2. Add entry to `TEMPLATES` dict in `upload_templates.py`:

```python
TEMPLATES = {
    # ... existing templates ...
    "my-new-template": {
        "file": "templates/my-new-template.csv",
        "title": "My New Template",
        "description": "Description of the template",
        "helpDisplay": "tooltip"  # or "inline" or "column"
    }
}
```

3. Upload:
```bash
python scripts/upload_templates.py my-new-template
```
