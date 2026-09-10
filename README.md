# ResumeCraft

A premium, client-side resume builder with multiple templates,
ATS analysis, job keyword matching and smart writing assistance.

## 🚀 Live Demo

[Open ResumeCraft](https://YOUR-USERNAME.github.io/ResumeCraft/)

## ✨ Features

- Premium resume dashboard
- Multiple resume management
- Light / dark mode
- 6 professional templates
- Live resume preview
- PDF export
- ATS-style resume score
- Job description keyword matching
- Smart writing assistance
- Skills search and dropdown
- Drag-and-drop sections
- Local autosave
- Responsive design
- No backend required

## Run

Open `index.html` in a modern browser.

Recommended local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

### Netlify
Upload the folder or connect a Git repository. No build command is required; publish the project root.

### Vercel
Import the repository, select the static/Other preset, leave the build command empty and deploy the root.

### GitHub Pages
Push the files to GitHub, then enable Settings → Pages → Deploy from branch → root.

## Important: Smart Assist

ResumeCraft's Smart Assist is intentionally **browser-only**. It uses a deterministic writing helper so the application remains genuinely client-side and does not expose an AI API key in the browser.

It can:
- improve a short professional summary,
- strengthen weak action phrases in experience bullets,
- suggest job-description keywords.

For a true LLM integration (OpenAI, Anthropic, Gemini, etc.), add a secure server-side proxy so the API key is never shipped to the browser.

## Privacy

Resume data and dashboard records are stored in this browser's localStorage. There is no ResumeCraft backend in this project.

PDF libraries and web fonts are loaded from public CDNs. The editor itself still works without them, but PDF export requires the PDF libraries to load.

## Structure

```text
ResumeCraft-Pro/
├── index.html
├── styles.css
├── script.js
└── README.md
```
