# CLAUDE.md - AI Context File

## Project Overview

Political Data Collection App v3.0 - A serverless SPA for systematic collection of political science research data. Complete redesign from v2.2 to address flexibility and usability limitations.

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
| `firestore.rules` | Firestore security rules |

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
├── fields: [{ id, type, label, help, required, options, ... }]
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

## User Management

### Creating Users

Users require both:
1. **Firebase Auth account** - for authentication (email/password)
2. **Firestore user document** - for role and job assignments

#### Manual Creation (Admin Panel)
- Admin enters email, password, role, and assigned jobs
- App creates Firebase Auth account via `createUserWithEmailAndPassword()`
- App then creates Firestore document
- **Note**: Creating a user temporarily signs out the admin; app re-authenticates automatically

#### CSV Upload
CSV format: `user_email,password,assigned_jobs,role`

Example:
```csv
user_email,password,assigned_jobs,role
admin@example.com,Admin123!,"ref-1,agenda-1",admin
coder1@example.com,Coder123!,ref-1,coder
coder2@example.com,Coder456!,"ref-1,agenda-1",coder
```

**Important notes:**
- Passwords must be at least 6 characters
- `assigned_jobs` can be comma-separated within quotes
- Users are created one at a time (not batched) due to Firebase Auth limitations
- Progress bar shows creation status
- Failed users are reported at the end

### Editing/Deleting Users
- Edit: Change role, assigned jobs, or status (active/disabled)
- Delete: Removes Firestore document only; Firebase Auth account persists
- To fully remove a user, delete from Firebase Console > Authentication

## Key Workflows

### Template Creation
1. Admin uploads CSV file
2. `template-parser.js` parses CSV → field array
3. `createTemplateSchema()` wraps fields with metadata
4. `createTemplate()` stores in Firestore

### Form Entry
1. Coder selects job from dashboard
2. `getOrCreateResponse()` returns existing draft or creates new
3. `initializeForm()` renders Handsontable with dynamic column types
4. Auto-save every 30 seconds via `updateResponseData()`
5. Submit changes status to "submitted", locks editing

### Response Export
1. Admin filters by job
2. `responsesToCSV()` generates CSV with all fields + notes
3. Download triggered via blob URL

## Admin Panel Features

### Users Section
- View all users in table format
- Add single user (with password)
- Upload users via CSV (creates Auth + Firestore)
- Edit user (role, jobs, status)
- Delete user (Firestore only)

### Templates Section
- View all templates
- Upload new template CSV
- View template details (fields, options)
- Delete template

### Responses Section
- View all responses
- Filter by job and status
- View individual response details
- Export to CSV (submitted only)

## Common Issues & Solutions

### Issue: "Cannot create user" error
- Check password is at least 6 characters
- Email might already exist in Firebase Auth
- Check browser console for specific error

### Issue: Admin gets signed out when creating users
- This is expected behavior - creating a user via client SDK signs in as that user
- App automatically re-authenticates admin using stored credentials
- If re-auth fails, admin needs to sign in again

### Issue: User can sign in but sees "User profile not found"
- User exists in Firebase Auth but not in Firestore
- Create Firestore document manually or via admin panel

### Issue: Form not rendering
- Check browser console for Handsontable errors
- Verify template has valid fields array
- Ensure Handsontable CSS/JS loaded from CDN

### Issue: Permission denied on Firestore
- Deploy latest `firestore.rules`
- Verify user email matches document ownership
- Check draft status for update operations

## CSV Formats

### Users CSV
```csv
user_email,password,assigned_jobs,role
john@example.com,SecurePass123!,"job-1,job-2",coder
```

### Template CSV
```csv
field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no
q1,dropdown,Question text?,Help text,yes,Yes|No|Unknown,,q5
q2,text,Text question,Instructions,no,,,
```

## File Locations

```
form-01/
├── index.html          # Landing page
├── signin.html         # Coder interface
├── admin.html          # Admin panel
├── css/styles.css      # Custom styles
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── firestore-service.js
│   ├── template-parser.js
│   └── form-renderer.js
├── templates/
│   └── referendum-example.csv
├── users/
│   └── users.csv       # Example users CSV
├── firestore.rules
├── README.md
└── CLAUDE.md
```

## Future Enhancements (Phase 2+)

- [ ] Conditional logic (`skip_to_if_no` field)
- [ ] Template versioning with migration
- [ ] Response editing by admin
- [ ] Email notifications
- [ ] Form builder UI
- [ ] Advanced validation rules
- [ ] Bulk user deletion (requires Firebase Admin SDK / Cloud Functions)

## Development Notes

### Adding a New Field Type
1. Add type to `validTypes` in `template-parser.js`
2. Add case in `answerRenderer()` in `form-renderer.js`
3. Update documentation

### Modifying Firestore Schema
1. Update `firestore-service.js` functions
2. Update `firestore.rules` if permissions change
3. Test with fresh data (or write migration script)

### Firebase Auth Limitations (Client-Side)
- Cannot delete Auth users from client SDK
- Cannot list all Auth users from client SDK
- Creating users signs in as the new user (requires re-auth)
- For full user management, consider Firebase Admin SDK via Cloud Functions

## Contact

Project Owner: Fernando Mendez
Repository: https://github.com/fmendez72/form-01
