# Peak Aura Lite

Peak Aura Lite is a local MVP scaffold for a full-stack wellness/productivity app.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: FastAPI
- Database: SQLite
- ORM: SQLModel
- Styling: Tailwind CSS
- API client: Axios
- Charts: Recharts

## Project Structure

```text
peak-aura/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── crud.py
│       ├── database.py
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       ├── seed.py
│       └── routes/
│           └── __init__.py
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── types/
└── README.md
```

## Backend Setup

1. Create and activate a virtual environment:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install the initial backend dependencies:

   ```powershell
   pip install fastapi uvicorn sqlmodel
   ```

3. Run the development server:

   ```powershell
   uvicorn app.main:app --reload
   ```

The SQLite database will live locally as `backend/peak_aura.db` once the app starts using the database layer.

## Frontend Setup

1. Initialize the Vite app inside the existing `frontend/` folder:

   ```powershell
   cd frontend
   npm create vite@latest . -- --template react-ts
   ```

2. Install the planned frontend dependencies:

   ```powershell
   npm install
   npm install axios recharts
   npm install -D tailwindcss postcss autoprefixer
   ```

3. Start the frontend development server:

   ```powershell
   npm run dev
   ```

## Current Status

This repository currently contains only the initial folder structure and lightweight backend placeholders. No advanced features or domain models have been added yet.
