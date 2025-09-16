## Getting Started

First, cd into the backend directory and run the backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Then, cd into /frontend run the development server:

```bash
npm run dev
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
