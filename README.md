# CoursePack

**Turn YouTube into a course.**

YouTube already has the explanations. What it doesn't have is structure: which videos are worth learning from, in what order, and whether you actually understood them. CoursePack is a learning layer on top of YouTube that **discovers, validates, sequences and enhances** existing videos into a course, then adds an AI Study Partner, practice, projects and progress.

> YouTube gives you content. CoursePack gives you a validated path to mastery.

**Live demo:** https://nweinberg97.github.io/CoursePack/

**Collab is an independent concept prototype built for exploration and fun. It is not affiliated with, sponsored by, or endorsed by YouTube, Google LLC, or any of their affiliates. YouTube is a trademark of Google LLC. All creators, videos and metrics shown are fictional sample data created to demonstrate the ranking model.
**---

## The two moments it's built around

1. **"Wait, CoursePack actually figured out which videos I should watch."**
   Enter any goal (`I want to learn SQL`). The builder streams the pipeline: candidate videos scanned, comments classified, engagement compared to channel reach, creators evaluated, concepts mapped, prerequisites ordered. The result shows a real selection decision, a video chosen *over* one with millions more views, and explains why.

2. **"And now it's actually helping me learn from them."**
   The lesson screen puts the source video in the middle, the curriculum on the left and a Study Partner on the right that answers *from the transcript* and cites timestamps you can click to jump to. Below the video: Overview, Notes pinned to timestamps, a searchable Transcript, and Practice (exercises plus a quick check that updates concept confidence).

## Demo flow

| Step | Where |
| --- | --- |
| Landing: thesis, value chain, interactive ranking lab | `#/` |
| Browse categories and topics | `#/explore` |
| Generate a path ("I want to learn SQL") | `#/build/I want to learn SQL` |
| Course overview, curriculum, final project | `#/course/sql` |
| Lesson with "Why this video?", Focus Mode, Study Partner | `#/learn/ai-app/ai-app-m1-l4` |
| Study Kit: guide, flashcards, quiz, concept map, Ask the Course, weak concepts | `#/study/ai-app` |
| Progress as capability | `#/progress/ai-app` |
| Completion and certificate | `#/complete/ai-app` |

A small **Prototype** menu (bottom-left on desktop) jumps between these, fast-forwards the flagship course to completion, and resets sample data.

## How a video gets chosen

Every number in the UI is computed by `src/lib/scoring.ts` from raw, YouTube-shaped metrics. Nothing is hard-coded.

| Signal | Derived from | Why it exists |
| --- | --- | --- |
| **Learner feedback** (40%) | Share of analysed comments that describe understanding, applying or recommending the video, minus confusion | Rewards evidence of learning, not comment volume |
| **Engagement** (35%) | Views ÷ subscribers, (likes + comments) ÷ views, views per day | A 2M-view video on a 100K channel outperformed; 5M on a 10M channel didn't |
| **Creator authority** (25%) | log(subscribers), topic focus, upload consistency | Counts, but log-scaled so size alone can't win |
| **Curriculum fit** | How well the video bridges the previous concept to the next | The best video *for this point in the path* |

```
validation      = Σ weight × signal            (weights configurable)
CoursePack Score = 0.8 × validation + 0.2 × curriculum fit
```

The landing page's ranking lab lets you toggle "Most viewed" vs "CoursePack" and drag the weights to see the order change. The product never claims a video is objectively the best; it shows the evidence and the runners-up it beat.

## Architecture

```
YouTube → candidate videos → transcript analysis → validation signals
        → concept mapping → curriculum sequencing → CoursePack course
```

The prototype keeps that shape so a real pipeline could slot in:

- **`src/types.ts`**: the domain model. `Video` carries raw `metrics` and `analysis` (comment classification); signals are derived, never stored.
- **`src/lib/scoring.ts`**: signal derivation, weights, CoursePack Score.
- **`src/lib/buildCourse.ts`**: turns a compact authored `CourseSpec` into a full `Course`: selected video per lesson, the candidates it beat (guaranteed consistent with the model), transcript chapters, checks. This is where pipeline output would land.
- **`src/lib/generate.ts`**: intent routing and generation for topics outside the library, run through the same `buildCourse` step.
- **`src/lib/tutor.ts`**: deterministic, retrieval-based Study Partner and Ask the Course. Answers come from the lesson transcript and course glossary and always return sources (lesson + timestamp). Swap `answerLesson` / `answerCourse` for a model call that receives the same retrieved context.
- **`src/state/store.tsx`**: learner state (progress, confidence per concept, notes, activity, Focus Mode) in a reducer, persisted to `localStorage`.
- **`src/data/`**: nine courses (flagship *Build Your First AI Application*, SQL, Python, Product Design, Starting a Business, Video Editing, Web, Photography, Personal Finance), 37 fictional creators, and the ranking-lab dataset.

Adding a course is one `CourseSpec` file: modules, lessons (source video title, creator, length, objective, concepts), a glossary with prerequisite links, optional exercises and quiz questions.

### Components

```
components/
  ui/        Icon, Button, Pill, ProgressBar, ProgressRing, Tabs, Modal, Drawer, Toast
  course/    CourseCard, CourseCover, Thumbnail, ModuleList, LessonItem, CreatorCard,
             CoursePackScore, VideoValidation, WhyThisVideo, ProjectCard
  generate/  ValidationLab, LearningPathBuilder (steps, live view, selection highlight)
  learn/     VideoPlayer (simulated playback, chapters, captions), Overview/Notes/
             Transcript/Practice panels
  ai/        TutorChat, AIMessage (streamed replies, sources, inline quizzes)
  study/     QuizCard, PracticeExercise, Flashcard(Deck), ConceptMap
  progress/  SkillProgress, Certificate
pages/       Landing, Dashboard, Explore, Build, CourseOverview, Learn, StudyKit,
             Progress, Complete
```

## Design notes

- Palette is deliberately restrained: near-black, white, soft grays, with **red used only for progress, active states and primary actions**. Green means done; soft blue marks AI sources.
- Inter for everything, JetBrains Mono for timestamps, scores and system metadata, so the "machine" parts read differently from the editorial parts.
- Focus Mode switches the lesson into a dark theatre: no curriculum, no navigation, just the module, the objective, progress and what's next.
- Progress is shown as capability (skills, confidence, projects), not streaks. Weekly summaries report focused time and milestones.
- Fully responsive: on phones the video stays pinned, the curriculum becomes a drawer and the Study Partner a bottom sheet.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # static build in dist/
npm run build:single   # self-contained HTML in dist-single/ and docs/ (GitHub Pages)
```

## What's simulated

Video playback (a clock driving chapters and captions; a real build would use the YouTube IFrame Player API), the ranking pipeline's inputs (fictional metrics), comment classification, and the tutor's language model. Everything else, including scoring, sequencing, progress, confidence, notes and the concept graph, runs for real in the browser.
