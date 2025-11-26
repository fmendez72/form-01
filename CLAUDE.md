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
├── fields: [{ id, type, label, help, required, options, group, ... }]
├── groups: string[] (unique group names extracted from fields)
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

### Template CSV Format
```csv
field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no,group
q1,dropdown,Question?,Help text,yes,Yes|No|Unknown,,q5,Section A
```

### Field Types
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `dropdown`: Single select from options (pipe-separated)
- `radio`: Radio buttons for 2-5 options
- `number`: Numeric input
- `date`: Date with text input + calendar picker button

### Available Templates

| Template | Fields | Purpose |
|----------|--------|---------|
| `referendum-example.csv` | 8 | Basic referendum assessment |
| `governance-assessment.csv` | 30 | Long-form country governance with sections |
| `employee-survey-grouped.csv` | 20 | Grouped items demonstration (4 groups) |
| `document-coding.csv` | 24 | Research document coding platform |

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

## Key Workflows

### Form Data Flow
1. Template loaded → fields array passed to `initializeForm()`
2. Handsontable renders with custom `answerRenderer()` for each cell
3. User edits trigger immediate data sync via `oninput` events
4. `syncAllInputs()` called before save/submit to capture pending edits
5. `extractResponseData()` reads from Handsontable source data
6. Data saved to Firestore via `updateResponseData()`

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
├── templates/
│   ├── referendum-example.csv
│   ├── governance-assessment.csv
│   ├── employee-survey-grouped.csv
│   └── document-coding.csv
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

### Planned Features
- [ ] **Conditional logic**: Implement `skip_to_if_no` field jumping
- [ ] **Grouped display**: Collapsible sections based on `group` field
- [ ] **Validation**: Implement regex validation patterns
- [ ] Template versioning with migration
- [ ] Response editing by admin
- [ ] Email notifications
- [ ] Form builder UI

## Development Notes

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
1. Add type to `validTypes` in `template-parser.js`
2. Add case in `answerRenderer()` in `form-renderer.js`
3. Ensure proper event handling
4. Update documentation

## Contact

Project Owner: Fernando Mendez
Repository: https://github.com/fmendez72/form-01
Firebase Project: data-collector-2025
