# Requirements Document: Political Data Collection Web Application v3.0

## Document Purpose
This document specifies requirements for a completely redesigned data collection web application. Use this as the foundation for a fresh implementation in a new repository with a new Firebase project.

---

## 1. PROJECT OVERVIEW

### Project Name
Political Data Collection Web Application (v3.0)

### Core Purpose
Systematic collection of political science research data on citizen-initiated democratic instruments across countries. Enables distributed data collection with role-based access, flexible questionnaire design, and centralized data management.

### Target Users
- **Researchers (Admins)**: Create questionnaires, assign work, review responses
- **Research Assistants (Coders)**: Complete assigned questionnaires, submit responses
- **Future**: Read-only reviewers, external collaborators

---

## 2. ARCHITECTURAL REQUIREMENTS

### Technology Constraints

#### MUST HAVE
- **No Build Tools**: Pure client-side JavaScript (ES6 modules), no Webpack/Vite/npm build process
- **CDN Dependencies Only**: All libraries loaded via CDN (Bootstrap, Firebase, form libraries)
- **Firebase Backend**: Firebase Authentication v9 + Firestore Database (modular SDK)
- **Static Hosting**: Deploy to GitHub Pages or similar static host
- **Modern Browsers**: Support latest Chrome, Firefox, Safari, Edge (ES6+ required)

#### MUST AVOID
- Node.js backend or serverless functions (unless absolutely necessary)
- Complex build pipelines or transpilation
- Large JavaScript frameworks (React, Vue, Angular)
- Database other than Firestore

### Preferred Stack
- **HTML5 + CSS3** with semantic markup
- **Bootstrap 5** for responsive layout (or modern alternative like Tailwind via CDN)
- **JavaScript ES6 Modules** with `import`/`export`
- **Firebase v9 Modular SDK** (auth, firestore)
- **Form/Grid Library**: TBD - more flexible than current Handsontable approach

---

## 3. LANDING PAGE & NAVIGATION

### Landing Page Design

#### Requirement: Quarto-Based Landing
- **Primary landing page** (`index.qmd`) generated with Quarto
- User (developer) will design and maintain this separately
- Landing page should provide links to:
  - **Sign In** page (research assistants/coders)
  - **Admin Panel** (researchers/admins)
  - Project description, documentation, contact info

#### Application Entry Points
The Firebase app should have **clear, well-named entry points**:

**Option 1: Descriptive Names**
- `signin.html` - Coder sign-in and dashboard
- `admin.html` - Admin panel and management
- `app.html` or `dashboard.html` - Main application interface

**Option 2: Role-Based Names**
- `coder.html` - Research assistant interface
- `admin.html` - Administrator interface

**Avoid**: Using `index.html` for anything other than the main landing/routing page

### Navigation Flow
```
Quarto Landing (index.html from index.qmd)
├─> Sign In Page (signin.html or coder.html)
│   └─> Coder Dashboard (after auth)
│       └─> Job Selection → Form Entry
│
└─> Admin Panel (admin.html)
    └─> Admin Dashboard (after auth + role check)
        └─> User Management | Template Management | Response Viewer
```

---

## 4. CORE FUNCTIONAL REQUIREMENTS

### 4.1 User Management

#### User Roles
- **Admin**: Full access (create users, templates, view all responses)
- **Coder**: Limited access (assigned jobs only, own responses)
- **Future**: Reviewer (read-only access to specific responses)

#### User Creation & Assignment
- Admins create users via **CSV upload** or **manual form entry**
- Each user has:
  - Email address (unique identifier)
  - Password (initial, user can reset)
  - Role (admin | coder)
  - Assigned jobs (array of job IDs)
  - Metadata (created date, status)

#### User Authentication
- Email/password authentication via Firebase Auth
- Password reset flow (self-service)
- Email verification (optional but recommended)
- Session management with auto-logout option

---

### 4.2 Template/Questionnaire Management

#### Template Definition

A **template** is a reusable questionnaire schema that defines:
- **Job ID**: Unique identifier (e.g., "referendum-2024")
- **Metadata**: Title, description, version, created date
- **Fields**: Array of field definitions with:
  - Field ID (unique within template)
  - Field type (text, textarea, dropdown, radio, checkbox, number, date)
  - Label/prompt text
  - Help text / definition (tooltip or inline)
  - Validation rules (required, min/max length, regex pattern)
  - Options (for dropdown/radio/checkbox)
  - Default value
  - Column metadata (width, visibility, read-only)

#### Template Creation Workflow

**Option A: CSV-based (Improved)**
- Admin uploads CSV with flexible column mapping
- CSV format supports:
  - Field type specification (dropdown, text, textarea, etc.)
  - Per-field options (for dropdown/radio)
  - Help text in dedicated column
  - Validation rules in dedicated columns
- Example CSV format:

```csv
field_id,field_type,label,help_text,required,options,validation
q1,dropdown,Is there a referendum?,Explanation of referendum,yes,"Yes|No|Unknown",
q2,text,How many signatures?,Number of signatures required,yes,,^\d+$
q3,textarea,Describe the process,Detailed description,no,,
```

**Option B: JSON Schema Upload**
- Admin uploads JSON file defining template schema
- More flexible than CSV but requires technical knowledge
- Example JSON:

```json
{
  "job_id": "referendum-2024",
  "title": "Referendum Analysis",
  "fields": [
    {
      "id": "q1",
      "type": "dropdown",
      "label": "Is there a referendum?",
      "help": "Explanation...",
      "required": true,
      "options": ["Yes", "No", "Unknown"]
    }
  ]
}
```

**Option C: Form Builder UI (Advanced)**
- Visual drag-and-drop template builder
- Admin creates fields interactively
- Preview before saving
- Higher development effort but better UX

**Recommendation**: Start with **Option A (improved CSV)** for MVP, consider Form Builder for v2.

#### Template Versioning
- Templates can be updated (new version created)
- Existing responses linked to specific template version
- Prevents data corruption from template changes

---

### 4.3 Data Entry & Form Rendering

#### Form Display Requirements

**MUST SUPPORT**:
- Dynamic form rendering based on template schema
- Multiple field types: text, textarea, dropdown, radio, checkbox, number, date
- Inline validation (required fields, format checks)
- Help text visible or accessible (icon, tooltip, expandable panel)
- Responsive layout (mobile-friendly)
- Save draft functionality (auto-save + manual save)
- Submit final (locks the response)

**SHOULD SUPPORT**:
- Progress indicator (% complete, filled fields count)
- Field dependencies (conditional show/hide)
- Multi-select dropdowns
- Grouped/sectioned questions
- Rich text in help/definitions
- File upload fields (future)

**COULD SUPPORT**:
- Calculated fields (auto-compute from other answers)
- Cascading dropdowns (options depend on previous answer)
- Undo/redo functionality
- Offline mode (local storage + sync)

#### Form Component Options

**Option 1: Custom Form Renderer**
- Build custom form based on template JSON
- Use native HTML5 form elements + Bootstrap styling
- Pros: Lightweight, full control, simple
- Cons: More development work, less features out-of-box

**Option 2: Form Library (e.g., Formio.js, Survey.js)**
- Use existing form rendering library
- Pros: Rich features, validation, conditional logic
- Cons: Larger bundle size, learning curve, CDN availability

**Option 3: Enhanced Handsontable**
- Keep grid-based approach but make schema flexible
- Pros: Familiar, works well for tabular data
- Cons: Limited for non-tabular questions, not ideal for all field types

**Option 4: Hybrid Approach**
- Table view for tabular questionnaires (Handsontable or simple table)
- Form view for non-tabular questionnaires (custom renderer)
- Let template specify preferred layout

**Recommendation**: **Option 4 (Hybrid)** provides maximum flexibility. Start with custom form renderer (Option 1) for MVP.

---

### 4.4 Response Management

#### Response Data Model
Each response includes:
- **Response ID**: `{user_email}_{job_id}_{timestamp}` or UUID
- **User email**: Submitter
- **Job ID**: Which template
- **Template version**: Link to specific template version
- **Status**: `new` | `draft` | `submitted` | `reviewed` | `archived`
- **Data**: Key-value pairs matching template fields
  ```json
  {
    "q1": "Yes",
    "q2": "500000",
    "q3": "The process requires..."
  }
  ```
- **Metadata**: Created, updated, submitted timestamps, user agent, IP (optional)

#### Response Lifecycle
1. **New**: User loads job, no data entered yet (may not create doc until first save)
2. **Draft**: User saves progress, can edit freely
3. **Submitted**: User finalizes, becomes read-only
4. **Reviewed**: Admin marks as reviewed (optional workflow)
5. **Archived**: Old or invalid responses (soft delete)

#### Admin Response Viewer

**MUST HAVE**:
- View all submitted responses in table format
- Columns: User, Job, Status, Submitted Date, Actions
- Click to view full response (modal or detail page)
- Filter by: user, job, status, date range
- Sort by any column
- Export to CSV (all or filtered)

**SHOULD HAVE**:
- Search across response content
- Side-by-side comparison of responses
- Bulk actions (approve, archive, flag)
- Response editing by admin (with audit trail)
- Data validation checks (highlight incomplete/invalid)

**COULD HAVE**:
- Charts/visualizations of aggregate data
- Response versioning (track edits)
- Comments/notes on responses
- Workflow assignment (send for review)

---

## 5. DATA FORMAT & FLEXIBILITY REQUIREMENTS

### 5.1 Template CSV Format (Improved)

#### Goals
- Non-technical admins can create templates in Excel/Google Sheets
- No manual JSON escaping or complex syntax
- Support all required field types and options
- Easy to read and validate

#### Proposed Format

**Column Headers** (required):
- `field_id`: Unique identifier (e.g., q1, q2, question_1)
- `field_type`: text | textarea | dropdown | radio | checkbox | number | date
- `label`: Question text shown to user
- `help_text`: Explanation/definition (can be empty)
- `required`: yes | no | true | false | 1 | 0
- `options`: Pipe-separated list for dropdown/radio/checkbox (e.g., "Yes|No|Unknown")
- `default_value`: Pre-filled value (optional)
- `validation`: Regex pattern for text validation (optional)
- `width`: Column width hint (optional, for table layouts)

**Example CSV**:
```csv
field_id,field_type,label,help_text,required,options,default_value,validation
q1,dropdown,Is there a referendum?,A referendum is a direct vote...,yes,Yes|No|Unknown,,
q2,number,Number of signatures?,Total signatures required to trigger referendum,yes,,,^\d+$
q3,textarea,Describe the process,Provide detailed description of the process,no,,,
q4,radio,Legal basis exists?,Is there explicit legal framework?,yes,Yes|No,,
q5,checkbox,Types of instruments,Select all that apply,no,Referendum|Initiative|Recall|Plebiscite,,
q6,date,Law enactment date,When was the law enacted?,no,,,
```

#### CSV Parsing Requirements
- Handle quoted fields (commas inside quotes)
- Handle escaped quotes (`""` inside quoted fields)
- Trim whitespace from values
- Case-insensitive column headers
- Validate required columns exist
- Provide clear error messages on parse failure

---

### 5.2 Field Type Specifications

#### Text Field
- Single-line text input
- Optional validation regex
- Optional min/max length
- Placeholder text support

#### Textarea Field
- Multi-line text input
- Optional character count display
- Optional min/max length
- Resizable or fixed height

#### Dropdown Field
- Single-select from options
- Options defined in CSV (pipe-separated) or JSON array
- Optional "Other" option with text input
- Search/filter for long option lists

#### Radio Field
- Single-select from options (displayed as radio buttons)
- Better UX than dropdown for 2-5 options
- Can include "Other" option

#### Checkbox Field
- Multi-select from options
- Each option is a checkbox
- Return value as array or comma-separated string

#### Number Field
- Numeric input only
- Optional min/max value
- Optional step increment
- Display as integer or decimal

#### Date Field
- Date picker UI
- Return ISO format (YYYY-MM-DD)
- Optional min/max date range
- Localization support

---

### 5.3 Help Text / Tooltips

#### Requirements
- Every field can have optional help text
- Help text should be **easily discoverable** (not hidden by default)
- Display options:
  - **Icon next to label**: Hover or click to show tooltip
  - **Expandable section**: Click to expand inline
  - **Side panel**: Always visible for current field
  - **Info column**: Dedicated column in table layout

#### Recommendation
- Use **help icon (ⓘ)** next to field label
- Click/tap to toggle tooltip (better for mobile than hover)
- Tooltip supports HTML for rich formatting (bold, links, lists)

---

### 5.4 Metadata Requirements

Templates and responses should support **rich metadata**:

**Template Metadata**:
- Job ID, title, description
- Created by (admin email)
- Created date, updated date
- Version number
- Status (draft, active, archived)
- Tags/categories (for organization)
- Expected completion time estimate

**Response Metadata**:
- Response ID
- User email, job ID, template version
- Status, timestamps (created, updated, submitted)
- User agent (browser info)
- IP address (optional, for security)
- Time spent on form (tracking)
- Edit history (who changed what when)

---

## 6. UI/UX REQUIREMENTS

### 6.1 Design Principles
- **Simplicity**: Clean, uncluttered interface
- **Consistency**: Uniform styling, predictable interactions
- **Responsiveness**: Mobile-first design, works on all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance (semantic HTML, ARIA labels, keyboard navigation)
- **Clarity**: Clear labels, helpful error messages, visible progress

### 6.2 Visual Design

#### Typography
- **Single font family**: Use system fonts or 1 web font (e.g., Inter, Open Sans)
- **Consistent weights**: Regular (400) for body, Semibold (600) for headings
- **Readable sizes**: 16px minimum for body text, 14px minimum for small text

#### Color Palette
- **Limited palette**: 1 primary color, 1 secondary color, grayscale
- **Semantic colors**: Green for success, red for error, yellow for warning, blue for info
- **Sufficient contrast**: WCAG AA minimum (4.5:1 for normal text, 3:1 for large)

#### Spacing & Layout
- **Consistent spacing**: Use 8px grid system (8px, 16px, 24px, 32px, 48px)
- **White space**: Don't cram content, let it breathe
- **Responsive breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

### 6.3 Component Requirements

#### Navigation
- **Clear app navigation**: Logo, user menu, sign out
- **Breadcrumbs**: Show current location (Dashboard > Jobs > Referendum 2024)
- **Mobile menu**: Hamburger menu for small screens

#### Forms
- **Clear labels**: Above or beside input fields
- **Placeholders**: Example values, not instructions
- **Validation**: Inline error messages below fields
- **Loading states**: Spinners or skeleton screens during async operations
- **Success feedback**: Confirmation messages after save/submit

#### Data Tables
- **Sortable columns**: Click header to sort
- **Filterable**: Search/filter controls above table
- **Pagination**: For tables with >50 rows
- **Responsive**: Stack or horizontal scroll on mobile
- **Row actions**: Buttons or dropdown menu per row (view, edit, delete)

#### Status Indicators
- **Badges**: Compact status chips (New, Draft, Submitted)
- **Consistent colors**:
  - New: Blue or gray
  - Draft: Yellow/orange
  - Submitted: Green
  - Error: Red
- **Icons**: Checkmarks, alerts, info icons for clarity

---

## 7. SECURITY & PRIVACY REQUIREMENTS

### 7.1 Authentication & Authorization

#### Firebase Auth
- Email/password authentication required
- Password requirements: Min 8 characters, complexity optional
- Password reset via email link
- Session timeout configurable (default 24 hours)

#### Role-Based Access Control (RBAC)
- Enforce roles via Firestore Security Rules (server-side)
- Client-side role checks for UI/UX only (not security)
- Admin role: Full CRUD on all collections
- Coder role: Read templates, CRUD own responses only

#### Security Rules Example
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAdmin() {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }

    // Users collection
    match /users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
      allow write: if isAdmin();
    }

    // Templates collection
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Responses collection
    match /responses/{responseId} {
      allow read: if request.auth != null &&
                     (resource.data.user_email == request.auth.token.email || isAdmin());
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                       resource.data.user_email == request.auth.token.email &&
                       resource.data.status != 'submitted'; // Can't edit after submit
      allow delete: if false; // No deletions allowed
    }
  }
}
```

### 7.2 Data Privacy

#### Personal Data Handling
- Collect only necessary data (email, role, response content)
- Do not store sensitive personal information unless required
- IP address and user agent optional (for security auditing)

#### Data Retention
- Active responses retained indefinitely
- Archived responses retained per retention policy (e.g., 7 years)
- User accounts can be disabled (soft delete) but data retained

#### Export & Portability
- Users can request export of their own data (JSON/CSV)
- Admins can export all data for backup/migration

---

## 8. PERFORMANCE REQUIREMENTS

### 8.1 Load Times
- **Initial page load**: <2 seconds on 3G connection
- **Form rendering**: <500ms for 50-field questionnaire
- **Save operation**: <1 second round-trip to Firestore
- **Dashboard load**: <1.5 seconds with 20 jobs

### 8.2 Scalability
- Support 100+ simultaneous users
- Handle 1000+ questionnaire responses per job
- Templates with up to 200 fields
- Response lists with up to 5000 items (with pagination)

### 8.3 Optimization Strategies
- Lazy load large components (don't load Handsontable until needed)
- Firestore query limits (fetch 50 at a time, paginate)
- Cache static assets (CDN with long cache headers)
- Minimize Firestore reads (batch queries, use local state)

---

## 9. TESTING & QUALITY REQUIREMENTS

### 9.1 Testing Strategy
- **Manual testing**: QA checklist for each release
- **User testing**: Pilot with 2-3 users before full deployment
- **Browser testing**: Chrome, Firefox, Safari, Edge (latest versions)
- **Device testing**: Desktop, tablet, mobile (iOS and Android)

### 9.2 Error Handling
- **User-friendly error messages**: Avoid technical jargon
- **Graceful degradation**: If feature fails, show fallback UI
- **Logging**: Console errors for debugging (production: minimize logs)
- **Retry logic**: Auto-retry failed Firestore operations (up to 3 times)

### 9.3 Documentation Requirements
- **README.md**: Setup instructions, deployment, usage overview
- **CLAUDE.md**: AI context file (architecture, workflows, troubleshooting)
- **SECURITY.md**: Security practices, Firestore Rules explanation
- **API.md** (optional): Firestore data model documentation
- **User Guide** (optional): End-user documentation with screenshots

---

## 10. DEPLOYMENT & MAINTENANCE

### 10.1 Deployment Process
- **GitHub Pages**: Static hosting from `main` or `gh-pages` branch
- **Custom domain** (optional): Link custom domain via CNAME
- **Automatic deployment**: Git push triggers deploy (via GitHub Actions or manual)

### 10.2 Version Control
- **Git repository**: Public or private GitHub repo
- **Branch strategy**: `main` for production, `dev` for development, feature branches
- **Commit messages**: Conventional commits (feat, fix, docs, style, refactor)
- **Releases**: Tag releases (v3.0.0, v3.1.0) with changelog

### 10.3 Monitoring & Maintenance
- **Firebase Console**: Monitor auth, Firestore usage, errors
- **Google Analytics** (optional): Track page views, user flows
- **Error reporting** (optional): Sentry or similar for production error tracking
- **Regular backups**: Export Firestore data weekly/monthly

---

## 11. NICE-TO-HAVE FEATURES (Future Versions)

### Phase 2 Features
- Template versioning with migration tools
- Response comparison view (side-by-side)
- Data validation rules (cross-field checks)
- Email notifications (job assigned, response submitted)
- Bulk operations (bulk upload, bulk assign)

### Phase 3 Features
- Conditional logic (show/hide fields based on answers)
- Calculated fields (auto-compute values)
- Rich text editor for long-answer questions
- File upload fields (images, PDFs, etc.)
- Collaboration features (comments, reviews, approvals)

### Phase 4 Features
- API for external integrations
- Multi-language support (i18n)
- Advanced analytics dashboard
- Machine learning-assisted data validation
- Mobile app (React Native or PWA)

---

## 12. OPEN QUESTIONS FOR IMPLEMENTATION

These questions should be answered by Claude during planning:

### Form Rendering
1. Should we use a form library (Survey.js, Formio) or build custom renderer?
2. Table layout (Handsontable) vs form layout vs hybrid?
3. How to handle very long questionnaires (100+ fields)?

### Template Management
4. CSV format vs JSON schema vs form builder UI?
5. How to handle template updates without breaking existing responses?
6. Should templates support sections/grouping?

### Response Management
7. Export format: CSV (flat) or JSON (nested)?
8. How to handle multi-select checkbox values in CSV export?
9. Should responses be editable after submission (by admin)?

### UI/UX
10. Progress indicator: simple percentage or detailed field tracking?
11. Help text: inline, tooltip, side panel, or dedicated column?
12. Mobile-first or desktop-first design priority?

### Data Model
13. Response ID format: `{email}_{job_id}` or UUID or timestamp-based?
14. Should we store template schema in each response or just reference template ID?
15. How to handle orphaned responses (template deleted)?

---

## 13. SUCCESS CRITERIA

### MVP Success Metrics
- ✅ Admin can create users and templates via CSV upload
- ✅ Coder can log in, see assigned jobs, complete forms
- ✅ Forms render correctly with all field types (text, dropdown, textarea, etc.)
- ✅ Draft/submit workflow works, submitted responses are read-only
- ✅ Admin can view all submitted responses in table format
- ✅ Admin can export responses to CSV
- ✅ Application works on desktop and mobile browsers
- ✅ No critical security vulnerabilities (Firestore Rules properly enforced)
- ✅ Documentation is complete and accurate

### User Satisfaction Criteria
- Non-technical admins can create questionnaires without developer help
- Coders find form interface intuitive and easy to use
- Response data is accurate and complete (no data loss)
- System is reliable (>99% uptime, minimal bugs)

---

## 14. CONSTRAINTS & ASSUMPTIONS

### Constraints
- No server-side code (pure static frontend + Firebase)
- No build tools (CDN dependencies only)
- Must deploy to GitHub Pages (or similar static host)
- Must use Firebase (Auth + Firestore)
- Budget: Free tier limits (Firestore reads/writes, Auth users)

### Assumptions
- Users have modern browsers (ES6 support)
- Users have internet connection (no offline mode required for MVP)
- Research team <100 users (no enterprise-scale requirements)
- Questionnaires mostly text-based (minimal multimedia)
- English language only (no i18n required for MVP)

---

## 15. CONTACT & APPROVAL

**Document Author**: Fernando Mendez
**Created**: 2025-01-26
**Status**: Draft for Claude Planning Session
**Approval**: To be reviewed and approved by development team

---

**END OF REQUIREMENTS DOCUMENT**
