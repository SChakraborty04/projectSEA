# SuperEA v1 Alpha: AI Executive Assistant & Command Center

SuperEA is a real-time, proactive AI Executive Assistant Command Center built using **Next.js**, **PostgreSQL (Neon)**, and **Corsair**. It automates email management and calendar scheduling through real-time webhook events, custom machine learning threat detection, and interactive approvals.

---

## 🚀 Key Features & Workflow Improvements

### 1. Suggest Improvement Loop (Dashboard & Telegram)
- Users can request changes or improvements to generated email drafts directly from the dashboard card, side drawer, or Telegram bot interface.
- Clicking **Suggest Improvement** dynamically routes feedback to the AI agent, which rewrites the draft, preserves the signature/style details, updates the database, and rewrites the Telegram inline markup card for approval.

### 2. Phishing & Threat Filtering (Hugging Face DistilBERT)
- All incoming emails are routed through a deployed Hugging Face Space running `cybersectony/phishing-email-detection-distilbert_v2.1`.
- Incoming scams are instantly classified (scams mapped to threat flags) and updated in the database to prevent phishing exploits, while legitimate emails are processed safely.

### 3. Auto-Rebuilt Daily Context Logs
- SuperEA automatically builds a chronological, high-fidelity markdown "Daily Context" summarizing the user's email communications and calendar schedules.
- Dynamically loads and feeds **only** today's context into the AI agent's prompt to keep it aligned with the user's agenda without cluttering the context window.

### 4. Proactive Agent Scheduling & Response Drafting
- When a legitimate email arrives (e.g., requesting a meeting):
  - The proactive agent automatically checks calendar availability, timezone, working hours, buffer constraints, and notice settings.
  - If the user is busy, it drafts a polite reply proposing alternative slots.
  - If the user is free, it schedules the event.
  - Draft emails are sent directly to the user's **Telegram bot** and displayed on the web dashboard for explicit approval before sending.

### 5. Unified Workspace Viewports & Pinned Controls
- Pinned workspace heights (`h-[calc(100vh-48px)] overflow-hidden`) with independent scrollable panes for lists and details.
- Inputs, search fields, and action buttons are kept sticky and visible on the page to prevent scrolling fatigue.

### 6. Side Sheet Approval Drawer UX
- Click on any pending approval card on the dashboard to slide out a side sheet detailing the recipient (`To`), `Subject`, and the complete scrollable `Message Body`.
- Users can approve, discard, or request improvements directly from the sheet, enforcing signoffs exactly matching:
  ```text
  Best Regards,
  [User Name]
  ```

### 7. Keyboard Navigation & Productivity Keystrokes
- Superhuman-style keyboard shortcuts integrated globally across the dashboard:
  - `g` ➔ `d` : Go to Dashboard
  - `g` ➔ `c` : Go to AI Chat
  - `g` ➔ `e` : Go to Emails
  - `g` ➔ `a` : Go to Calendar
  - `g` ➔ `s` : Go to Agent Settings Setup
  - `c` : Compose / focus AI Chat box (bypassed on local email workspace to prevent layout collisions)
  - `t` : Toggle Sidebar collapse/expand
  - `d` : Toggle Light/Dark mode
  - `?` : Show Keyboard Shortcuts Help Menu

---

## 🛠 Tech Stack
- **Framework**: Next.js (with App Router, React 19)
- **Database**: PostgreSQL (Neon Database) & Drizzle ORM
- **Integrations**: Corsair (Gmail, Google Calendar, Telegram plugins)
- **AI Engine**: Mastra Agent Framework & OpenRouter (`gemini-3.1-flash-lite`)
- **Animations**: Framer Motion (for modal drawers and overlays)
- **Styles**: Tailwind CSS v4 & Lucide React Icons

---

## ⚡ Corsair Features Used
- **Gmail Plugin** (`@corsair-dev/gmail`): For syncing messages, listing threads, extracting bodies, and listening to incoming real-time notifications via `messageChanged` hooks.
- **Google Calendar Plugin** (`@corsair-dev/googlecalendar`): For fetching availability, scheduling events, and updating context via `onEventChanged` hooks.
- **Telegram Plugin** (`@corsair-dev/telegram`): For interactive bot command-handling and callback query approvals.

---

## 🏆 Bonus Tasks Attempted & Completed
- [x] **Real-time Webhooks**: Implemented through Corsair's Gmail and Calendar webhook hooks.
- [x] **Priority/Safety Email Filtering**: Deployed and integrated via DistilBERT phishing model.
- [x] **Corsair MCP Agent Chat**: Fully operational AI agent with workspace awareness.
- [x] **Suggest Improvement Flow**: Dynamic web and mobile/Telegram loop for AI rewriting.
- [x] **Keyboard Shortcuts**: Keyboard shortcuts navigation and premium animated `?` shortcut helper menu.

---

## 📖 How to Install & Run Locally

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd superea
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root with:
   ```env
   DATABASE_URL=postgres://...
   OPENROUTER_API_KEY=sk-or-...
   PHISHING_DETECTION_API_URL=https://sandipanch04-email-detection.hf.space/analyze
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=...
   TELEGRAM_WEBHOOK_SECRET=...
   ```

4. **Database Push**:
   ```bash
   npx drizzle-kit push
   ```

5. **Run the Development Server**:
   ```bash
   pnpm dev
   ```
