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
- **Hosting**: GitHub Pages (static)

### Key Files
| File | Purpose |
|------|---------|
| `signin.html` | Coder sign-in, dashboard, form entry |
| `admin.html` | Admin panel (users, templates, responses) |
| `js/firebase-config.js` | Firebase initialization |
| `js/auth.js` | Authentication functions |
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

## Common Issues & Solutions

### Issue: Form not rendering
- Check browser console for Handsontable errors
- Verify template has valid fields array
- Ensure Handsontable CSS/JS loaded from CDN

### Issue: Authentication errors
- Verify user exists in both Firebase Auth AND Firestore users collection
- Check role field matches expected value

### Issue: Permission denied on Firestore
- Deploy latest `firestore.rules`
- Verify user email matches document ownership
- Check draft status for update operations

## Future Enhancements (Phase 2+)

- [ ] Conditional logic (`skip_to_if_no` field)
- [ ] Template versioning with migration
- [ ] Response editing by admin
- [ ] Email notifications
- [ ] Form builder UI
- [ ] Advanced validation rules

## Development Notes

### Adding a New Field Type
1. Add type to `validTypes` in `template-parser.js`
2. Add case in `answerRenderer()` in `form-renderer.js`
3. Update documentation

### Modifying Firestore Schema
1. Update `firestore-service.js` functions
2. Update `firestore.rules` if permissions change
3. Test with fresh data (or write migration script)

## Contact

Project Owner: Fernando Mendez
Repository: https://github.com/fmendez72/form-01
