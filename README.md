# Political Data Collection App v3.0

A serverless web application for systematic collection of political science research data, built with Firebase and deployed to GitHub Pages.

## Features

- **Flexible Questionnaires**: CSV-defined templates with multiple field types (dropdown, text, textarea, radio, number, date)
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

## Project Structure

```
form-01/
├── index.html          # Landing page
├── signin.html         # Coder sign-in and dashboard
├── admin.html          # Admin panel
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── firebase-config.js    # Firebase initialization
│   ├── auth.js               # Authentication functions
│   ├── firestore-service.js  # Database operations
│   ├── template-parser.js    # CSV parsing
│   └── form-renderer.js      # Handsontable configuration
├── templates/
│   └── referendum-example.csv  # Example template
├── users/
│   └── users.csv             # Example users CSV
├── firestore.rules     # Firestore security rules
├── README.md
└── CLAUDE.md
```

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (data-collector-2025)
3. Clear existing Firestore collections if migrating from v2.2
4. Deploy security rules from `firestore.rules`

### 2. Create Initial Admin User

**Option A: Via Firebase Console**
1. Authentication > Add user (email/password)
2. Firestore > users collection > Add document:
   - Document ID: user's email
   - Fields: `{ email: "...", role: "admin", assignedJobs: [], status: "active" }`

**Option B: Via Admin Panel (after first admin exists)**
1. Sign in as admin
2. Users > Add User
3. Enter email, password, select "Admin" role

### 3. Deploy to GitHub Pages

1. Push to GitHub repository
2. Enable GitHub Pages in Settings > Pages
3. Set source to main branch

## Usage

### For Administrators

1. Go to `admin.html`
2. Sign in with admin credentials
3. **Users**: 
   - Add single user with email/password
   - Upload CSV for bulk user creation
   - Edit user roles, jobs, status
   - Delete users
4. **Templates**: Upload CSV template to create questionnaires
5. **Responses**: View, filter, and export submitted responses

### For Coders (Research Assistants)

1. Go to `signin.html`
2. Sign in with provided credentials
3. Select an assigned job
4. Complete the questionnaire
5. Save draft or submit final response

## CSV Formats

### Users CSV

```csv
user_email,password,assigned_jobs,role
admin@example.com,Admin123!,"ref-1,agenda-1",admin
coder1@example.com,Coder123!,ref-1,coder
coder2@example.com,Coder456!,"ref-1,agenda-1",coder
```

**Notes:**
- Passwords must be at least 6 characters
- Multiple jobs separated by commas within quotes
- Role: `admin` or `coder`

### Template CSV

```csv
field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no
q1,dropdown,Is there a referendum?,Definition...,yes,Yes|No|Unknown,,
q2,radio,Legal basis?,Is there explicit law?,yes,Yes|No,,
q3,text,Text input,Instructions,no,,,
q4,textarea,Long answer,Details,no,,,
q5,number,Numeric value,Format info,yes,,,
q6,date,Date field,Date format,no,,,
```

### Field Types
- `dropdown`: Single select from options
- `radio`: Radio buttons for 2-5 options
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `number`: Numeric input
- `date`: Date picker

## Security Notes

- User deletion from admin panel only removes Firestore document
- Firebase Auth account must be deleted separately in Firebase Console
- Firestore security rules enforce role-based access
- Submitted responses cannot be edited by coders

## License

MIT License
