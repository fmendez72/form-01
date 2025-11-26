# Political Data Collection App v3.0

A serverless web application for systematic collection of political science research data, built with Firebase and deployed to GitHub Pages.

**Repository**: https://github.com/fmendez72/form-01

## Features

- **Flexible Questionnaires**: CSV-defined templates with multiple field types
- **Role-Based Access**: Admin and Coder roles with appropriate permissions
- **User Management**: Create users manually or via CSV upload (with passwords)
- **Auto-Save Drafts**: Automatic draft saving every 30 seconds
- **Progress Tracking**: Visual completion indicators
- **CSV Export**: Export submitted responses for analysis
- **Help Text**: Configurable help display (tooltip, column, or inline)

## Technology Stack

- **Frontend**: HTML5, CSS3, ES6 JavaScript modules
- **UI Framework**: Bootstrap 5.3 (CDN)
- **Grid Component**: Handsontable CE 14.x (CDN)
- **Backend**: Firebase Authentication + Firestore
- **Hosting**: GitHub Pages

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `data-collector-2025`
3. Deploy Firestore rules from `firestore.rules`

### 2. Create Initial Admin User

**In Firebase Console:**
1. Authentication > Add user (email/password)
2. Firestore > users collection > Add document:
   - Document ID: user's email
   - Fields:
   ```json
   {
     "email": "your@email.com",
     "role": "admin",
     "assignedJobs": [],
     "status": "active"
   }
   ```

### 3. Deploy to GitHub Pages

```bash
git add .
git commit -m "Deploy"
git push origin main
```

Enable GitHub Pages: Settings > Pages > Source: main branch

## Project Structure

```
form-01/
├── index.html          # Landing page
├── signin.html         # Coder sign-in and dashboard
├── admin.html          # Admin panel
├── css/styles.css      # Custom styles
├── js/
│   ├── firebase-config.js    # Firebase initialization
│   ├── auth.js               # Authentication functions
│   ├── firestore-service.js  # Database operations
│   ├── template-parser.js    # CSV parsing
│   └── form-renderer.js      # Handsontable configuration
├── templates/                # Example template CSVs
├── users/users.csv           # Example users CSV
├── firestore.rules           # Security rules (dev)
├── firestore.rules.production # Security rules (production)
└── CLAUDE.md                 # Detailed AI context file
```

## Usage

### For Administrators

1. Go to `admin.html` and sign in
2. **Users**: 
   - Add single user with email/password
   - Upload CSV for bulk user creation
   - Edit roles, assigned jobs, status
3. **Templates**: Upload CSV to create questionnaires
4. **Responses**: View, filter, and export data

### For Coders (Research Assistants)

1. Go to `signin.html` and sign in
2. Select an assigned job
3. Complete the questionnaire
4. Save draft or submit final response

## CSV Formats

### Users CSV

```csv
user_email,password,assigned_jobs,role
admin@example.com,Admin123!,"ref-1,agenda-1",admin
coder1@example.com,Coder123!,ref-1,coder
```

**Notes:**
- Passwords: minimum 6 characters
- Multiple jobs: comma-separated within quotes
- Role: `admin` or `coder`

### Template CSV

```csv
field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no,group
q1,dropdown,Question?,Help text,yes,Yes|No|Unknown,,q5,Section A
```

**Field Types:**
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `dropdown`: Single select (options pipe-separated)
- `radio`: Radio buttons
- `number`: Numeric input
- `date`: Date picker with text input

## Example Templates

| Template | Fields | Description |
|----------|--------|-------------|
| `referendum-example.csv` | 8 | Basic referendum assessment |
| `governance-assessment.csv` | 30 | Long-form with conditional logic |
| `employee-survey-grouped.csv` | 20 | Grouped items (4 groups) |
| `document-coding.csv` | 24 | Document coding platform |

## Security

### Development Rules (firestore.rules)
Permissive rules allowing any authenticated user to read/write.

### Production Rules (firestore.rules.production)
Strict role-based access control:
- Admins: full access
- Coders: read templates, manage own responses
- No response deletion

**To enable production rules:**
Copy `firestore.rules.production` to Firebase Console > Firestore > Rules

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied on user creation | Deploy `firestore.rules` to Firebase |
| User profile not found | Create Firestore document for user |
| Data not saving | Check browser console, verify rules |
| Date picker issues | Use YYYY-MM-DD format or 📅 button |

## Documentation

- **CLAUDE.md**: Detailed technical documentation for AI assistants
- **Requirements.md**: Original project requirements
- **FreshPrompt.md**: Initial development prompt

## License

MIT License

## Contact

Project Owner: Fernando Mendez
