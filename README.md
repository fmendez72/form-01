# Political Data Collection App v3.0

A serverless web application for systematic collection of political science research data, built with Firebase and deployed to GitHub Pages.

## Features

- **Flexible Questionnaires**: CSV-defined templates with multiple field types (dropdown, text, textarea, radio, number, date)
- **Role-Based Access**: Admin and Coder roles with appropriate permissions
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
├── index.qmd           # Quarto landing page source
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
├── firestore.rules     # Firestore security rules
└── README.md
```

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (data-collector-2025)
3. Clear existing Firestore collections if migrating from v2.2
4. Deploy security rules from `firestore.rules`

### 2. Create Initial Admin User

In Firebase Console > Authentication:
1. Add a user with email/password
2. In Firestore, create document in `users` collection:
   - Document ID: user's email
   - Fields: `{ email: "...", role: "admin", assignedJobs: [], status: "active" }`

### 3. Deploy to GitHub Pages

1. Push to GitHub repository
2. Enable GitHub Pages in Settings > Pages
3. Set source to main branch
4. Render Quarto landing page: `quarto render index.qmd`

### 4. Configure Firebase Hosting (Optional)

If using Firebase Hosting instead of GitHub Pages:
```bash
firebase init hosting
firebase deploy --only hosting
```

## Usage

### For Administrators

1. Go to `admin.html`
2. Sign in with admin credentials
3. **Users**: Create coders via form or CSV upload
4. **Templates**: Upload CSV template to create questionnaires
5. **Responses**: View, filter, and export submitted responses

### For Coders (Research Assistants)

1. Go to `signin.html`
2. Sign in with provided credentials
3. Select an assigned job
4. Complete the questionnaire
5. Save draft or submit final response

## Template CSV Format

```csv
field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no
q1,dropdown,Question text,Help text,yes,Option1|Option2|Option3,,
q2,radio,Yes/No question,Explanation,yes,Yes|No,,
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

## Users CSV Format

```csv
email,role,assigned_jobs
coder1@example.com,coder,referendum-2024|initiative-2024
coder2@example.com,coder,referendum-2024
admin@example.com,admin,
```

## License

MIT License
