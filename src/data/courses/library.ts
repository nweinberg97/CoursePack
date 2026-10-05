import type { CourseSpec, LessonSpec } from '../../lib/buildCourse';
import type { Exercise } from '../../types';

/** Compact lesson helper for the wider library. */
const L = (title: string, video: string, by: string, min: number, objective: string, concepts: string[], extra: Partial<LessonSpec> = {}): LessonSpec => ({
  title, video, by, min, objective, concepts, outcomes: extra.outcomes ?? [objective.replace(/\.$/, '')], ...extra,
});

const textExercise = (prompt: string, hint: string, checks: [string, string][], solution: string): Exercise => ({
  kind: 'text', prompt, hint, checks: checks.map(([pattern, label]) => ({ pattern, label })), solution,
});

export const python: CourseSpec = {
  id: 'python',
  title: 'Python for Beginners',
  tagline: 'Write real programs, not just syntax drills.',
  description: 'Learn Python by building small, useful tools, ending with a command-line app you’ll actually use.',
  category: 'technical', topic: 'Python', level: 'Beginner',
  skills: ['Python', 'Problem solving', 'Files & data', 'Debugging'],
  tools: ['Python 3.11+', 'VS Code or any editor'],
  outcomes: ['Write and run Python scripts', 'Use lists, dictionaries and functions fluently', 'Read and write files', 'Debug errors calmly', 'Build a command-line tool'],
  cover: { hue: 48, motif: 'code' },
  finalProject: { title: 'A Command-Line Tool', summary: 'Build a CLI that solves a real annoyance in your week: a habit tracker, file renamer, or expense logger.', deliverable: 'A GitHub repo with a README and usage examples.', milestones: [
    { id: 'pp-1', title: 'Script that reads input and prints output', lessonId: 'python-m1-l3' },
    { id: 'pp-2', title: 'Core logic in functions', lessonId: 'python-m3-l3' },
    { id: 'pp-3', title: 'Saves data to a file', lessonId: 'python-m4-l3' },
    { id: 'pp-4', title: 'Published with a README', lessonId: 'python-m6-l3' },
  ] },
  glossary: {
    variable: { term: 'Variable', def: 'A name that refers to a value so you can use and change it later.', example: 'total = 0', skill: 'Python' },
    type: { term: 'Data type', def: 'The kind of value something is, such as int, float, str or bool, which decides what you can do with it.', skill: 'Python' },
    list: { term: 'List', def: 'An ordered, changeable collection of values.', example: 'scores = [88, 92, 79]', requires: ['variable'], skill: 'Python' },
    dict: { term: 'Dictionary', def: 'A collection of key–value pairs for looking things up by name.', example: 'user = {"name": "Ana", "age": 31}', requires: ['variable'], skill: 'Python' },
    loop: { term: 'Loop', def: 'Repeats a block of code, either for each item in a collection or while a condition holds.', requires: ['list'], skill: 'Problem solving' },
    condition: { term: 'Conditional', def: 'Runs different code depending on whether something is true, using if, elif and else.', skill: 'Problem solving' },
    function: { term: 'Function', def: 'A named, reusable block of code that takes inputs and returns a result.', example: 'def area(w, h): return w * h', requires: ['variable'], skill: 'Python' },
    file: { term: 'File I/O', def: 'Reading from and writing to files on disk, usually with open() in a with block.', requires: ['function'], skill: 'Files & data' },
    exception: { term: 'Exception', def: 'An error raised while a program runs, which you can catch and handle with try/except.', requires: ['function'], skill: 'Debugging' },
    module: { term: 'Module', def: 'A Python file or package you can import to reuse code, including the standard library.', example: 'import csv', requires: ['function'], skill: 'Python' },
    cli: { term: 'Command-line interface', def: 'A program you run and control from the terminal with arguments and text output.', requires: ['module'], skill: 'Files & data' },
  },
  modules: [
    { title: 'Getting Started', description: 'Install Python and write your first programs.', lessons: [
      L('Why Python, and how it runs', 'Python in 12 Minutes: What It Is and Why It’s Everywhere', 'bsl', 12.1, 'Understand what Python is used for and how code runs.', ['variable']),
      L('Variables and types', 'Python Variables & Data Types, Clearly', 'bsl', 14.6, 'Store and work with numbers and text.', ['variable', 'type']),
      L('Input and output', 'Your First Interactive Python Program', 'pec', 11.2, 'Read input and print results.', ['variable', 'type']),
      L('Reading error messages', 'How to Read Python Errors (Without Panic)', 'tpb', 9.4, 'Understand tracebacks.', ['exception']),
    ] },
    { title: 'Collections & Control Flow', description: 'Make decisions and repeat work over data.', requires: ['variable'], lessons: [
      L('Lists', 'Python Lists Explained With Examples', 'bsl', 13.7, 'Store and change ordered data.', ['list']),
      L('Conditionals', 'If, Elif, Else: Making Decisions in Python', 'pec', 10.9, 'Branch on conditions.', ['condition']),
      L('Loops', 'For Loops & While Loops (With Real Examples)', 'bsl', 15.3, 'Repeat work over collections.', ['loop', 'list'], {
        exercise: { kind: 'code', language: 'python', prompt: 'Write a function that removes duplicate values from a list while keeping the original order.', starter: 'def dedupe(items):\n    # your code here\n    pass\n\nprint(dedupe([3, 1, 3, 2, 1]))  # [3, 1, 2]', hint: 'Track what you’ve seen in a set, and append items you haven’t seen yet.', checks: [{ pattern: 'def\\s+dedupe', label: 'Defines dedupe' }, { pattern: 'for\\s+\\w+\\s+in', label: 'Loops over items' }, { pattern: 'set\\(|seen', label: 'Tracks seen values' }, { pattern: 'return', label: 'Returns the result' }], solution: 'def dedupe(items):\n    seen = set()\n    out = []\n    for x in items:\n        if x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out' },
      }),
      L('Dictionaries', 'Python Dictionaries in 15 Minutes', 'bsl', 14.9, 'Look values up by key.', ['dict']),
    ] },
    { title: 'Functions', description: 'Organise code into reusable pieces.', requires: ['loop'], lessons: [
      L('Defining functions', 'Python Functions Explained Clearly', 'pec', 16.4, 'Write functions with parameters and return values.', ['function'], { views: 2_400_000, quotes: ['I’ve watched three tutorials and this is the first one that actually clicked.', 'The explanation finally made return values make sense.', 'Came here knowing nothing about functions and built my first script after this.'] }),
      L('Scope and arguments', 'Python Scope & Arguments Without Confusion', 'tpb', 12.8, 'Understand where variables live.', ['function', 'variable']),
      L('Writing clean functions', 'Write Functions Future You Will Thank You For', 'tpb', 11.5, 'Name and size functions well.', ['function']),
    ] },
    { title: 'Files & Data', description: 'Work with real data on disk.', requires: ['function'], lessons: [
      L('Reading files', 'Reading Files in Python the Right Way', 'bsl', 12.2, 'Open and read text files.', ['file']),
      L('CSV and JSON', 'Working With CSV and JSON in Python', 'bsl', 17.9, 'Parse structured data files.', ['file', 'dict', 'module']),
      L('Writing files', 'Saving Data From Python Programs', 'sl', 10.6, 'Persist program data.', ['file']),
    ] },
    { title: 'Debugging & Errors', description: 'Fix problems systematically.', requires: ['exception'], lessons: [
      L('try and except', 'Python Exceptions: try, except, finally', 'pec', 13.3, 'Handle errors gracefully.', ['exception']),
      L('Debugging techniques', 'Debug Python Like a Professional', 'tpb', 18.4, 'Find bugs with print, the debugger and tests.', ['exception', 'function']),
      L('Using the standard library', 'The 10 Python Modules Everyone Should Know', 'bsl', 15.1, 'Reuse built-in modules.', ['module']),
    ] },
    { title: 'Final Project', description: 'Build a command-line tool you will actually use.', requires: ['file', 'function'], project: 'Build a useful command-line application.', lessons: [
      L('Scoping your CLI', 'Plan a Python Project Before You Code', 'tpb', 10.8, 'Pick a small, useful problem.', ['cli']),
      L('Build-along: Expense tracker CLI', 'Build a Command-Line Expense Tracker in Python', 'bsl', 32.4, 'Build a complete CLI.', ['cli', 'file', 'function']),
      L('Project: Ship your CLI', 'Publishing Your First Python Project on GitHub', 'sl', 14.2, 'Share your tool with a README.', ['cli', 'module'], { project: true }),
    ] },
  ],
};

export const videoEditing: CourseSpec = {
  id: 'video-editing',
  title: 'Video Editing From Zero',
  tagline: 'Cut, pace and finish videos people actually watch.',
  description: 'Learn editing as a storytelling craft: pacing, sound, b-roll, color and motion, ending with a published five-minute video.',
  category: 'creative', topic: 'Video Editing', level: 'Beginner',
  skills: ['Cutting', 'Pacing', 'Audio', 'Color', 'Storytelling'],
  tools: ['DaVinci Resolve (free) or any editor', 'Headphones', 'The course footage pack'],
  outcomes: ['Edit a sequence with intentional pacing', 'Clean and mix dialogue audio', 'Use b-roll to cover and add meaning', 'Apply a consistent grade', 'Publish a finished five-minute video'],
  cover: { hue: 330, motif: 'wave' },
  finalProject: { title: 'A Five-Minute Video', summary: 'Plan, shoot and edit a five-minute piece about something you know well, and publish it.', deliverable: 'A published video link and a short edit breakdown.', milestones: [
    { id: 've-1', title: 'Rough cut assembled', lessonId: 'video-editing-m2-l3' },
    { id: 've-2', title: 'Clean, mixed audio', lessonId: 'video-editing-m3-l3' },
    { id: 've-3', title: 'Color and titles finished', lessonId: 'video-editing-m6-l3' },
    { id: 've-4', title: 'Published', lessonId: 'video-editing-m8-l2' },
  ] },
  glossary: {
    timeline: { term: 'Timeline', def: 'The workspace where clips are arranged in time across video and audio tracks.', skill: 'Cutting' },
    cut: { term: 'Cut', def: 'An instant change from one shot to another, the basic unit of editing.', requires: ['timeline'], skill: 'Cutting' },
    jcut: { term: 'J-cut and L-cut', def: 'Cuts where audio leads or trails the picture, making transitions feel natural.', example: 'Hear the next speaker a beat before you see them.', requires: ['cut'], skill: 'Cutting' },
    pacing: { term: 'Pacing', def: 'The rhythm created by shot length and cut timing, which controls energy and attention.', requires: ['cut'], skill: 'Pacing' },
    broll: { term: 'B-roll', def: 'Supporting footage that illustrates or covers the main shot.', requires: ['cut'], skill: 'Storytelling' },
    shottype: { term: 'Shot types', def: 'Wide, medium and close shots, each giving the viewer different information and feeling.', skill: 'Storytelling' },
    levels: { term: 'Audio levels', def: 'How loud each sound is; dialogue usually sits around −12 to −6 dB, with music underneath.', skill: 'Audio' },
    grade: { term: 'Color grade', def: 'Adjusting color and contrast to create a consistent look and mood.', requires: ['correction'], skill: 'Color' },
    correction: { term: 'Color correction', def: 'Fixing exposure and white balance so shots match before you style them.', skill: 'Color' },
    keyframe: { term: 'Keyframe', def: 'A marker that sets a value at a point in time so the editor can animate between values.', skill: 'Pacing' },
    arc: { term: 'Story arc', def: 'The shape of a story: setup, tension, and payoff.', skill: 'Storytelling' },
  },
  modules: [
    { title: 'Editing Fundamentals', description: 'The interface, the timeline, and the logic of a cut.', lessons: [
      L('What editing really is', 'Editing Is Invisible: The Craft Explained', 'cutroom', 13.4, 'See editing as decision-making, not software.', ['cut', 'timeline'], { views: 1_900_000 }),
      L('Setting up a project', 'DaVinci Resolve Setup for Beginners', 'cutroom', 15.8, 'Organise media and the timeline.', ['timeline']),
      L('Shot types and coverage', 'Every Shot Type Explained in 10 Minutes', 'lumen', 10.2, 'Recognise shot types and what they do.', ['shottype']),
    ] },
    { title: 'Cuts & Pacing', description: 'Control rhythm and attention.', requires: ['cut'], lessons: [
      L('Cutting on action', 'Cutting on Action: The Seamless Edit', 'cutroom', 11.6, 'Make cuts feel invisible.', ['cut']),
      L('J-cuts and L-cuts', 'J-Cuts & L-Cuts Will Change Your Edits', 'cutroom', 9.7, 'Use audio to smooth transitions.', ['jcut']),
      L('Pacing a sequence', 'How Pacing Keeps Viewers Watching', 'cutroom', 14.9, 'Shape rhythm deliberately.', ['pacing'], {
        exercise: textExercise('Cut this sequence into a 30-second story using three different shot types. Describe your cut list: each shot, its type, and its length.', 'List shots in order with a type (wide, medium, close) and a length in seconds. Lengths should add up to about 30.', [['wide', 'Uses a wide shot'], ['medium|mid', 'Uses a medium shot'], ['close', 'Uses a close-up'], ['\\d+\\s*(s|sec)', 'Gives shot lengths']], '1. Wide, kitchen, 4s\n2. Medium, chopping, 6s\n3. Close, knife on board, 2s\n…'),
      }),
    ] },
    { title: 'Audio', description: 'Half of video is sound.', requires: ['timeline'], lessons: [
      L('Cleaning dialogue', 'Fix Bad Dialogue Audio in Resolve', 'soundbed', 13.1, 'Reduce noise and even out voices.', ['levels']),
      L('Music and levels', 'Mixing Music Under Voice Like a Pro', 'soundbed', 11.4, 'Balance music with dialogue.', ['levels']),
      L('Sound design basics', 'Sound Design Basics for Video Editors', 'soundbed', 12.7, 'Add texture with effects and ambience.', ['levels']),
    ] },
    { title: 'B-Roll', description: 'Cover, illustrate and add meaning.', requires: ['cut'], lessons: [
      L('What b-roll is for', 'B-Roll Explained: More Than Filler', 'lumen', 10.8, 'Use b-roll with intent.', ['broll']),
      L('Shooting b-roll that cuts', 'Shoot B-Roll That Actually Edits Well', 'lumen', 13.9, 'Capture usable supporting shots.', ['broll', 'shottype']),
    ] },
    { title: 'Color', description: 'Consistent, intentional images.', requires: ['timeline'], lessons: [
      L('Color correction', 'Color Correction Basics (Scopes Explained)', 'kai', 16.2, 'Match exposure and white balance.', ['correction'], { views: 820_000 }),
      L('Creating a look', 'Build a Cinematic Grade From Scratch', 'kai', 14.4, 'Grade with a clear mood.', ['grade']),
      L('Matching shots', 'Match Any Two Shots in Five Minutes', 'kai', 9.3, 'Make a scene feel continuous.', ['correction', 'grade']),
    ] },
    { title: 'Motion', description: 'Titles and movement that support the story.', requires: ['pacing'], lessons: [
      L('Keyframes', 'Keyframes Explained for Editors', 'cutroom', 10.6, 'Animate with keyframes.', ['keyframe']),
      L('Clean titles', 'Minimal Titles That Look Professional', 'cutroom', 12.1, 'Design readable titles.', ['keyframe']),
      L('Motion with restraint', 'When Not to Animate', 'kai', 8.9, 'Use motion only when it helps.', ['keyframe', 'pacing']),
    ] },
    { title: 'Storytelling', description: 'Structure that holds attention.', requires: ['pacing', 'broll'], lessons: [
      L('Structure and arcs', 'Story Structure for YouTube Videos', 'cutroom', 15.7, 'Shape a beginning, middle and end.', ['arc']),
      L('Hooks and endings', 'Write a Hook in the Edit', 'cutroom', 11.2, 'Open strong and land the ending.', ['arc', 'pacing']),
    ] },
    { title: 'Final Project', description: 'Make and publish a five-minute video.', requires: ['arc', 'grade'], project: 'Create and publish a five-minute video.', lessons: [
      L('Planning your video', 'Plan a Video in One Page', 'cutroom', 10.4, 'Plan shots, story and schedule.', ['arc']),
      L('Project: Edit and publish', 'Editing a Viewer’s Video Start to Finish', 'cutroom', 28.6, 'Finish and publish your video.', ['pacing', 'grade', 'levels'], { project: true }),
    ] },
  ],
};

export const business: CourseSpec = {
  id: 'business',
  title: 'Start a Business From Scratch',
  tagline: 'Find a real problem, prove people will pay, and get your first customers.',
  description: 'A practical path from idea to paying customers, assembled from founders and operators who have done it.',
  category: 'business', topic: 'Starting a Business', level: 'Beginner',
  skills: ['Customer discovery', 'Validation', 'Product definition', 'Pricing', 'Distribution'],
  tools: ['A notebook', 'A spreadsheet', 'A free landing page builder'],
  outcomes: ['Find problems worth solving', 'Run customer interviews that reveal truth', 'Validate demand before building', 'Price with confidence', 'Get your first ten customers'],
  cover: { hue: 140, motif: 'diagram' },
  finalProject: { title: 'A Validated MVP', summary: 'Validate a business idea with real conversations and launch a minimum product to your first customers.', deliverable: 'Interview notes, a landing page, and your first sales.', milestones: [
    { id: 'bz-1', title: '10 customer interviews', lessonId: 'business-m2-l2' },
    { id: 'bz-2', title: 'A one-sentence value proposition', lessonId: 'business-m4-l2' },
    { id: 'bz-3', title: 'Landing page live', lessonId: 'business-m5-l2' },
    { id: 'bz-4', title: 'First paying customer', lessonId: 'business-m6-l2' },
  ] },
  glossary: {
    problem: { term: 'Problem worth solving', def: 'A frequent, painful problem that people already spend time or money trying to fix.', skill: 'Customer discovery' },
    interview: { term: 'Customer interview', def: 'A conversation about someone’s past behaviour and problems, not your idea.', example: 'Ask “When did this last happen?”, not “Would you use this?”', requires: ['problem'], skill: 'Customer discovery' },
    validation: { term: 'Validation', def: 'Evidence that people want something, ideally through commitment like money, time or a signup.', requires: ['interview'], skill: 'Validation' },
    valueprop: { term: 'Value proposition', def: 'A clear statement of who it’s for, what problem it solves, and why it’s better.', requires: ['problem'], skill: 'Product definition' },
    mvp: { term: 'MVP', def: 'The smallest product that delivers the core value and lets you learn from real use.', requires: ['valueprop'], skill: 'Product definition' },
    pricing: { term: 'Value-based pricing', def: 'Setting price from the value the customer gets, not from your costs.', requires: ['valueprop'], skill: 'Pricing' },
    channel: { term: 'Distribution channel', def: 'The repeatable way customers find you, such as search, communities, partners or outbound.', skill: 'Distribution' },
    metric: { term: 'North-star metric', def: 'The one number that best reflects the value customers get from your product.', skill: 'Validation' },
    iteration: { term: 'Iteration', def: 'Changing the product based on evidence, in small steps, and measuring again.', requires: ['metric'], skill: 'Validation' },
  },
  modules: [
    { title: 'Finding a Problem', description: 'Start with pain, not ideas.', lessons: [
      L('Where good ideas come from', 'Stop Looking for Startup Ideas. Do This Instead.', 'fhq', 14.2, 'Find problems from your own experience and work.', ['problem'], { views: 2_700_000 }),
      L('Sizing a problem', 'Is Your Problem Big Enough?', 'ssp', 11.3, 'Judge frequency and pain.', ['problem']),
    ] },
    { title: 'Customer Discovery', description: 'Learn the truth from real people.', requires: ['problem'], lessons: [
      L('How to interview customers', 'Customer Interviews: The Questions That Actually Work', 'nadia', 17.4, 'Run interviews that reveal behaviour.', ['interview'], { views: 980_000 }),
      L('Finding people to talk to', 'Get 10 Customer Interviews This Week', 'nadia', 12.6, 'Recruit interviewees fast.', ['interview']),
    ] },
    { title: 'Validation', description: 'Evidence before building.', requires: ['interview'], lessons: [
      L('Signals vs compliments', 'Why “I’d Use That” Means Nothing', 'nadia', 10.1, 'Tell real demand from politeness.', ['validation']),
      L('Pre-selling', 'Pre-Sell Before You Build', 'ssp', 13.7, 'Get commitment before building.', ['validation']),
    ] },
    { title: 'Product Definition', description: 'Decide exactly what you’re building and for whom.', requires: ['validation'], lessons: [
      L('Who it’s for', 'Define Your First Customer Precisely', 'fhq', 11.9, 'Pick a narrow first customer.', ['valueprop']),
      L('Your value proposition', 'Write a Value Proposition That Converts', 'fhq', 10.4, 'Say what you do in one sentence.', ['valueprop'], {
        exercise: textExercise('Write a one-sentence value proposition for your product.', 'Name who it’s for, the problem, and what makes it better: “For [who] who [problem], [product] [benefit], unlike [alternative].”', [['for\\s+\\w+', 'Names who it’s for'], ['who|struggle|need|problem|tired', 'States the problem'], ['unlike|instead|without|faster|cheaper|better', 'Says why it’s better']], 'For freelance designers who lose hours chasing invoices, Paidly sends and follows up automatically, unlike spreadsheets that rely on memory.'),
      }),
    ] },
    { title: 'MVP', description: 'Build the smallest thing that proves value.', requires: ['valueprop'], lessons: [
      L('Scoping an MVP', 'What an MVP Actually Is (It’s Smaller Than You Think)', 'fhq', 12.8, 'Cut scope to the core.', ['mvp']),
      L('No-code MVPs', 'Launch an MVP Without Code', 'ssp', 16.5, 'Ship with no-code tools.', ['mvp']),
    ] },
    { title: 'First Customers', description: 'Do things that don’t scale.', requires: ['mvp'], lessons: [
      L('Your first ten customers', 'How to Get Your First 10 Customers', 'fhq', 15.1, 'Find early customers by hand.', ['channel']),
      L('Selling without being salesy', 'Sales for People Who Hate Selling', 'nadia', 13.4, 'Run a simple sales conversation.', ['channel']),
    ] },
    { title: 'Pricing', description: 'Charge what it’s worth.', requires: ['valueprop'], lessons: [
      L('Value-based pricing', 'Pricing Is a Product Decision', 'pricelab', 14.6, 'Price from customer value.', ['pricing'], { views: 410_000 }),
      L('Pricing pages and tiers', 'Design Pricing Tiers That Make Sense', 'pricelab', 11.8, 'Structure plans clearly.', ['pricing']),
    ] },
    { title: 'Distribution', description: 'Build a repeatable way to be found.', requires: ['channel'], lessons: [
      L('Picking a channel', 'Choose One Growth Channel and Commit', 'fhq', 12.4, 'Choose a primary channel.', ['channel']),
      L('Content and community', 'Grow With Content When You Have No Budget', 'ssp', 13.9, 'Grow through content and communities.', ['channel']),
    ] },
    { title: 'Measurement', description: 'Know what’s working.', requires: ['mvp'], lessons: [
      L('Metrics that matter', 'The Only Startup Metrics That Matter Early', 'fhq', 11.6, 'Pick a north-star metric.', ['metric']),
      L('Talking to churned customers', 'Learn the Most From Customers Who Leave', 'nadia', 9.8, 'Learn from churn.', ['metric', 'interview']),
    ] },
    { title: 'Iteration', description: 'Improve with evidence.', requires: ['metric'], project: 'Validate a business idea and launch an MVP.', lessons: [
      L('Deciding what to change', 'Pivot, Persevere, or Polish?', 'fhq', 13.2, 'Make evidence-based decisions.', ['iteration']),
      L('Project: Launch your MVP', 'Founder Teardown: 5 Viewer MVP Launches', 'ssp', 21.5, 'Launch and review your MVP.', ['mvp', 'validation', 'iteration'], { project: true }),
    ] },
  ],
};

export const productDesign: CourseSpec = {
  id: 'product-design',
  title: 'Product Design Fundamentals',
  tagline: 'From user problem to tested prototype.',
  description: 'Learn the end-to-end product design process used by working designers, from research to a tested mobile prototype.',
  category: 'design', topic: 'Product Design', level: 'Beginner → Intermediate',
  skills: ['Research', 'Problem framing', 'Interaction design', 'Visual design', 'Prototyping'],
  tools: ['Figma (free)', 'Paper and pen'],
  outcomes: ['Turn research into a clear problem statement', 'Map flows and structure', 'Design and prototype interfaces', 'Run a usability test', 'Present a case study'],
  cover: { hue: 260, motif: 'type' },
  finalProject: { title: 'A Mobile Product Prototype', summary: 'Design and prototype a mobile product for a real problem, and test it with five people.', deliverable: 'A clickable prototype and a short case study.', milestones: [
    { id: 'pd-1', title: 'Problem statement from interviews', lessonId: 'product-design-m2-l2' },
    { id: 'pd-2', title: 'Core user flow mapped', lessonId: 'product-design-m3-l2' },
    { id: 'pd-3', title: 'High-fidelity screens', lessonId: 'product-design-m7-l2' },
    { id: 'pd-4', title: 'Tested with five people', lessonId: 'product-design-m9-l2' },
  ] },
  glossary: {
    research: { term: 'User research', def: 'Studying people’s behaviour and needs to inform design decisions.', skill: 'Research' },
    persona: { term: 'Persona', def: 'A grounded summary of a type of user, their goals and context, based on research.', requires: ['research'], skill: 'Research' },
    problem: { term: 'Problem statement', def: 'A concise description of a user, their need, and why it matters, used to focus design.', requires: ['research'], skill: 'Problem framing' },
    flow: { term: 'User flow', def: 'The sequence of steps a person takes to complete a task.', requires: ['problem'], skill: 'Interaction design' },
    ia: { term: 'Information architecture', def: 'How content and features are organised, labelled and found.', requires: ['flow'], skill: 'Interaction design' },
    wireframe: { term: 'Wireframe', def: 'A low-fidelity layout showing structure and hierarchy without visual polish.', requires: ['ia'], skill: 'Prototyping' },
    affordance: { term: 'Affordance', def: 'A visual cue that suggests how something can be used.', example: 'A raised button looks pressable.', skill: 'Interaction design' },
    hierarchy: { term: 'Visual hierarchy', def: 'Arranging size, weight, color and space so the most important thing is seen first.', skill: 'Visual design' },
    prototype: { term: 'Prototype', def: 'An interactive model of a design used to test ideas before building.', requires: ['wireframe'], skill: 'Prototyping' },
    usability: { term: 'Usability test', def: 'Watching real people try to complete tasks with your design to find problems.', requires: ['prototype'], skill: 'Research' },
  },
  modules: [
    { title: 'Understanding Users', description: 'Research that changes decisions.', lessons: [
      L('What product designers do', 'What Product Designers Actually Do All Day', 'ines', 12.6, 'Understand the role and process.', ['research'], { views: 1_200_000 }),
      L('Interviewing users', 'User Interviews for Designers', 'ux', 15.3, 'Run a research interview.', ['research', 'persona']),
    ] },
    { title: 'Problem Framing', description: 'Design the right thing.', requires: ['research'], lessons: [
      L('Synthesising research', 'From Sticky Notes to Insights', 'ux', 13.4, 'Find patterns in research.', ['research']),
      L('Writing a problem statement', 'Write a Problem Statement That Focuses Your Team', 'ines', 10.2, 'Frame a clear problem.', ['problem']),
    ] },
    { title: 'User Flows', description: 'Map how people get things done.', requires: ['problem'], lessons: [
      L('Task analysis', 'Break Any Task Into Steps', 'ines', 9.8, 'Decompose tasks.', ['flow']),
      L('Mapping flows', 'User Flows in Figma, Step by Step', 'hfd', 14.7, 'Draw a complete user flow.', ['flow']),
    ] },
    { title: 'Information Architecture', description: 'Structure and navigation.', requires: ['flow'], lessons: [
      L('Organising content', 'Information Architecture, Simply Explained', 'gridline', 13.1, 'Group and label content.', ['ia']),
      L('Navigation patterns', 'Mobile Navigation Patterns Compared', 'gridline', 11.9, 'Pick the right navigation.', ['ia']),
    ] },
    { title: 'Wireframing', description: 'Structure before style.', requires: ['ia'], lessons: [
      L('Sketching', 'Sketch Faster Than You Can Click', 'ines', 8.7, 'Explore ideas on paper.', ['wireframe']),
      L('Wireframes in Figma', 'Wireframing in Figma for Beginners', 'hfd', 16.8, 'Build clean wireframes.', ['wireframe'], { views: 1_600_000 }),
    ] },
    { title: 'Interaction Design', description: 'How it behaves.', requires: ['wireframe'], lessons: [
      L('Affordances and feedback', 'Why Some Buttons Feel Obvious', 'gridline', 12.3, 'Design clear affordances and feedback.', ['affordance']),
      L('States and edge cases', 'Design Empty, Error and Loading States', 'gridline', 13.6, 'Design every state.', ['affordance', 'flow']),
    ] },
    { title: 'Visual Design', description: 'Hierarchy, type, color and spacing.', requires: ['wireframe'], lessons: [
      L('Hierarchy and spacing', 'Visual Hierarchy: The One Skill That Matters Most', 'gridline', 14.9, 'Direct attention deliberately.', ['hierarchy'], {
        exercise: textExercise('Redesign this checkout screen using the principles from this module. Describe the three changes you’d make and why.', 'Think about what the person must see first, what’s competing for attention, and how spacing groups related things.', [['hierarch|first|primary', 'Addresses hierarchy'], ['spac|group|align', 'Uses spacing or grouping'], ['because|so that|why', 'Explains the reasoning']], '1. Make the total and Pay button the primary focal point…'),
      }),
      L('High-fidelity screens', 'From Wireframe to Polished UI in Figma', 'hfd', 21.2, 'Apply visual design to wireframes.', ['hierarchy']),
    ] },
    { title: 'Prototyping', description: 'Make it clickable.', requires: ['hierarchy'], lessons: [
      L('Prototyping in Figma', 'Figma Prototyping Crash Course', 'hfd', 18.4, 'Link screens into a prototype.', ['prototype']),
      L('Realistic prototypes', 'Make Prototypes Feel Real', 'hfd', 12.7, 'Add realistic content and transitions.', ['prototype']),
    ] },
    { title: 'Testing', description: 'Learn from real people.', requires: ['prototype'], lessons: [
      L('Planning a usability test', 'Run Your First Usability Test', 'ux', 14.1, 'Plan tasks and recruit participants.', ['usability']),
      L('Running and synthesising tests', 'What to Do With Usability Findings', 'ux', 12.4, 'Turn findings into changes.', ['usability']),
    ] },
    { title: 'Final Project', description: 'Design, prototype and test a mobile product.', requires: ['usability'], project: 'Design and prototype a mobile product.', lessons: [
      L('Writing a case study', 'Design Case Studies That Get Interviews', 'ines', 13.8, 'Present your process clearly.', ['problem', 'usability']),
      L('Project: Your mobile prototype', 'Portfolio Review: Viewer Prototypes', 'ines', 24.5, 'Finish and present your project.', ['prototype', 'usability'], { project: true }),
    ] },
  ],
};

export const photography: CourseSpec = {
  id: 'photography',
  title: 'Photography: See and Shoot',
  tagline: 'Understand light and exposure, then make pictures on purpose.',
  description: 'Get off auto and make photographs you’re proud of, using any camera including your phone.',
  category: 'creative', topic: 'Photography', level: 'Beginner',
  skills: ['Exposure', 'Composition', 'Light', 'Editing'],
  tools: ['Any camera or a recent phone', 'A free photo editor'],
  outcomes: ['Control exposure manually', 'Compose with intent', 'Use natural light', 'Edit consistently'],
  cover: { hue: 28, motif: 'wave' },
  finalProject: { title: 'A 12-Photo Series', summary: 'Shoot and edit a cohesive series of 12 photographs on one theme.', deliverable: 'A published gallery with a short statement.', milestones: [
    { id: 'ph-1', title: 'Shoot in manual for a week', lessonId: 'photography-m1-l3' },
    { id: 'ph-2', title: 'Pick a theme and shoot 100 frames', lessonId: 'photography-m4-l2' },
    { id: 'ph-3', title: 'Edit and sequence 12', lessonId: 'photography-m6-l2' },
  ] },
  glossary: {
    aperture: { term: 'Aperture', def: 'The opening in the lens that controls light and depth of field.', skill: 'Exposure' },
    shutter: { term: 'Shutter speed', def: 'How long the sensor is exposed, controlling light and motion blur.', skill: 'Exposure' },
    iso: { term: 'ISO', def: 'The sensor’s sensitivity to light; higher ISO is brighter but noisier.', skill: 'Exposure' },
    triangle: { term: 'Exposure triangle', def: 'The balance of aperture, shutter speed and ISO that determines exposure.', requires: ['aperture', 'shutter', 'iso'], skill: 'Exposure' },
    composition: { term: 'Composition', def: 'How elements are arranged in the frame to guide the eye.', skill: 'Composition' },
    light: { term: 'Quality of light', def: 'Whether light is hard or soft, and its direction and color.', skill: 'Light' },
    edit: { term: 'Photo editing', def: 'Adjusting exposure, color and crop to finish an image consistently.', skill: 'Editing' },
  },
  modules: [
    { title: 'Exposure', description: 'Get off auto.', lessons: [
      L('Aperture', 'Aperture Explained in 8 Minutes', 'aperture', 8.4, 'Control depth of field.', ['aperture'], { views: 2_100_000 }),
      L('Shutter speed and ISO', 'Shutter Speed & ISO Without Confusion', 'aperture', 11.2, 'Freeze or blur motion.', ['shutter', 'iso']),
      L('The exposure triangle', 'The Exposure Triangle, Finally Clear', 'aperture', 13.6, 'Balance all three.', ['triangle']),
    ] },
    { title: 'Composition', description: 'Arrange the frame.', requires: ['triangle'], lessons: [
      L('Beyond the rule of thirds', 'Composition Beyond the Rule of Thirds', 'lumen', 14.3, 'Compose with intent.', ['composition']),
      L('Simplify the frame', 'Make Better Photos by Removing Things', 'lumen', 9.6, 'Remove distractions.', ['composition']),
    ] },
    { title: 'Light', description: 'See light before you shoot.', lessons: [
      L('Hard and soft light', 'Hard vs Soft Light Explained', 'lumen', 10.9, 'Read light quality.', ['light']),
      L('Golden hour and window light', 'Use Window Light Like a Studio', 'lumen', 12.4, 'Use natural light well.', ['light']),
    ] },
    { title: 'Subjects', description: 'People, places and things.', requires: ['composition'], lessons: [
      L('Street and everyday', 'Street Photography for Shy People', 'aperture', 13.8, 'Photograph everyday life.', ['composition', 'light']),
      L('Finding a theme', 'How to Shoot a Photo Series', 'aperture', 11.5, 'Develop a theme.', ['composition']),
    ] },
    { title: 'Editing', description: 'Finish your images.', lessons: [
      L('Editing basics', 'Photo Editing Basics in 15 Minutes', 'kai', 15.1, 'Adjust exposure and color.', ['edit']),
      L('A consistent style', 'Build a Consistent Editing Style', 'kai', 12.2, 'Edit a series consistently.', ['edit']),
    ] },
    { title: 'Final Project', description: 'A cohesive series.', project: 'Shoot and publish a 12-photo series.', lessons: [
      L('Sequencing a series', 'Sequencing Photos Into a Story', 'lumen', 10.7, 'Order images for impact.', ['composition']),
      L('Project: Your 12-photo series', 'Reviewing Viewer Photo Series', 'aperture', 19.4, 'Publish your series.', ['edit', 'composition'], { project: true }),
    ] },
  ],
};

export const finance: CourseSpec = {
  id: 'finance',
  title: 'Personal Finance That Works',
  tagline: 'A calm, practical system for your money.',
  description: 'Build a simple money system: budget, emergency fund, debt plan and long-term investing basics. Educational, not financial advice.',
  category: 'practical', topic: 'Personal Finance', level: 'Beginner',
  skills: ['Budgeting', 'Saving', 'Debt', 'Investing basics'],
  tools: ['A spreadsheet', 'Your last three months of statements'],
  outcomes: ['Build a budget you keep', 'Set up an emergency fund', 'Plan debt payoff', 'Understand index funds and compounding'],
  cover: { hue: 160, motif: 'grid' },
  finalProject: { title: 'Your Money System', summary: 'Build a one-page plan covering spending, saving, debt and long-term investing.', deliverable: 'A personal finance plan spreadsheet.', milestones: [
    { id: 'pf-1', title: 'Three months of spending categorised', lessonId: 'finance-m1-l2' },
    { id: 'pf-2', title: 'Emergency fund target set', lessonId: 'finance-m2-l2' },
    { id: 'pf-3', title: 'One-page plan finished', lessonId: 'finance-m6-l2' },
  ] },
  glossary: {
    budget: { term: 'Budget', def: 'A plan for where your money goes each month, made before you spend it.', skill: 'Budgeting' },
    emergency: { term: 'Emergency fund', def: 'Cash set aside for unexpected costs, commonly three to six months of essential expenses.', skill: 'Saving' },
    interest: { term: 'Compound interest', def: 'Earning returns on previous returns, which makes growth accelerate over time.', skill: 'Investing basics' },
    apr: { term: 'APR', def: 'The yearly cost of borrowing, including interest and some fees.', skill: 'Debt' },
    index: { term: 'Index fund', def: 'A fund that holds every company in a market index, offering low-cost diversification.', requires: ['interest'], skill: 'Investing basics' },
    diversification: { term: 'Diversification', def: 'Spreading money across many investments so no single one can sink you.', requires: ['index'], skill: 'Investing basics' },
  },
  modules: [
    { title: 'Where Your Money Goes', description: 'See the real picture.', lessons: [
      L('Money without stress', 'A Calm Approach to Personal Finance', 'ledger', 11.8, 'Set up a simple money mindset.', ['budget'], { views: 1_300_000 }),
      L('Tracking spending', 'Track Your Spending in 20 Minutes a Month', 'ledger', 13.4, 'Categorise your spending.', ['budget']),
    ] },
    { title: 'Saving', description: 'Build a buffer.', lessons: [
      L('Paying yourself first', 'Automate Your Savings', 'ledger', 9.7, 'Automate saving.', ['emergency']),
      L('Emergency funds', 'How Big Should Your Emergency Fund Be?', 'amara', 10.6, 'Set an emergency fund target.', ['emergency']),
    ] },
    { title: 'Debt', description: 'A plan to get out.', lessons: [
      L('Understanding APR', 'APR Explained: The True Cost of Debt', 'amara', 11.1, 'Compare debt costs.', ['apr']),
      L('Avalanche vs snowball', 'Debt Avalanche vs Snowball', 'ledger', 12.5, 'Choose a payoff strategy.', ['apr']),
    ] },
    { title: 'Investing Basics', description: 'Long-term growth, simply.', lessons: [
      L('Compounding', 'Compound Interest, Visualised', 'amara', 10.3, 'See how compounding works.', ['interest']),
      L('Index funds', 'Index Funds for Complete Beginners', 'amara', 14.8, 'Understand index funds.', ['index', 'diversification']),
    ] },
    { title: 'Protecting Yourself', description: 'Avoid common traps.', lessons: [
      L('Fees and fine print', 'The Fees Quietly Eating Your Money', 'ledger', 10.2, 'Spot hidden fees.', ['apr']),
      L('Avoiding hype', 'How to Ignore Financial Hype', 'amara', 9.4, 'Resist hype and FOMO.', ['diversification']),
    ] },
    { title: 'Final Project', description: 'Put it on one page.', project: 'Build your one-page money system.', lessons: [
      L('Designing your system', 'My Entire Money System on One Page', 'ledger', 15.6, 'Bring it together.', ['budget', 'emergency', 'index']),
      L('Project: Your money system', 'Reviewing Viewer Money Plans', 'ledger', 17.3, 'Finish your plan.', ['budget', 'index'], { project: true }),
    ] },
  ],
};

export const website: CourseSpec = {
  id: 'website',
  title: 'Build Your First Website',
  tagline: 'HTML, CSS and a little JavaScript, all the way to a live site with your name on it.',
  description: 'Go from a blank file to a fast, responsive personal website on your own domain.',
  category: 'technical', topic: 'Web Development', level: 'Beginner',
  skills: ['HTML', 'CSS', 'Layout', 'JavaScript', 'Shipping'],
  tools: ['VS Code', 'A browser', 'A free GitHub account'],
  outcomes: ['Structure pages with semantic HTML', 'Style and lay out pages with CSS', 'Make layouts responsive', 'Add interactivity with JavaScript', 'Deploy to your own domain'],
  cover: { hue: 196, motif: 'code' },
  finalProject: { title: 'Your Personal Website', summary: 'A responsive personal site with a home page, projects page and contact section, live on the internet.', deliverable: 'A public URL and the GitHub repo behind it.', milestones: [
    { id: 'ws-1', title: 'Home page in HTML', lessonId: 'website-m2-l3' },
    { id: 'ws-2', title: 'Styled and responsive', lessonId: 'website-m5-l3' },
    { id: 'ws-3', title: 'One interactive feature', lessonId: 'website-m6-l3' },
    { id: 'ws-4', title: 'Live on a domain', lessonId: 'website-m8-l3' },
  ] },
  glossary: {
    html: { term: 'HTML', def: 'The markup language that gives a web page its structure and meaning.', skill: 'HTML' },
    semantic: { term: 'Semantic HTML', def: 'Using elements that describe their content, like header, nav and article, for accessibility and clarity.', requires: ['html'], skill: 'HTML' },
    css: { term: 'CSS', def: 'The language that controls how HTML looks: color, type, spacing and layout.', requires: ['html'], skill: 'CSS' },
    boxmodel: { term: 'Box model', def: 'Every element is a box of content, padding, border and margin.', requires: ['css'], skill: 'CSS' },
    flexbox: { term: 'Flexbox', def: 'A CSS layout system for arranging items in a row or column.', requires: ['boxmodel'], skill: 'Layout' },
    grid: { term: 'CSS Grid', def: 'A two-dimensional CSS layout system of rows and columns.', requires: ['boxmodel'], skill: 'Layout' },
    responsive: { term: 'Responsive design', def: 'Layouts that adapt to different screen sizes, usually with media queries and flexible units.', requires: ['flexbox'], skill: 'Layout' },
    js: { term: 'JavaScript', def: 'The programming language browsers run to make pages interactive.', skill: 'JavaScript' },
    dom: { term: 'DOM', def: 'The browser’s live model of the page, which JavaScript reads and changes.', requires: ['js', 'html'], skill: 'JavaScript' },
    hosting: { term: 'Hosting', def: 'A server that stores your files and serves them to anyone who visits your URL.', skill: 'Shipping' },
    domain: { term: 'Domain', def: 'A human-readable address like yourname.com that points to your host.', requires: ['hosting'], skill: 'Shipping' },
  },
  modules: [
    { title: 'How the Web Works', description: 'Browsers, servers, and what a website actually is.', lessons: [
      L('What happens when you visit a site', 'How the Internet Delivers a Web Page', 'sl', 11.4, 'Understand requests, servers and browsers.', ['hosting'], { views: 1_800_000 }),
      L('Setting up your tools', 'Set Up VS Code for Web Development', 'sl', 9.8, 'Install and configure your editor.', ['html']),
    ] },
    { title: 'HTML', description: 'Structure and meaning.', lessons: [
      L('Your first page', 'HTML in 15 Minutes: Your First Web Page', 'sl', 15.2, 'Write a valid HTML page.', ['html']),
      L('Semantic structure', 'Semantic HTML Explained (and Why It Matters)', 'gridline', 12.1, 'Use meaningful elements.', ['semantic']),
      L('Links, images and forms', 'HTML Links, Images & Forms', 'sl', 14.6, 'Add links, images and a form.', ['html']),
    ] },
    { title: 'CSS Basics', description: 'Make it look like yours.', requires: ['html'], lessons: [
      L('Selectors and properties', 'CSS for Absolute Beginners', 'gridline', 16.3, 'Style elements with CSS.', ['css'], { views: 2_300_000 }),
      L('The box model', 'The CSS Box Model, Visually', 'gridline', 10.4, 'Control spacing.', ['boxmodel']),
      L('Typography and color', 'Web Typography Basics', 'gridline', 12.8, 'Set type and color well.', ['css']),
    ] },
    { title: 'Layout', description: 'Put things where you want them.', requires: ['boxmodel'], lessons: [
      L('Flexbox', 'Flexbox in 20 Minutes', 'sl', 19.6, 'Lay out rows and columns.', ['flexbox']),
      L('CSS Grid', 'CSS Grid Layouts Made Easy', 'sl', 17.2, 'Build two-dimensional layouts.', ['grid']),
      L('Common layouts', 'Five Layouts Every Website Needs', 'gridline', 13.5, 'Build headers, cards and footers.', ['flexbox', 'grid']),
    ] },
    { title: 'Responsive Design', description: 'Works on every screen.', requires: ['flexbox'], lessons: [
      L('Mobile-first thinking', 'Mobile-First Design Explained', 'gridline', 11.2, 'Design for small screens first.', ['responsive']),
      L('Media queries', 'Media Queries in 10 Minutes', 'sl', 10.3, 'Adapt layouts with breakpoints.', ['responsive']),
      L('Responsive images and type', 'Responsive Images & Fluid Type', 'sl', 12.6, 'Scale media and text.', ['responsive']),
    ] },
    { title: 'JavaScript Basics', description: 'Make it interactive.', lessons: [
      L('JavaScript fundamentals', 'JavaScript Basics for Web Designers', 'bsl', 18.4, 'Write basic JavaScript.', ['js'], { views: 2_900_000 }),
      L('The DOM', 'The DOM Explained by Building Something', 'sl', 15.9, 'Change the page with code.', ['dom']),
      L('A small interactive feature', 'Build a Dark Mode Toggle', 'sl', 11.7, 'Add one interactive feature.', ['dom', 'js']),
    ] },
    { title: 'Polish', description: 'Fast, accessible, and finished.', requires: ['responsive'], lessons: [
      L('Accessibility basics', 'Web Accessibility in 15 Minutes', 'gridline', 14.8, 'Make your site usable by everyone.', ['semantic']),
      L('Performance', 'Make Your Website Load Fast', 'sl', 12.2, 'Optimise images and assets.', ['hosting']),
    ] },
    { title: 'Ship It', description: 'Put it on the internet.', requires: ['html', 'css'], project: 'Deploy your personal website.', lessons: [
      L('Git and GitHub', 'Git & GitHub for Beginners', 'bsl', 21.3, 'Version and publish your code.', ['hosting']),
      L('Free hosting', 'Deploy a Website for Free in 5 Minutes', 'sl', 8.9, 'Deploy your site.', ['hosting']),
      L('Project: Your site on a domain', 'Connect a Custom Domain (Step by Step)', 'sl', 12.4, 'Go live on your own domain.', ['domain', 'hosting'], { project: true }),
    ] },
  ],
};
