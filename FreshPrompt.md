## Initial Prompt

I'm building a new web application for systematic political science data collection. This is a complete redesign of an existing system (v2.2) to address flexibility and usability limitations.

**Context**: I have a detailed `Requirements.md` file in this repository that specifies all functional and technical requirements. Please read it carefully before we start planning.

**Project Type**: Serverless single-page application (SPA) using Firebase Authentication + Firestore Database, deployed to GitHub Pages. NO BUILD TOOLS - pure CDN-based dependencies and ES6 modules.

**Core Requirements Summary**:
1. **Landing Page**: Quarto-generated (I'll handle this separately). The Firebase app should have clear entry points for Sign-In (coders) and Admin Panel.

2. **Flexible Template System**: Support multiple field types (text, textarea, dropdown, radio, checkbox, number, date) defined via CSV or JSON schema. Current system is limited to 6 fixed columns.

3. **Form Rendering**: Dynamic form renderer that adapts to template schema. Consider whether to use table layout (Handsontable), custom form, or hybrid approach.

4. **Improved Admin UX**:
   - Better response viewer (replace JSON alert with proper table)
   - CSV export functionality
   - Filtering and search

5. **Enhanced User Experience**:
   - Clear help text/tooltips (not hidden)
   - Progress indicators
   - Auto-save drafts
   - Mobile-responsive design

**Your Task**:

1. **READ** the `Requirements.md` file completely
2. **ENTER PLAN MODE** to thoroughly explore implementation options
3. **CONSIDER ALTERNATIVES** for:
   - Form rendering approach (custom vs library vs hybrid)
   - Template format (improved CSV vs JSON schema vs form builder)
   - UI component choices (which libraries via CDN)
4. **ASK CLARIFYING QUESTIONS** about requirements, trade-offs, and design decisions
5. **PROPOSE A DETAILED PLAN** with:
   - Recommended architecture
   - Technology choices (specific libraries/frameworks via CDN)
   - File structure
   - Data model (Firestore collections)
   - Implementation phases (MVP → Phase 2 → Phase 3)
   - Migration strategy from v2.2 (if needed)

**Important Constraints**:
- NO build tools (Webpack, Vite, npm, Node.js)
- ALL dependencies via CDN
- Must use Firebase v9 Modular SDK (Auth + Firestore)
- Must deploy to GitHub Pages (static hosting)
- Modern browsers only (ES6+ support)

**What I Need from You**:
- A well-researched, opinionated plan
- Specific library recommendations (with CDN links)
- Clear rationale for design decisions
- Trade-off analysis for key choices
- Phased implementation approach

**What I'll Provide**:
- Feedback on your plan
- Decisions on open questions
- Approval to proceed with implementation

Let's start by you reading the Requirements.md file and then entering plan mode to explore the design space thoroughly.

---

## Follow-Up Questions You Might Ask

Feel free to ask me questions like:

**Template Management**:
- Do you prefer CSV format (easier for non-technical users) or JSON schema (more flexible)?
- Should we support a visual form builder in the future, or is CSV/JSON sufficient?
- How important is template versioning (v1, v2, v3 with migration)?

**Form Rendering**:
- Do you want table layout (good for comparative data entry) or traditional form layout (better for long questionnaires)?
- Should we use a library like Survey.js (feature-rich but larger) or build custom (lighter but more work)?
- How complex should conditional logic be (simple show/hide or complex branching)?

**UI/UX Priorities**:
- Is mobile responsiveness critical for MVP or nice-to-have?
- Should help text be always visible (side panel) or on-demand (tooltips)?
- Do you prefer minimalist design or feature-rich interface?

**Data Export**:
- What CSV export format do you need? Flat (one row per response) or nested (one row per field)?
- Should we support Excel export (.xlsx) or just CSV?
- Do you need filtering/aggregation before export?

**Migration from v2.2**:
- Do we need to migrate existing Firestore data from v2.2, or start fresh?
- Can we keep the same Firebase project or should I create a new one?
- Should v2.2 and v3.0 coexist, or is this a hard cutover?

---

## Expected Plan Output

Your plan should include sections like:

### 1. Architecture Overview
- Technology stack (specific versions, CDN links)
- Firestore data model (collections, document structure)
- File structure (HTML, JS, CSS organization)
- Authentication & authorization flow

### 2. Form Rendering Strategy
- Recommended approach (custom/library/hybrid)
- Pros/cons analysis
- Example implementation sketch

### 3. Template Management
- CSV format specification (improved from v2.2)
- Parsing and validation logic
- Template creation workflow

### 4. Admin Panel Design
- Response viewer UI mockup (conceptual)
- Export functionality approach
- User management workflow

### 5. Implementation Phases
- **Phase 1 (MVP)**: Core features for basic functionality
- **Phase 2**: Enhanced UX and admin features
- **Phase 3**: Advanced features (conditional logic, validation)

### 6. Open Questions & Decisions Needed
- List of questions you need me to answer
- Trade-offs that require my input

### 7. Migration Plan (if applicable)
- How to transition from v2.2 to v3.0
- Data migration scripts
- Coexistence strategy

---

## Additional Context Files

If helpful, you can reference these files from the v2.2 codebase (in parent directory):
- `CLAUDE.md` - Detailed context about v2.2 architecture, pain points, and lessons learned
- `app.js` - Current implementation of form rendering (Handsontable)
- `scripts/admin.js` - Current CSV parsing and admin logic
- `firebase-config.js` - Firebase initialization pattern

But don't be constrained by v2.2 - this is a fresh start. Feel free to propose completely different approaches if they better meet the requirements.

---

## My Development Approach

I prefer:
- **Phased implementation**: Start with MVP, iterate based on feedback
- **Simplicity over features**: Clean, maintainable code > kitchen-sink functionality
- **User-centric design**: Usability for non-technical admins is critical
- **Flexibility**: System should adapt to diverse questionnaire types
- **Documentation**: Keep CLAUDE.md updated, clear README for users

I value:
- Clear explanations of design decisions
- Trade-off analysis (what we gain/lose with each choice)
- Specific, actionable recommendations
- Working code over perfect code (iterate and improve)

---

## Success Criteria

Your plan is successful if:
- ✅ I understand the proposed architecture clearly
- ✅ Technology choices are justified with pros/cons
- ✅ Implementation is feasible without build tools
- ✅ Design addresses v2.2 pain points (flexibility, UX, admin tools)
- ✅ Plan is phased with clear MVP scope
- ✅ I can make informed decisions on open questions

---

## Let's Begin!

Please start by:
1. Reading `Requirements.md` in this repository
2. Entering plan mode
3. Exploring implementation options with research/analysis
4. Asking me clarifying questions
5. Proposing a detailed, well-researched plan

I'm ready for your questions and excited to see your recommendations!
