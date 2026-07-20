# Ausaguide

Ausaguide is a modern, premium double-sided marketplace that connects travelers with local Kenyan hosts for authentic, certified, and community-driven tours. The application is built with real-time matching capabilities, offline service workers, and GDPR-compliant privacy compliance tools.

---

## 🚀 Tech Stack

### Frontend Client
- **Core Framework**: React (v18+) with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **State Management & Querying**: Supabase JS client

### Backend & Infrastructure
- **Database**: PostgreSQL (hosted on Supabase) with PostGIS extension for geospatial mapping queries
- **Auth**: Supabase Auth (with support for TOTP 2-Factor Authentication)
- **Serverless**: Deno-based Supabase Edge Functions
- **Payments**: Stripe Connect (for marketplace split payouts)
- **Identity KYC**: Didit (for guide document and identity verification)
- **Emails**: Brevo API (SMTP transaction mails and list subscription syncs)
- **Hosting**: Vercel CDN

---

## 📂 Folder Structure

```
├── .agents/               # Customized agent developer skills
├── docs/                  # Architecture & operational guides
│   ├── adr/               # Architecture Decision Records (ADR-001 to ADR-007)
│   ├── disaster-recovery  # Backup, restoration, and rollback procedures
│   └── chaos-testing      # Failure mode resilient engineering logs
├── load-test/             # K6 load testing scripts and instructions
├── public/                # Static assets and sw.js Service Worker caching
├── src/
│   ├── __tests__/         # Unit test suites (auth, tours, layouts)
│   ├── components/        # Shared components and page structures
│   ├── hooks/             # React custom hooks (SEO, network tracking)
│   ├── lib/               # Database client setups, TOTP helpers, validation
│   ├── pages/             # Route pages (Home, Tours list, Settings, Legal)
│   ├── main.tsx           # Application load and registration entrypoint
│   └── App.tsx            # Routes configurations
├── supabase/              # SQL migrations, database seeders, and Deno Edge Functions
├── LAUNCH.md              # Production deployment checklist
└── README.md              # Project onboarding guide
```

---

## ⚙️ Local Setup Instructions

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/ostinez/ausaguide.git
cd project
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the project:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Local Dev Server Run
To spin up the local development compilation server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Database Setup & Migrations
Ensure Supabase CLI is installed and link your project:
```bash
supabase link --project-ref your-project-id
supabase db push
```

### 5. Running Tests
To run unit and layout verification tests:
```bash
npm run test
```