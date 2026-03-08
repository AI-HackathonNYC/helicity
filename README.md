# Katabatic

**The system of record for stablecoin reserve risk.**

Cornell AI Hackathon 2026 · Programmable Capital Track

---

## Getting Your Machine Ready

### Prerequisites

Install these before anything else:

| Tool | Version | Install |
|------|---------|---------|
| **Python** | 3.11, 3.12, or 3.13 (NOT 3.14) | `brew install python@3.12` |
| **Node.js** | 18+ | `brew install node` |
| **Git** | any | `brew install git` |
| **GitHub CLI** | any | `brew install gh` then `gh auth login` |

### 1. Clone the repo

```bash
git clone https://github.com/AI-HackathonNYC/AI-Hackathon-Will-change-name-.git
cd AI-Hackathon-Will-change-name-
```

### 2. Run the setup script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Create a Python virtual environment in `backend/venv/`
- Install all Python dependencies (FastAPI, anthropic, openai, networkx, etc.)
- Copy `.env.example` to `.env` (you'll fill in keys next)
- Install all Node dependencies for the frontend
- Run a health check to verify the backend starts

### 3. Add your API keys

Edit `backend/.env` and fill in your keys:

```bash
# Required — get these BEFORE the hackathon
ANTHROPIC_API_KEY=sk-ant-...        # https://console.anthropic.com
OPENAI_API_KEY=sk-...               # https://platform.openai.com/api-keys
NOAA_API_TOKEN=...                  # https://api.weather.gov (free, instant)
ETHERSCAN_API_KEY=...               # https://etherscan.io/myapikey (free tier)
PINATA_API_KEY=...                  # https://app.pinata.cloud/developers (free tier)
PINATA_SECRET_API_KEY=...           # Same Pinata dashboard
```

**DO NOT commit this file.** It's in `.gitignore`.

### 4. Verify everything works

**Start the backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```
You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```
Visit http://localhost:8000/health — you should get `{"data":{"status":"ok"},...}`

**Start the frontend** (in a separate terminal):
```bash
cd frontend
npm run dev
```
You should see:
```
VITE v6.x.x  ready in Xms
➜  Local:   http://localhost:5173/
```

**Start the slides** (if needed, separate terminal):
```bash
cd slides-app
npm run dev
```

### 5. You're ready

If both health check and frontend dev server start without errors, you're good to go.

---

## Project Structure

```
├── backend/          ← FastAPI API + scoring engine (Python)
├── frontend/         ← React dashboard (TypeScript)
├── slides-app/       ← Pitch deck presentation (React)
├── data/             ← Seed fixtures, extracted data
├── scripts/          ← One-off data processing scripts
├── setup.sh          ← One-command dev setup
├── CLAUDE.md         ← Full project spec
└── TASKS.md          ← Master task list
```

## Collaborators

- Adi Prathapa
- Aritro Ganguly
