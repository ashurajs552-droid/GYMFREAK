# Gym Freak Nutrition & Workout Tracker

A complete full-stack web application for tracking nutrition, workouts, and health metrics.

## Features
- **User Profile & Analytics**: Calculates BMI, BMR, TDEE, and personalized macro targets.
- **Food Tracking**: Search database, log meals, and track daily macro intake.
- **Workout Tracking**: Log cardio and strength training with calorie burn estimation (METs).
- **Dashboard**: Visual progress bars, charts, and daily summaries.
- **Rich UI**: Modern dark-themed interface with glassmorphism effects.
- **Supabase Integration**: PostgreSQL database with Row Level Security.
- **Auth**: Supabase Auth (Email/Password).

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS (Custom Design System), Chart.js
- **Backend**: Node.js, Express, Supabase Client
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## Setup Instructions

### 1. Supabase Setup
1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase_schema.sql` and run it to create the tables and policies.
4. Get your **Project URL** and **anon public key** from **Project Settings > API**.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your SUPABASE_URL and SUPABASE_ANON_KEY
npm start
```
Server runs on `http://localhost:5000`.
*Note: On first run, the server will seed the database with Indian foods.*

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```
Frontend runs on `http://localhost:5173`.

## Indian Food Database
The system comes pre-seeded with a comprehensive list of North and South Indian foods (Butter Chicken, Dosa, Idli, etc.) with accurate nutritional values.

## API Documentation
See `architecture.md` for detailed API and Schema documentation.
# GYMFREAK
