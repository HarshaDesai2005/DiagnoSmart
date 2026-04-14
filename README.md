# DiagnoSmart

DiagnoSmart is an AI-powered medical report explainer. Upload a lab report (PDF/image), and the app converts complex clinical text into a clearer patient-friendly summary with abnormal values, risks, and recommendations.

## Features

- Upload medical reports in `PDF`, `JPG`, or `PNG` formats.
- Parse report text using `LlamaParse`.
- Analyze findings with Groq LLM pipelines.
- Show structured sections:
  - report summary
  - likely conditions
  - recommendation checklist
  - red-flag indicators
  - abnormal values table
- Visualize report health metrics using charts.
- Support English and Hindi analysis output.
- Built-in text-to-speech support for narrated results.
- Export analyzed results to PDF.
- API-level resilience with validation, retries, timeout handling, and rate limiting.

## Tech Stack

- `Next.js` (App Router) + `React` + `TypeScript`
- `Tailwind CSS` + `shadcn/ui` + `Radix UI`
- `Groq SDK` for LLM analysis
- `llamaindex` / `LlamaParse` for document text extraction
- `Recharts` for data visualization
- `jsPDF` + `html2canvas` for PDF export
- `Vitest` for testing

## Project Structure

- `app/` - routes and API endpoints
  - `api/upload/route.ts` - upload, parse, analyze pipeline
  - `api/tts/route.ts` - TTS audio generation endpoint
- `components/` - UI and feature components
- `lib/` - shared services, helpers, types, and utilities
- `public/` - static assets

## Getting Started

### Prerequisites

- Node.js `18+`
- npm
- Groq API key

### Installation

```bash
git clone https://github.com/Stroller15/swasthyadarpan-ai.git
cd swasthyadarpan-ai
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server (Turbopack)
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run lint checks
- `npm run test` - run Vitest suite

## API Endpoints

- `POST /api/upload`
  - Accepts `multipart/form-data` with file + language.
  - Validates type and size (up to 15MB).
  - Parses and analyzes report content.
- `GET /api/tts`
  - Accepts text for speech output.
  - Returns audio stream for playback.

## Disclaimer

This app provides AI-assisted interpretation support and is **not** a replacement for professional medical diagnosis. Always consult a qualified healthcare provider for clinical decisions.

