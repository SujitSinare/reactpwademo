# Unity Small Finance Bank — Loan Origination System (LOS)
> **Enterprise Credit Underwriting & Loan Operations Platform (Demo)**

[![Environment: Demo Sample Data](https://img.shields.io/badge/Environment-DEMO%20SAMPLE%20DATA-blue)](https://unitybank.demo.in)
[![Framework: React 18](https://img.shields.io/badge/Framework-React%2018%20%2B%20TypeScript-teal)](https://react.dev)
[![PWA: Ready](https://img.shields.io/badge/PWA-Installable%20%2B%20Workbox-emerald)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Web Push: VAPID](https://img.shields.io/badge/Web%20Push-VAPID%20Configured-cyan)](https://web.dev/push-notifications-overview/)
[![Build: Passing](https://img.shields.io/badge/Build-Passing-brightgreen)](https://vercel.com)

---

## 1. Executive Summary & Disclaimer

This project is a demonstration **Loan Origination System (LOS)** frontend and serverless API demo built for **Unity Small Finance Bank**. 

> **IMPORTANT DISCLAIMER**: This application is a simulated demonstration using synthetic mock data only. It is **not** an official bank application, does **not** collect or store real customer records, does **not** use real banking credentials or credit bureau APIs, and claims **no** official bank endorsement.

---

## 2. Product Features & Business Workflows

The application implements a complete, end-to-end retail and MSME lending pipeline:

1. **Role-Based Simulated Authentication**:
   - **Branch Officer** (`Rajesh Sharma` — Mumbai Fort Branch)
   - **Credit Analyst** (`Priya Iyer` — Central Underwriting Hub)
   - **Credit Manager** (`Amitav Sen` — Western Regional Office)
   - **Operations Manager** (`Sunita Patel` — Central Operations Cell)
   - **System Administrator** (`Vikramaditya Joshi` — IT & Systems)
   - *Switch roles instantly via the top-right header menu to test permissions.*

2. **Executive Dashboard (10 KPI Metrics & Visual Analytics)**:
   - Total Applications, Received Today, Pending Doc Verification, Pending Credit Appraisal, Pending Approvals, Approved Loans, Rejected Applications, Disbursement Pipeline, Portfolio Requested Volume, and Average Processing TAT.
   - Interactive Recharts: 6-month Application Volume & Sanction Trend, Portfolio Mix by Product (Personal, Business, LAP, Gold Loan), Status Distribution, and Branch-wise Demand.
   - Real-time Date and Branch filtering dynamically updates all 10 cards and charts.

3. **Loan Application Management**:
   - Comprehensive pipeline listing with search by ID (`ULOS-2026-XXXX`) and applicant name.
   - Filters by product, status, branch, and officer.
   - Sorting, pagination, Table vs Card view switcher for mobile/tablets.
   - One-click CSV export of filtered pipeline data.

4. **Multi-Step Origination Wizard (React Hook Form + Zod)**:
   - **Step 1: Applicant Information** (KYC, address, employment, vintage).
   - **Step 2: Loan Details** (facility, requested amount, tenure, interest rate, repayment frequency).
   - **Step 3: Income & Financial Appraisal** (real-time reducing EMI and Fixed Obligation Ratio / FOIR calculation).
   - **Step 4: Mandatory Document Checklist** (mock attachment of PAN, Aadhaar, salary slips, bank statement, photo).
   - **Step 5: Review & Confirmation Sign-off** (generates unique application ID, notifies pipeline, auto-saves drafts to local storage).

5. **Customer Management**:
   - Customer directory with masked identifiers (`ABCDE****G`, `****-****-8491`), credit scores, linked applications, and borrower dossiers.

6. **Document Verification Workbench**:
   - Scrutinize identity, income proofs, and bank statements; mark documents as *Verified* or *Rejected*; request missing documents.

7. **Credit Assessment Workbench**:
   - Deep-dive into applicant FOIR, simulated CIBIL score (300-900), risk tiering, underwriter checklist, and recommendation memos.

8. **Manager Sanction & Approval Queue**:
   - Role-guarded queue for Credit Managers to review appraisals, approve sanctions, request clarifications, or record mandatory adverse credit rejection memos.

9. **Disbursement Operations Hub**:
   - Inspect approved sanctions awaiting fund release, verify pre-disbursement conditions (stamped loan agreement, NACH e-mandate, credit insurance), and execute simulated RTGS/NEFT disbursements with generated UTR references (`UTRIB26300XXXXX`).

10. **Reports & Analytics**:
    - Product volume comparison, approval vs rejection rates, branch league table, and downloadable CSV reports.

11. **PWA & Offline Operations Center**:
    - Standalone installable PWA with custom Install App button and `beforeinstallprompt` handling.
    - Service Worker managed with `vite-plugin-pwa` and Workbox (`injectManifest` strategy).
    - Offline fallback and sync queue for offline draft saves.

12. **Web Push Notification Demo (VAPID)**:
    - Push subscription creation and VAPID public key distribution.
    - Serverless endpoint `/api/push-send` using `web-push` with server-side private key.
    - Service worker `push` event listener with clickable notifications that open the relevant loan dossier.

---

## 3. Technology Stack

- **Core**: React 18, TypeScript (strict mode), Vite 6
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom navy & teal banking design system
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms & Validation**: React Hook Form, Zod, `@hookform/resolvers`
- **PWA**: `vite-plugin-pwa`, Workbox Window, Web App Manifest
- **Push Notifications**: Web Push API, `web-push` (Node.js/Vercel Serverless)
- **Testing**: Vitest

---

## 4. Local Setup & Development

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### Installation
```powershell
# Clone the repository and navigate to workspace
git clone <repo-url>
cd reactpwademo

# Install dependencies
npm.cmd install
```

### Environment Variables
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

| Variable | Description | Default (Demo) |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Public key for browser PushManager subscription | `BGubeRBQtuBUbFZlAY6BdjdC0py0ac1T8r519D-x8RZXu8lrPiaQQCxA-yyIXPTOiJQ9vTRQ0Nri6hWRvFsGiVk` |
| `VAPID_PRIVATE_KEY` | Private key for serverless push signing | `HBYAMcNbaaQkcdoKCmnGt3vUMFnbwPRKTGa8zoOv_bQ` |
| `VAPID_SUBJECT` | Sender contact mailto URL | `mailto:operations@unitybank.demo.in` |
| `VITE_APP_MODE` | Application persistence mode (`demo` or `api`) | `demo` |

### Running Development Server
```powershell
npm.cmd run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Testing & Verification

Run the automated Vitest suite:
```powershell
npm.cmd test
```

Run TypeScript strict type checking:
```powershell
npx.cmd tsc --noEmit
```

Build the production bundle and PWA service worker:
```powershell
npm.cmd run build
```

Preview the production build locally:
```powershell
npm.cmd run preview
```

---

## 6. Vercel Deployment Instructions

The project is structured to deploy smoothly on **Vercel**:

### Option 1: Deploy via Vercel CLI
```powershell
# Install Vercel CLI if needed
npm.cmd i -g vercel

# Deploy to Vercel
vercel
```

### Option 2: Deploy via Git Integration (Vercel Dashboard)
1. Push your repository to GitHub / GitLab.
2. In the Vercel Dashboard, click **Add New Project** and select this repository.
3. Keep default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, configure:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
5. Click **Deploy**.

> **Note on Push Notifications on Vercel**:  
> `/api/push-send` and `/api/push-subscribe` run as Vercel Serverless Functions. Since Web Push requires an HTTPS origin, PWA installation and Push Notifications will function seamlessly on your `*.vercel.app` production domain.

---

## 7. Browser Capabilities & PWA Limitations

- **HTTPS Requirement**: Service Workers, PWA installation, and Web Push notifications require a secure context (`https://` or `http://localhost`).
- **iOS Safari**: Web Push on iOS requires iOS 16.4+ and requires the user to add the PWA to their Home Screen first.
- **Incognito/Private Browsing**: Browsers disable Push Notifications and persistent Service Workers in private tabs.
- **Local Storage / IndexedDB**: In Demo mode, loan status changes, new applications, and credit notes are persisted to your browser's local storage. You can restore the original 25+ seed files at any time via **Settings → Reset Database**.

---

## 8. License & Demonstration Notice
Demonstration project for Unity Small Finance Bank. Mock data only. All customer names, corporate entities, PAN/Aadhaar references, and bank account numbers are synthetic.
