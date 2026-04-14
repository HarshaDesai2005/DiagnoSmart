# DiagnoSmart

DiagnoSmart is an AI-powered medical report explainer built with Next.js.  
It helps users upload lab reports (PDF/image), extract text, analyze medical findings with LLMs, and view understandable summaries with charts, abnormal values, and recommendations.

## Features

- Upload medical reports in `PDF`, `JPG`, or `PNG` format.
- Parse report content using `LlamaParse`.
- Analyze findings with Groq-powered LLM workflows.
- Display structured output:
  - summary
  - possible conditions
  - recommendations
  - red flags
  - abnormal values table
- English and Hindi language support.
- Text-to-speech support (`/api/tts`) for narrated analysis.
- Export report analysis as PDF.
- Backend protections: validation, retries, timeout handling, and rate limiting.

## Tech Stack

- `Next.js` (App Router), `React`, `TypeScript`
- `Tailwind CSS`, `shadcn/ui`, `Radix UI`
- `groq-sdk`, `llamaindex`
- `Recharts` for visualization
- `jsPDF` + `html2canvas` for PDF export
- `Vitest` for tests

## Project Structure

- `app/` - routes and API handlers
  - `api/upload/route.ts` - report upload + parse + analysis
  - `api/tts/route.ts` - text-to-speech audio stream
- `components/` - UI components and report visualization
- `lib/` - shared types, analysis logic, utilities, and helpers
- `public/` - static assets

## Getting Started

### Prerequisites

- Node.js `18+`
- npm
- Groq API key

### Installation

```bash
git clone https://github.com/<your-username>/DiagnoSmart.git
cd DiagnoSmart
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start local dev server (Turbopack)
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks
- `npm run test` - run test suite

## API Endpoints

- `POST /api/upload`
  - Accepts `multipart/form-data` (`file` + optional `language`)
  - Validates size/type and analyzes report content
- `GET /api/tts`
  - Accepts text input and returns audio stream

## Disclaimer

This app provides AI-assisted interpretation support and is **not** a replacement for professional medical diagnosis.  
Always consult a licensed healthcare professional before making medical decisions.
