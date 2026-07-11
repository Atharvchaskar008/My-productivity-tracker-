# HyperTrack 🚀

**HyperTrack** is an ultra-premium, high-productivity single-page dashboard designed for daily activity and time tracking. Reminiscent of modern SaaS interfaces like Linear, Notion, and Reflect, HyperTrack replaces traditional clunky spreadsheets with an elegant, responsive, and satisfying developer-centric dashboard.

Built using **React**, **Tailwind CSS v4**, and **Lucide React** icons.

---

## 🎨 Design System & Aesthetics

- **Global Dark Mode:** Deep Slate/Zinc background (`#09090b`) contrasted with zinc text typography.
- **Glassmorphism Panels:** Clean surface structures featuring translucent fills (`bg-zinc-900/60`), border dividers (`border-white/10`), and a sharp backdrop blur (`backdrop-blur-md`).
- **Visual Pillars (Accents):**
  - 🟢 **DSA:** Emerald Green theme (`#10b981`)
  - 🟣 **Development:** Indigo Violet theme (`#6366f1`)
  - 🟡 **Study:** Amber Orange theme (`#f59e0b`)
- **Premium Micro-interactions:** Silky smooth hover transitions, calendar selection animations, and slide-in entries for time cards.

---

## ✨ Features & Architecture

### 1. Universal Time Engine (Stopwatch)
- High-precision digital timer format (`00:00:00`).
- **Stopwatch Injection:** One-click duration transfer directly into any of the 3 pillars (DSA, Development, Study). Pauses the timer, prompts for an optional description, attaches the block to the active calendar date, and resets.

### 2. Triple Pillar Grid
- Clear 3-column split representing key focus areas.
- **Dynamic Calculation:** Automatically sums and prints total logged hours and minutes under each column header for the selected date.
- **Quick Logging:** Horizontal inputs at the top of each pillar allow manual entries (Hours, Minutes, Note) for rapid retroactive logging.
- **Time Cards:** Interactive cards showing logged durations, notes, and dates, with a delete button fading in on hover.
- **Minimalist Empty States:** Beautiful dashed placeholders indicating columns that require attention.

### 3. Custom Calendar strip
- Horizontal 7-day calendar timeline.
- Chevron buttons slide the calendar week.
- Displays color-coded indicator dots under each calendar date to show where logs exist.
- Native calendar popover for selecting custom dates, plus a "Today" quick-return button.
- **Timezone Safety:** Complete client-side date parsing preventing date shifting across various global locations.

### 4. Interactive Notes Scratchpad
- Collapsible journaling drawer that slides in from the right.
- Format bar supporting cursor-relative formatting injections for markdown syntax:
    - `[ ]` Checkbox items
    - `•` Bullet list items
    - **Bold** formatting
    - *Italic* formatting
- Auto-save feedback indicators with immediate persistence.

---

## ⚙️ Technical Specifications & Setup

All logged logs, timeline states, and notes are hydrated and synchronized instantly with `localStorage`, guaranteeing zero layout shifts upon page refreshes.

### Development Requirements
Ensure you have [Node.js](https://nodejs.org) installed on your system.

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run local dev server:**
   ```bash
   npm run dev
   ```
3. **Run linter diagnostics:**
   ```bash
   npm run lint
   ```
4. **Compile production build:**
   ```bash
   npm run build
   ```

---

## 🚀 Vercel Deployment

Deploy the application instantly on Vercel:

### Option A: Via GitHub (Recommended)
1. Initialize git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "feat: complete hypertrack dashboard"
   ```
2. Push to your GitHub repository.
3. Import the repository in your [Vercel Dashboard](https://vercel.com/dashboard).

### Option B: Via Vercel CLI
1. Install CLI: `npm install -g vercel`
2. Deploy directly: `vercel`
