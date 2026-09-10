# ResumeCraft Pro

**ResumeCraft Pro** is a premium, client-side resume studio built with plain HTML, CSS and JavaScript.

## Included

- Premium dashboard and multiple-resume management
- Create, open, duplicate and delete resumes
- Light / dark application theme
- Six resume templates: Modern, Minimal, Classic, Executive, Creative, Elegant
- Template gallery with live switching
- Accent color and font controls
- Live A4 preview
- PDF export with html2canvas + jsPDF
- Repeatable Experience, Education, Projects and Certifications
- Project start/end dates
- Drag-and-drop ordering inside repeatable sections
- Searchable skill dropdown + custom skills
- Resume strength / ATS-style score
- Job description keyword matching
- Local smart writing assistance for summary, experience bullets and keyword suggestions
- Autosave to localStorage
- Required name/email validation
- Responsive desktop/mobile interface
- No backend, database or build step

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
