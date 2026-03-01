# EzStudy Improvement Plan
## Context: HK University Tutor → International School Middle Schoolers (English & Science)

**Primary user**: A university student in Hong Kong who tutors middle school students (ages 11-14) in English and Science at international schools in HK.

**How they use it**: The tutor creates study sets from their lesson materials, shares them with students for self-study between sessions, uses the AI tutor as a supplement, and tracks student progress.

---

## Phase 1: Fix What's Broken / Misleading (Quick Wins)

### 1.1 Upload Page — Remove unsupported format badges
The upload page shows PPTX, DOCX, Images, Video, Audio as supported formats, but the backend only extracts text from PDFs. Either:
- **Option A (quick)**: Remove the badges for formats that don't work, keep only PDF + "enter a topic"
- **Option B (better)**: Add actual text extraction for DOCX and PPTX using libraries like `mammoth` (DOCX) and basic XML parsing (PPTX)
- Remove the YouTube Video Link section entirely until it's actually implemented

### 1.2 Upload Page — File upload doesn't extract PDF text
Currently the upload flow sends the file to the backend but only passes the topic text or pasted content to the AI. Actual PDF text extraction (using `pdf-parse` or similar) needs to be wired up so uploading a PDF actually works.

### 1.3 Generation Settings — "Curriculum" dropdown options
The current options are generic. For HK international school context, add:
- **IB MYP** (International Baccalaureate Middle Years Programme — very common in HK international schools)
- **IGCSE** (Cambridge — used by many HK international schools)
- **Common Core** (US curriculum — used by American international schools in HK)
- Keep "None" as default

### 1.4 Sidebar navigation — Missing tutor features for logged-in tutors
When a tutor is logged in, the sidebar should show: Dashboard, Upload Materials, **My Students**, **Sessions**. Currently these only appear after login, but the links aren't visible in the unauthenticated dashboard view.

---

## Phase 2: Tutor-Student Workflow (Core Value)

### 2.1 Study Set Sharing — One-click share to student
Tutors need to share study sets with specific students easily:
- After generating a study set, show a prominent "Share with Student" button
- Allow selecting from their student list or generating a shareable link
- Students should see shared sets in their own dashboard under "From My Tutor"
- Currently sharing generates a code/link, but there's no "received sets" section for students

### 2.2 Assignment Flow
Tutors should be able to assign specific activities:
- "Study these flashcards before our next session"
- "Complete this quiz by Friday"
- "Review these notes"
- Students see assignments on their dashboard with due dates
- Tutor sees completion status (done/not done, score)

### 2.3 Session Recap — Bilingual Support
Since the tutor is in HK and may communicate with parents who speak Cantonese/Mandarin:
- Add option to generate session recaps in English + Chinese (Traditional)
- The recap API already exists — add a `language` parameter
- Default to English but allow "English + 中文" option

### 2.4 Student Progress Dashboard (Tutor View)
Expand the existing student detail page to show:
- Which study sets the student has accessed
- Flashcard mastery % per set (from SM-2 data)
- Quiz scores over time (line chart)
- Last active date
- Weak topics (aggregated from quiz misses)

### 2.5 Parent Portal — Session Recap Delivery
The parent portal exists but needs a clearer path:
- After tutor generates a recap, option to "Send to parent" (email or in-app)
- Parent sees a timeline of sessions with recaps
- Include next session date and suggested homework

---

## Phase 3: Content Quality for English & Science

### 3.1 Subject-Aware Generation Prompts
When the tutor selects a subject area, the AI prompt should adapt:
- **English**: Generate vocabulary flashcards (word → definition + example sentence), reading comprehension questions, grammar quiz questions, essay prompts
- **Science**: Generate concept flashcards (term → explanation + diagram description), experiment-based questions, label-the-diagram style prompts, cause-and-effect questions

Add a "Subject" selector to generation settings: English, Science, Maths, History, General

### 3.2 Vocabulary Builder Mode (English-specific)
For English tutoring, a dedicated vocabulary mode:
- Input a word list (or extract from reading passage)
- Generate: definition, example sentence, part of speech, synonyms
- Flashcards auto-created with word on front, definition + sentence on back
- Quiz mode focuses on context usage ("Choose the correct word to fill the blank")

### 3.3 Science Lab/Experiment Notes Template
For Science, add a notes template option:
- Aim, Hypothesis, Method, Results, Conclusion format
- AI generates structured experiment summaries
- Useful for middle school science where lab reports are common

### 3.4 Grade Level Defaults
For the HK international school context:
- Pre-select "Middle School" as grade level
- Default difficulty to "Medium"
- Example placeholder text should be relevant: "e.g., Photosynthesis and Plant Biology" or "e.g., Shakespeare's Romeo and Juliet"

---

## Phase 4: Study Experience for Middle Schoolers

### 4.1 Gamification — Points and Streaks
Middle schoolers respond well to gamification:
- Award points for completing flashcard sessions, quizzes, and reading notes
- Daily streak counter (visible on dashboard)
- Simple level system (Beginner → Scholar → Expert → Master)
- Points formula: flashcard review = 1pt, quiz correct = 2pt, quiz perfect = 10pt bonus
- Store in database, display on student dashboard

### 4.2 Quiz Review Mode
After a quiz is completed, students should be able to:
- Review all questions with their answers vs correct answers
- See explanations for wrong answers
- "Retry missed questions only" button
- Currently quiz results show score but don't persist for review

### 4.3 Flashcard "Quick Review" — Due Cards Only
With SM-2 spaced repetition, some cards are "due" for review:
- Add a "Review Due Cards" button that only shows cards scheduled for today
- Show count of due cards on the dashboard ("5 cards due for review")
- This is the most effective study mode for retention

### 4.4 Mobile Responsiveness Audit
Middle schoolers often study on phones/tablets:
- Test all views at 375px (iPhone) and 768px (iPad)
- Ensure flashcard flip works well with touch
- Quiz option buttons should be easy to tap (min 44px touch targets)
- Chat input should not be obscured by mobile keyboard

### 4.5 Dark Mode
Students studying at night (very common for HK students with heavy schedules):
- Add a dark mode toggle in settings
- Use CSS custom properties for easy theme switching
- Save preference in localStorage

---

## Phase 5: Tutor Productivity

### 5.1 Study Set Templates
Tutors create similar study sets repeatedly:
- Allow saving a study set as a template
- "Create from template" option on upload page
- Pre-fill generation settings (grade level, difficulty, subject, curriculum)

### 5.2 Bulk Student Management
For tutors with multiple students:
- Import students via CSV (name, email, parent email)
- Batch-assign study sets to multiple students
- Batch-send session recaps

### 5.3 Session Calendar Integration
- Show upcoming sessions in a calendar view (not just list)
- iCal export for tutor and student
- Session reminders (could be email-based)

### 5.4 Tutor Branding
Allow tutors to customize their profile:
- Custom display name and bio
- Profile photo
- Custom welcome message for students
- This helps when sharing links with parents — builds trust

---

## Phase 6: Technical Improvements

### 6.1 Prisma Binary Targets
Add `rhel-openssl-3.0.x` to Prisma schema for clean Vercel builds:
```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### 6.2 PDF Text Extraction
Add `pdf-parse` to extract text from uploaded PDFs server-side, so the "upload PDF" flow actually works end-to-end.

### 6.3 Rate Limiting
Add basic rate limiting to the AI generation endpoints to prevent abuse (since the app is free and open).

### 6.4 Error Handling — User-Friendly Messages
Replace generic "Internal server error" with specific, helpful messages:
- "The AI is taking a while — try again in a moment"
- "Your file is too large (max 5MB). Try a shorter document."
- "We couldn't read this file format. Try uploading a PDF."

### 6.5 Analytics
Add simple event tracking (privacy-respecting) to understand usage:
- Which features are used most
- Where students drop off
- Average session duration
- This helps prioritize future improvements

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | 1.1-1.2 Fix upload page (remove fake formats, add PDF extraction) | Medium | High |
| P0 | 6.1 Prisma binary targets | Tiny | High |
| P1 | 2.1 Study set sharing improvements | Medium | High |
| P1 | 3.1 Subject-aware generation | Small | High |
| P1 | 4.1 Gamification (points/streaks) | Medium | High |
| P1 | 1.3 Curriculum options (IB MYP, IGCSE) | Tiny | Medium |
| P2 | 2.2 Assignment flow | Large | High |
| P2 | 3.2 Vocabulary builder mode | Medium | High |
| P2 | 4.3 Quick review (due cards) | Small | High |
| P2 | 4.2 Quiz review mode | Small | Medium |
| P2 | 2.3 Bilingual recaps | Small | Medium |
| P3 | 4.5 Dark mode | Medium | Medium |
| P3 | 2.4 Student progress dashboard | Medium | Medium |
| P3 | 5.1 Study set templates | Medium | Medium |
| P3 | 4.4 Mobile audit | Small | Medium |
| P4 | 2.5 Parent recap delivery | Medium | Low |
| P4 | 5.2 Bulk student management | Medium | Low |
| P4 | 5.3 Calendar integration | Large | Low |
| P4 | 6.3-6.5 Rate limiting, errors, analytics | Medium | Medium |
