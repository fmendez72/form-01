# CLAUDE.md - AI Context File

## Project Overview

Political Data Collection App v3.0 - A serverless SPA for systematic collection of political science research data. Complete redesign from v2.2 to address flexibility and usability limitations.

**Repository**: https://github.com/fmendez72/form-01

## Current Status (Latest Update)

The application is functional with the following features working:
- ✅ Admin sign-in and panel
- ✅ Manual user creation with password
- ✅ CSV user upload (creates Firebase Auth + Firestore records)
- ✅ Template CSV upload
- ✅ Coder sign-in and job dashboard
- ✅ Form rendering with all field types
- ✅ Auto-save and manual save
- ✅ Submit workflow
- ✅ Response viewing and CSV export
- ✅ Conditional logic (skip-based branching)
- ✅ Collapsible group sections
- ✅ Min/max validation for number fields

## Active Development: Dual-View Form Renderer

**Goal:** Add a traditional vertical form renderer alongside the existing Handsontable grid view to improve UX for long forms (20-30+ fields).

### Design Decision
- **Form View**: New default for data entry - vertical Bootstrap form with collapsible accordion sections
- **Table View**: Existing Handsontable renderer - available as optional "review mode" for power users
- **View Toggle**: Users can switch between views; data model is shared

### Implementation Status
- [x] Phase 1: New form renderer (`js/form-renderer-standard.js`)
- [x] Phase 2: View toggle integration in `signin.html`
- [ ] Phase 3: Enhanced section navigation
- [ ] Phase 4: Polish and UX improvements

### Key Files for This Feature
| File | Role |
|------|------|
| `js/form-renderer.js` | **Existing** Handsontable renderer (keep as-is, rename to `form-renderer-table.js`) |
| `js/form-renderer-standard.js` | **New** Bootstrap form renderer (to be created) |
| `signin.html` | Update to support view toggle |
| `css/styles.css` | Add styles for new form components |
| `docs/csv-structure.md` | Reference for field types and conditional logic |

## Architecture

### Technology Stack
- **No build tools**: Pure ES6 modules, all dependencies via CDN
- **Firebase v10.7.1**: Authentication (email/password) + Firestore database
- **Bootstrap 5.3**: UI framework
- **Handsontable CE 14.x**: Grid-based form rendering
- **PapaParse 5.4.1**: CSV parsing
- **Hosting**: GitHub Pages

### Key Files
| File | Purpose |
|------|---------|
| `signin.html` | Coder sign-in, dashboard, form entry |
| `admin.html` | Admin panel (users, templates, responses) |
| `js/firebase-config.js` | Firebase initialization |
| `js/auth.js` | Authentication functions (including user creation) |
| `js/firestore-service.js` | All Firestore CRUD operations |
| `js/template-parser.js` | CSV → JSON schema conversion |
| `js/form-renderer.js` | Handsontable dynamic form rendering |
| `docs/csv-structure.md` | Comprehensive CSV template specification |
| `firestore.rules` | Firestore security rules (minimal for dev) |
| `firestore.rules.production` | Strict rules for production use |

## Firestore Data Model

### Collections

```
users/{email}
├── email: string
├── role: "admin" | "coder"
├── assignedJobs: string[]
├── createdAt: timestamp
├── updatedAt: timestamp (optional)
└── status: "active" | "disabled"

templates/{jobId}
├── jobId: string
├── title: string
├── description: string
├── version: number
├── helpDisplay: "tooltip" | "column" | "inline"
├── fields: [{ id, type, label, help, required, options, group, itemId, skipIf, skipToFieldId, minValue, maxValue, ... }]
├── groups: string[] (unique group names extracted from fields, in order of first appearance)
├── createdBy: string
├── createdAt: timestamp
├── updatedAt: timestamp
└── status: "active" | "archived"

responses/{responseId}
├── responseId: string (format: email_jobId_timestamp)
├── userEmail: string
├── jobId: string
├── templateVersion: number
├── status: "draft" | "submitted"
├── data: { fieldId: value, fieldId_note: value, ... }
├── createdAt: timestamp
├── updatedAt: timestamp
└── submittedAt: timestamp | null
```

## Firestore Security Rules

### Development Rules (Current)
The current `firestore.rules` uses minimal/permissive rules for development:
```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
This allows any authenticated user to read/write all documents.

### Production Rules
When deploying to production, use `firestore.rules.production` which enforces:
- Admins: full CRUD on all collections
- Coders: read templates, read/write own responses only
- No deletions of responses

**To deploy production rules:**
1. Copy contents of `firestore.rules.production` to Firebase Console > Firestore > Rules
2. Or rename the file and deploy via Firebase CLI

## User Management

### Creating Users

Users require both:
1. **Firebase Auth account** - for authentication (email/password)
2. **Firestore user document** - for role and job assignments

#### Manual Creation (Admin Panel)
1. Click "+ Add User"
2. Enter email, password (min 6 chars), role, assigned jobs
3. Click "Create User"

#### CSV Upload
1. Click "↑ Upload CSV"
2. Select CSV file with format:
```csv
user_email,password,assigned_jobs,role
john@example.com,SecurePass123!,"job-1,job-2",coder
```
3. Preview and confirm

**CSV Column Mapping:**
- `user_email` or `email` → user's email
- `password` → user's password (min 6 chars)
- `assigned_jobs` or `assignedJobs` → comma-separated job IDs
- `role` → "admin" or "coder"

**Process:**
- Users are created one at a time (Firebase Auth limitation)
- Progress bar shows status
- Admin is re-authenticated after each user creation
- Failed users are reported at the end

### Editing/Deleting Users
- Edit: Change role, assigned jobs, or status (active/disabled)
- Delete: Removes Firestore document only; Firebase Auth account persists
- To fully remove a user, also delete from Firebase Console > Authentication

## Template Management

### Template CSV Format (v3.0)

**See [docs/csv-structure.md](docs/csv-structure.md) for complete specification.**

**Quick Reference:**
```csv
item_id,field_id,field_type,label,help_text,required,options,default_value,skip_if,skip_to_field_id,group,min_value,max_value
10,country,text,Country Name,Official name,yes,,,,,Basic Info,,
20,has_ref,radio,Has referendum?,Select Yes/No,yes,Yes|No,,No,notes,Basic Info,,
30,threshold,number,Threshold (%),Percentage required,no,,,,,Basic Info,0,100
40,notes,textarea,Notes,Additional comments,no,,,,,,,
```

**Column Overview:**
- `item_id` (optional): Numeric ordering (e.g., 10, 20, 30), allows gaps for future insertions
- `field_id` (required): Unique field identifier
- `field_type` (required): text, textarea, number, date, dropdown, radio
- `label` (required): Display label
- `help_text` (optional): Help tooltip text
- `required` (optional): yes/true/1 = required
- `options` (optional): Pipe-separated values for dropdown/radio (e.g., Yes|No|Maybe)
- `default_value` (optional): Pre-filled value
- `skip_if` (optional): Value that triggers skip logic (e.g., "No")
- `skip_to_field_id` (optional): Target field to jump to (hides fields in between)
- `group` (optional): Section name for grouping (auto-generates collapsible headers)
- `min_value` (optional): Minimum value for number fields
- `max_value` (optional): Maximum value for number fields

### Field Types
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `dropdown`: Single select from options (pipe-separated)
- `radio`: Radio buttons for 2-5 options
- `number`: Numeric input with optional min/max validation
- `date`: Date with text input (YYYY-MM-DD) + calendar picker button

### Conditional Logic

Fields can use skip logic to create branching forms:
- Set `skip_if` to the value that triggers the skip (e.g., "No")
- Set `skip_to_field_id` to the target field to jump to
- All fields between the trigger and target will be hidden when condition is met

**Example:**
```csv
item_id,field_id,field_type,label,skip_if,skip_to_field_id
10,has_parliament,radio,Parliament exists?,No,final_notes
20,parliament_type,dropdown,Type of Parliament,,,
30,parliament_seats,number,Number of Seats,,,
40,final_notes,textarea,Final Notes,,,
```
If user selects "No" for `has_parliament`, fields 20-30 are hidden and form jumps to field 40.

### Group Sections

Use the `group` column to organize fields into collapsible sections:
- Fields with the same `group` value appear under a shared header
- Headers are auto-generated (do NOT include as CSV rows)
- Click ▶/▼ icon to expand/collapse sections
- Empty `group` values create ungrouped fields

### Available Templates

| Template | Fields | Purpose | Features |
|----------|--------|---------|----------|
| `simple-survey.csv` | 8 | Basic customer satisfaction survey | Skip logic, min/max validation |
| `conditional-form.csv` | 10 | Country governance assessment | Multiple skip conditions, 3 groups |
| `grouped-likert.csv` | 17 | Employee engagement survey | 5 groups, Likert scales |
| `document-coding.csv` | 17 | Research document coding | 3 groups, skip logic, quality scoring |

## Recent Bug Fixes

### 1. Data Loss on Submit - FIXED
**Problem**: Changes in current cell not saved when clicking Submit.
**Solution**: Added `syncAllInputs()` function that forces all inputs to dispatch events before data extraction.

### 2. Date Field Entry - FIXED
**Problem**: HTML5 date picker had issues with year entry.
**Solution**: Hybrid approach with text input (YYYY-MM-DD) + calendar button (📅).

### 3. User CSV Upload Permissions - FIXED
**Problem**: Permission denied when creating Firestore user documents after CSV upload.
**Solution**: Simplified Firestore rules to allow any authenticated user to write. Production rules available separately.

### 4. Input Event Handling - IMPROVED
**Change**: Switched from `onchange` to `oninput` for immediate data capture on text/textarea/number fields.

### 5. Admin Logout During User Creation - FIXED
**Problem**: Admin was logged out and re-authenticated during user creation, causing auth state warnings and jarring UX.
**Solution**: Added `isCreatingUser` flag to suppress auth state listener warnings during user creation process. Admin remains seamlessly authenticated throughout.

### 6. Collapsible Group Sections - IMPLEMENTED
**Problem**: Group headers needed proper collapsible functionality.
**Solution**: Auto-generated group headers based on `group` column:
- Headers are dynamically inserted when `group` value changes (not CSV rows)
- Clickable toggle icon (▶/▼) to expand/collapse groups
- Answer, help, and notes cells hidden for header rows
- Visual styling with blue left border and gray background
- State persists across renders

### 7. CSV Structure Redesign (v2.x → v3.0) - IMPLEMENTED
**Problem**: Template CSV structure had three limitations:
1. Inflexible conditional logic (single `skip_to_if_no` column)
2. No explicit field ordering (relied on `field_id` naming)
3. Section headers were treated as CSV rows (using `_header` suffix hack)

**Solution**: Complete CSV structure redesign:
- **Breaking changes** - new column schema incompatible with v2.x templates
- Added `item_id` column for explicit numeric ordering (10, 20, 30 with gaps)
- Split conditional logic into `skip_if` + `skip_to_field_id` for flexibility
- Removed `_header` suffix pattern - headers auto-generated from `group` column
- Added `min_value` and `max_value` columns for number field validation
- Removed unused columns: `validation`, `width`, `skipToIfNo`
- Fields sorted by `item_id` (if present), otherwise CSV order maintained
- Comprehensive validation: duplicate IDs, skip logic references, min/max constraints
- See [docs/csv-structure.md](docs/csv-structure.md) for full specification

## Key Workflows

### Form Data Flow
1. Template loaded → fields array passed to `initializeForm()`
2. Fields sorted by `item_id` (if present), groups extracted
3. `buildDataArray()` inserts auto-generated group headers where group changes
4. Handsontable renders with custom renderers for each cell type
5. `updateHiddenFields()` evaluates skip logic and marks fields to hide
6. User edits trigger immediate data sync via `oninput` events
7. Skip conditions re-evaluated on every change (fields show/hide dynamically)
8. `syncAllInputs()` called before save/submit to capture pending edits
9. `extractResponseData()` reads from Handsontable source data (skips group headers)
10. Data saved to Firestore via `updateResponseData()`

### Conditional Logic Flow
1. User changes field value → triggers `oninput` event
2. `extractResponseData()` called with fields array
3. `updateHiddenFields()` checks all skip conditions against current values
4. If `skip_if` value matches, all fields between current and `skip_to_field_id` are hidden
5. Handsontable re-renders with `isRowHidden()` checking `hiddenFieldIds` set
6. Hidden fields are not validated or included in required field checks

### User Creation Flow (CSV)
1. Admin uploads CSV → PapaParse parses to array
2. For each user:
   a. Create Firebase Auth account (signs in as new user)
   b. Re-authenticate as admin
   c. Create Firestore user document
3. Report successes and failures

## File Structure

```
form-01/
├── index.html              # Landing page
├── index.qmd               # Quarto source for landing page
├── signin.html             # Coder interface
├── admin.html              # Admin panel
├── css/
│   └── styles.css          # Custom styles
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── auth.js             # Authentication functions
│   ├── firestore-service.js # Firestore CRUD
│   ├── template-parser.js  # CSV parsing
│   └── form-renderer.js    # Handsontable rendering
├── docs/
│   └── csv-structure.md    # CSV template specification v3.0
├── templates/
│   ├── simple-survey.csv
│   ├── conditional-form.csv
│   ├── grouped-likert.csv
│   └── document-coding.csv
├── scripts/
│   ├── upload_templates.py # Python script for bulk template upload
│   ├── requirements.txt    # Python dependencies
│   ├── firebase-config.json.example  # Example service account key
│   └── README.md           # Script documentation
├── users/
│   └── users.csv           # Example users CSV
├── firestore.rules         # Current rules (minimal/dev)
├── firestore.rules.production # Strict rules for production
├── README.md
└── CLAUDE.md
```

## Common Issues & Solutions

### Issue: "Permission denied" when creating users
- Ensure `firestore.rules` has been deployed to Firebase Console
- Current rules allow any authenticated user to write
- Check Firebase Console > Firestore > Rules

### Issue: Admin gets signed out when creating users
- Expected behavior - creating user signs in as that user
- App automatically re-authenticates admin
- Ensure admin credentials are stored (happens on login)

### Issue: User can sign in but sees "User profile not found"
- User exists in Firebase Auth but not in Firestore
- Create Firestore document via admin panel (edit user) or manually

### Issue: Form data not saving
- Check browser console for errors
- Verify `syncAllInputs()` is called before `extractResponseData()`
- Check Firestore rules allow writes

### Issue: Date field showing wrong format
- Expected format: YYYY-MM-DD (ISO)
- Use the 📅 button for calendar picker
- Manual entry requires YYYY-MM-DD format

## Future Enhancements (Phase 2+)

### Completed in v3.0
- [x] **Conditional logic**: Skip-based branching with `skip_if` + `skip_to_field_id`
- [x] **Grouped display**: Collapsible sections based on `group` field
- [x] **Min/max validation**: Number field constraints

### Planned Features
- [ ] **Template versioning system**: Use versioned job IDs (`simple-survey-v1`, `simple-survey-v2`) to prevent orphaned responses when templates change
- [ ] **Response migration**: Auto-update old responses to new template schemas
- [ ] **Advanced validation**: Regex patterns, custom validators
- [ ] **Complex skip logic**: Multiple conditions, AND/OR logic
- [ ] **Skip backwards**: Currently only forward jumps supported
- [ ] **Field dependencies**: Show/hide based on multiple field values
- [ ] **Response editing by admin**: Allow admins to edit submitted responses
- [ ] **Email notifications**: Notify users of assignments, reminders
- [ ] **Form builder UI**: Visual CSV editor for creating templates

## Development Notes

### Uploading Templates (Fast Method)

For testing and debugging, use the Python script to upload templates directly to Firestore:

```bash
# One-time setup - Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r scripts/requirements.txt

# Get Firebase service account key (one time)
# 1. Firebase Console > Project Settings > Service Accounts
# 2. Generate New Private Key
# 3. Save as scripts/firebase-config.json

# Always activate virtual environment first
source venv/bin/activate

# Upload all templates
python scripts/upload_templates.py

# Upload specific template
python scripts/upload_templates.py simple-survey

# Clear and re-upload
python scripts/upload_templates.py --clear

# Validate without uploading
python scripts/upload_templates.py --dry-run

# When done, deactivate
deactivate
```

**Benefits:**
- ⚡ Much faster than admin panel (2 seconds vs minutes)
- ✅ Validates CSV structure before upload
- 🔄 Easy to iterate during development
- 🔒 Uses service account (no manual auth needed)
- 🐍 Virtual environment keeps dependencies isolated (~20MB)
- 📝 See [scripts/README.md](scripts/README.md) and [scripts/SETUP.md](scripts/SETUP.md) for full documentation

**Setup Requirements:**
- Python 3.7+ (you have Python 3.13.5 ✓)
- Virtual environment (recommended for modern Python)
- Firebase service account key

### Deploying Firestore Rules
```bash
# Using Firebase CLI
firebase deploy --only firestore:rules

# Or manually copy to Firebase Console > Firestore > Rules
```

### Testing User Management
1. Clear all collections in Firestore (if starting fresh)
2. Ensure your admin user exists in both Auth and Firestore
3. Deploy the minimal `firestore.rules`
4. Upload users via CSV
5. Verify users appear in both Auth and Firestore

### Adding a New Field Type
1. Add type to `validTypes` in [template-parser.js:82](js/template-parser.js#L82)
2. Add case in `answerRenderer()` in [form-renderer.js:357](js/form-renderer.js#L357)
3. Ensure proper event handling (`oninput` for immediate sync)
4. Update [docs/csv-structure.md](docs/csv-structure.md) and CLAUDE.md

### Working with Conditional Logic
- Skip logic only works **forward** (current field → later field)
- Fields between trigger and target are **hidden** (not just skipped)
- Hidden fields are **not validated** (required checks skipped)
- Skip conditions re-evaluate on **every field change**
- Use `item_id` ordering to ensure skip targets come after triggers

### Working with Groups
- Groups are **auto-generated** - don't add header rows to CSV
- Group names extracted from `group` column in order of first appearance
- Empty `group` values create ungrouped fields (no header)
- Collapsed state persists during form session
- Group headers use special `isGroupHeader: true` flag

## Contact

Project Owner: Fernando Mendez
Repository: https://github.com/fmendez72/form-01
Firebase Project: data-collector-2025

---

## Technical Specification: Standard Form Renderer

### Overview

Create `js/form-renderer-standard.js` - a new form renderer using Bootstrap 5 form components instead of Handsontable grid. This provides a traditional vertical form layout better suited for guided data entry.

### API Contract (Must Match Existing)

The new renderer must export the same functions as `form-renderer.js`:

```javascript
// Required exports (same signature as existing)
export function initializeForm(containerId, template, responseData, options = {});
export function extractResponseData(fields);
export function validateForm(fields);
export function syncAllInputs();
export function destroyForm();
export function getHotInstance(); // Can return null for this renderer
```

### Data Flow (Unchanged)

1. `signin.html` calls `initializeForm()` with template and response data
2. Renderer displays fields, user makes edits
3. On blur/change, data syncs internally (auto-save calls `extractResponseData()`)
4. On save/submit, `syncAllInputs()` called, then `extractResponseData()` returns `{ fieldId: value, fieldId_note: value }`
5. `validateForm()` returns `{ valid: boolean, errors: [] }`

### Field Type Rendering

| CSV field_type | HTML Element | Bootstrap Classes |
|----------------|--------------|-------------------|
| text | `<input type="text">` | `form-control` |
| textarea | `<textarea>` | `form-control`, rows=3 |
| number | `<input type="number">` | `form-control` |
| date | `<input type="text">` + calendar button | `form-control` + button |
| dropdown | `<select>` | `form-select` |
| radio | `<input type="radio">` group | `form-check`, `form-check-input`, `form-check-inline` |

### Section/Group Rendering

Use Bootstrap 5 Accordion for collapsible groups:

```html
<div class="accordion" id="formAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#group-basic-info">
        Basic Information
        <span class="badge bg-secondary ms-2">3/5 complete</span>  <!-- completion indicator -->
      </button>
    </h2>
    <div id="group-basic-info" class="accordion-collapse collapse show">
      <div class="accordion-body">
        <!-- fields here -->
      </div>
    </div>
  </div>
</div>
```

### Conditional Logic (Skip)

Reuse the same logic from existing renderer:

1. Maintain `hiddenFieldIds` Set
2. On any field change, call `updateHiddenFields(fields, currentData)`
3. Hidden fields get `d-none` class (Bootstrap utility)
4. Hidden fields excluded from validation

### Field Layout Structure

```html
<div class="mb-3 form-field" data-field-id="country_name">
  <label class="form-label">
    Country Name
    <span class="text-danger">*</span>  <!-- if required -->
    <span class="help-icon ms-1" title="Help text here">ⓘ</span>  <!-- if help_text -->
  </label>
  <input type="text" class="form-control" id="field-country_name">
  <div class="invalid-feedback">This field is required</div>
  
  <!-- Notes field (collapsible or always visible) -->
  <div class="mt-2">
    <label class="form-label small text-muted">Notes</label>
    <input type="text" class="form-control form-control-sm" id="field-country_name_note" placeholder="Optional notes">
  </div>
</div>
```

### State Management

Store current values in a simple object (no need for Handsontable's complex data model):

```javascript
let formData = {};  // { fieldId: value, fieldId_note: value }
let hiddenFieldIds = new Set();
let formContainer = null;
let currentFields = [];
```

### Event Handling

- Use `oninput` for text/textarea/number (immediate sync)
- Use `onchange` for select/radio (on selection)
- Debounce is handled by caller (auto-save in signin.html)

### Validation Display

Use Bootstrap's validation classes:
- Invalid: add `is-invalid` class to input, show `.invalid-feedback`
- Valid: add `is-valid` class (optional, for visual feedback)

### CSS Additions Needed

Add to `css/styles.css`:

```css
/* Standard Form Renderer */
.form-field {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.form-field:last-child {
  border-bottom: none;
}

.form-field.is-hidden {
  display: none;
}

/* Section completion badges */
.accordion-button .badge {
  font-weight: normal;
  font-size: 0.75em;
}

.section-complete {
  color: var(--success-color);
}

.section-incomplete {
  color: var(--secondary-color);
}

/* Notes toggle */
.notes-toggle {
  font-size: 0.85em;
  color: var(--secondary-color);
  cursor: pointer;
}

.notes-toggle:hover {
  color: var(--primary-color);
}
```

### View Toggle Integration

In `signin.html`, add view toggle buttons:

```html
<div class="btn-group btn-group-sm mb-3" role="group">
  <button type="button" class="btn btn-outline-primary active" id="formViewBtn">
    📝 Form View
  </button>
  <button type="button" class="btn btn-outline-primary" id="tableViewBtn">
    📊 Table View
  </button>
</div>
```

Toggle logic:
1. Store current view preference in `localStorage`
2. On toggle, call `destroyForm()` then re-initialize with other renderer
3. Pass same `responseData` (extracted before destroy) to new renderer

### File Renaming Plan

1. Rename `js/form-renderer.js` → `js/form-renderer-table.js`
2. Create `js/form-renderer-standard.js` (new)
3. Create `js/form-renderer.js` as facade that delegates to active renderer

Or simpler: keep both renderers separate, import both in signin.html, toggle between them.

### Testing Checklist

- [ ] All 6 field types render correctly
- [ ] Required field indicators show
- [ ] Help text displays (tooltip or inline)
- [ ] Conditional logic hides/shows fields
- [ ] Accordion sections expand/collapse
- [ ] Completion indicators update on field change
- [ ] extractResponseData() returns same format as Handsontable renderer
- [ ] validateForm() catches missing required fields
- [ ] Notes fields capture data correctly
- [ ] View toggle preserves data when switching
- [ ] Auto-save works with new renderer
- [ ] Submit workflow completes successfully
