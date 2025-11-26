#!/usr/bin/env python3
"""
Upload CSV templates directly to Firestore.
Bypasses admin panel for faster testing and debugging.

Usage:
    python scripts/upload_templates.py                    # Upload all templates
    python scripts/upload_templates.py simple-survey      # Upload specific template
    python scripts/upload_templates.py --clear            # Clear all templates first

Requirements:
    pip install firebase-admin pandas
"""

import os
import sys
import csv
import argparse
from datetime import datetime
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("Error: firebase-admin not installed")
    print("Install with: pip install firebase-admin")
    sys.exit(1)

# Firebase service account key path
SERVICE_ACCOUNT_KEY = Path(__file__).parent / "firebase-config.json"

# Template configurations
TEMPLATES = {
    "simple-survey": {
        "file": "templates/simple-survey.csv",
        "title": "Customer Satisfaction Survey",
        "description": "Basic survey with skip logic and min/max validation",
        "helpDisplay": "tooltip"
    },
    "conditional-form": {
        "file": "templates/conditional-form.csv",
        "title": "Country Governance Assessment",
        "description": "Form with multiple skip conditions and 3 groups",
        "helpDisplay": "tooltip"
    },
    "grouped-likert": {
        "file": "templates/grouped-likert.csv",
        "title": "Employee Engagement Survey",
        "description": "Survey with Likert scales organized in 5 groups",
        "helpDisplay": "tooltip"
    },
    "document-coding": {
        "file": "templates/document-coding.csv",
        "title": "Research Document Coding",
        "description": "Document analysis form with quality scoring and skip logic",
        "helpDisplay": "tooltip"
    }
}


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    if firebase_admin._apps:
        return firestore.client()

    # Check if service account key exists
    if not SERVICE_ACCOUNT_KEY.exists():
        print(f"Error: Service account key not found at {SERVICE_ACCOUNT_KEY}")
        print("\nTo set up authentication:")
        print("1. Go to Firebase Console > Project Settings > Service Accounts")
        print("2. Click 'Generate New Private Key'")
        print("3. Save the downloaded JSON file as: scripts/firebase-config.json")
        print("\nExample file provided at: scripts/firebase-config.json.example")
        sys.exit(1)

    try:
        cred = credentials.Certificate(str(SERVICE_ACCOUNT_KEY))
        firebase_admin.initialize_app(cred)
        print(f"✓ Initialized with service account: {SERVICE_ACCOUNT_KEY.name}")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        print("\nCheck that your firebase-config.json file is valid.")
        print("Compare with firebase-config.json.example for correct format.")
        sys.exit(1)

    return firestore.client()


def parse_csv_field(row, row_num):
    """Parse a CSV row into a field object matching template-parser.js logic."""

    # Validate field_type
    valid_types = ['text', 'textarea', 'dropdown', 'radio', 'number', 'date']
    field_type = row.get('field_type', '').lower()
    if field_type not in valid_types:
        print(f"  Warning: Row {row_num}: Invalid field_type '{field_type}', defaulting to 'text'")
        field_type = 'text'

    # Parse options
    options = []
    if row.get('options'):
        options = [opt.strip() for opt in row['options'].split('|') if opt.strip()]

    # Parse required
    required_values = ['yes', 'true', '1']
    is_required = row.get('required', '').lower() in required_values

    # Parse item_id
    item_id = None
    if row.get('item_id'):
        try:
            item_id = int(row['item_id'])
        except ValueError:
            pass

    # Parse min/max values
    min_value = None
    max_value = None
    if row.get('min_value'):
        try:
            min_value = float(row['min_value'])
        except ValueError:
            pass
    if row.get('max_value'):
        try:
            max_value = float(row['max_value'])
        except ValueError:
            pass

    return {
        'id': row.get('field_id', ''),
        'type': field_type,
        'label': row.get('label', ''),
        'help': row.get('help_text', ''),
        'required': is_required,
        'options': options,
        'defaultValue': row.get('default_value', ''),
        'skipIf': row.get('skip_if', ''),
        'skipToFieldId': row.get('skip_to_field_id', ''),
        'group': row.get('group', ''),
        'itemId': item_id,
        'minValue': min_value,
        'maxValue': max_value
    }


def parse_csv_template(csv_path):
    """Parse CSV file into fields array."""
    fields = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            # Skip empty rows
            if not row.get('field_id'):
                continue

            field = parse_csv_field(row, i)
            fields.append(field)

    return fields


def create_template_schema(job_id, config, fields):
    """Create template schema matching template-parser.js structure."""

    # Sort fields by itemId
    def sort_key(field):
        item_id = field.get('itemId')
        if item_id is not None:
            return (0, item_id)  # itemId fields come first, sorted by value
        else:
            return (1, fields.index(field))  # Then original order

    sorted_fields = sorted(fields, key=sort_key)

    # Extract unique groups in order of first appearance
    groups = []
    seen_groups = set()
    for field in sorted_fields:
        group = field.get('group', '')
        if group and group not in seen_groups:
            groups.append(group)
            seen_groups.add(group)

    return {
        'jobId': job_id,
        'title': config['title'],
        'description': config['description'],
        'version': 1,
        'helpDisplay': config['helpDisplay'],
        'fields': sorted_fields,
        'groups': groups,
        'createdAt': datetime.utcnow().isoformat() + 'Z',
        'createdBy': 'upload_script',
        'status': 'active'
    }


def validate_template(schema):
    """Validate template schema matching template-parser.js validation."""
    errors = []

    if not schema.get('jobId'):
        errors.append('Missing jobId')
    if not schema.get('title'):
        errors.append('Missing title')
    if not schema.get('fields') or len(schema['fields']) == 0:
        errors.append('No fields defined')

    # Check for duplicate field IDs
    field_ids = [f['id'] for f in schema['fields']]
    duplicates = [fid for fid in set(field_ids) if field_ids.count(fid) > 1]
    if duplicates:
        errors.append(f"Duplicate field IDs: {', '.join(duplicates)}")

    # Check for duplicate item_ids (ignoring nulls)
    item_ids = [f['itemId'] for f in schema['fields'] if f['itemId'] is not None]
    duplicate_items = [iid for iid in set(item_ids) if item_ids.count(iid) > 1]
    if duplicate_items:
        errors.append(f"Duplicate item_id values: {', '.join(map(str, duplicate_items))}")

    # Build field ID map for skip logic validation
    field_id_set = set(field_ids)

    # Validate each field
    for i, field in enumerate(schema['fields'], start=1):
        if not field.get('id'):
            errors.append(f"Field {i}: Missing id")
        if not field.get('label'):
            errors.append(f"Field {i}: Missing label")

        # Validate dropdown/radio options
        if field['type'] in ['dropdown', 'radio'] and len(field['options']) == 0:
            errors.append(f"Field {field['id']}: dropdown/radio requires options")

        # Validate skip logic
        if field.get('skipIf') and not field.get('skipToFieldId'):
            errors.append(f"Field {field['id']}: skip_if requires skip_to_field_id")
        if field.get('skipToFieldId') and not field.get('skipIf'):
            errors.append(f"Field {field['id']}: skip_to_field_id requires skip_if")
        if field.get('skipToFieldId') and field['skipToFieldId'] not in field_id_set:
            errors.append(f"Field {field['id']}: skip_to_field_id '{field['skipToFieldId']}' does not exist")

        # Validate min/max for number fields
        min_val = field.get('minValue')
        max_val = field.get('maxValue')
        if min_val is not None and max_val is not None and min_val > max_val:
            errors.append(f"Field {field['id']}: min_value ({min_val}) greater than max_value ({max_val})")

    return errors


def upload_template(db, job_id, config, dry_run=False):
    """Upload a single template to Firestore."""
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Processing: {job_id}")
    print(f"  Title: {config['title']}")

    # Parse CSV
    csv_path = Path(__file__).parent.parent / config['file']
    if not csv_path.exists():
        print(f"  ✗ Error: File not found: {csv_path}")
        return False

    print(f"  File: {csv_path.name}")
    fields = parse_csv_template(csv_path)
    print(f"  Fields: {len(fields)}")

    # Create schema
    schema = create_template_schema(job_id, config, fields)

    # Extract groups
    if schema['groups']:
        print(f"  Groups: {', '.join(schema['groups'])}")

    # Validate
    errors = validate_template(schema)
    if errors:
        print(f"  ✗ Validation errors:")
        for error in errors:
            print(f"    - {error}")
        return False

    print(f"  ✓ Validation passed")

    # Upload to Firestore
    if not dry_run:
        try:
            db.collection('templates').document(job_id).set(schema)
            print(f"  ✓ Uploaded to Firestore")
        except Exception as e:
            print(f"  ✗ Upload failed: {e}")
            return False

    return True


def clear_templates(db, dry_run=False):
    """Clear all templates from Firestore."""
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Clearing all templates...")

    if not dry_run:
        templates = db.collection('templates').stream()
        count = 0
        for template in templates:
            db.collection('templates').document(template.id).delete()
            count += 1
        print(f"  ✓ Deleted {count} templates")
    else:
        templates = list(db.collection('templates').stream())
        print(f"  Would delete {len(templates)} templates")


def main():
    parser = argparse.ArgumentParser(description='Upload CSV templates to Firestore')
    parser.add_argument('templates', nargs='*', help='Template IDs to upload (default: all)')
    parser.add_argument('--clear', action='store_true', help='Clear all templates before uploading')
    parser.add_argument('--dry-run', action='store_true', help='Validate without uploading')
    parser.add_argument('--list', action='store_true', help='List available templates')

    args = parser.parse_args()

    # List templates
    if args.list:
        print("Available templates:")
        for job_id, config in TEMPLATES.items():
            print(f"  {job_id:20s} - {config['title']}")
        return

    # Initialize Firebase
    print("Initializing Firebase...")
    db = initialize_firebase()

    # Clear if requested
    if args.clear:
        clear_templates(db, args.dry_run)

    # Determine which templates to upload
    if args.templates:
        template_ids = args.templates
        # Validate template IDs
        invalid = [tid for tid in template_ids if tid not in TEMPLATES]
        if invalid:
            print(f"\nError: Unknown template IDs: {', '.join(invalid)}")
            print(f"Use --list to see available templates")
            sys.exit(1)
    else:
        template_ids = list(TEMPLATES.keys())

    # Upload templates
    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Uploading {len(template_ids)} template(s)...")

    success_count = 0
    for job_id in template_ids:
        if upload_template(db, job_id, TEMPLATES[job_id], args.dry_run):
            success_count += 1

    # Summary
    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Summary:")
    print(f"  Successful: {success_count}/{len(template_ids)}")
    if success_count < len(template_ids):
        print(f"  Failed: {len(template_ids) - success_count}")
        sys.exit(1)


if __name__ == '__main__':
    main()
