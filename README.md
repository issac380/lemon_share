## Getting Started

### Quick Start (Recommended)

Run both backend and frontend with a single command:

```bash
npm start
```

This will start:
- Backend server on http://localhost:8001
- Frontend server on http://localhost:3000

### Manual Setup

If you prefer to run services separately:

1. **Backend:**
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### First Time Setup

Install all dependencies:

```bash
npm run setup
```

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # homepage (album grid)
│   │   ├── album/
│   │   │   └── [id]/page.tsx     # album detail page
│   ├── lib/
│   │   └── api.ts                # API helpers
│   └── globals.css
backend/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── db.py
│   ├── auth.py
│   ├── routes/
│   │   ├── public.py
│   │   └── admin.py
│   └── utils.py
├── media/
│   ├── albums/
│   └── thumbs/
└── requirements.txt
