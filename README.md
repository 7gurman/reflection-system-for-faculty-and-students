# 📚 Reflect — Student Learning Reflection System




## 📋 Project Overview

Reflect is a full-stack web application where students submit weekly/daily learning reflections describing what they studied, concepts understood, and challenges faced. Faculty mentors can review reflections, provide feedback, and monitor student progress.

---

## 🗂️ Rubric Coverage

| # | Criterion | Marks | How it's addressed |
|---|-----------|-------|--------------------|
| 2 | Hosting & Live Deployment | 15 | Deployed on **Render** (backend) + **Vercel** (frontend) — see Deployment section |
| 3 | Backend Architecture & API Design | 15 | Express.js REST API with 15+ endpoints, MVC structure, rate limiting, Helmet security |
| 4 | Database Design & Data Handling | 15 | MongoDB + Mongoose with proper schemas, indexes, population, and aggregation pipelines |
| 5 | Authentication & Basic Security | 10 | JWT auth, bcrypt password hashing, role-based access control (student/faculty), input validation |
| 6 | Presentation & Viva | 10 | Polished UI, live demo, all features working end-to-end |
| 7 | Documentation | 15 | This README + inline JSDoc-style comments throughout codebase |

---

## 🏗️ System Architecture

```
┌─────────────────┐        HTTPS         ┌──────────────────────┐
│  React Frontend  │ ──────────────────► │  Express.js Backend  │
│  (Vercel)        │ ◄────────────────── │  (Render.com)        │
└─────────────────┘     JSON REST API    └──────────┬───────────┘
                                                     │ Mongoose ODM
                                                     ▼
                                          ┌──────────────────────┐
                                          │  MongoDB Atlas       │
                                          │  (Cloud Database)    │
                                          └──────────────────────┘
```

---

## 📁 Project Structure

```
reflect-system/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT protect + role authorize
│   ├── models/
│   │   ├── User.js             # User schema (student/faculty)
│   │   └── Reflection.js       # Reflection + embedded feedback
│   ├── routes/
│   │   ├── auth.js             # Register, login, profile
│   │   ├── reflections.js      # Full CRUD + feedback
│   │   └── faculty.js          # Faculty-only routes
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   └── server.js               # Express app entry point
│
├── frontend/                   # React SPA
│   ├── public/
│   │   └── index.html          # Full working demo (standalone)
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useAuth.js      # Auth context + state
│   │   └── utils/
│   │       └── api.js          # Axios client + API helpers
│   └── package.json
│
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |

### Reflections
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/reflections` | Submit new reflection | Student |
| GET | `/api/reflections` | List reflections (filtered) | Private |
| GET | `/api/reflections/:id` | Get single reflection | Private |
| PUT | `/api/reflections/:id` | Edit reflection | Student (own) |
| DELETE | `/api/reflections/:id` | Delete reflection | Student (own) |
| POST | `/api/reflections/:id/feedback` | Add faculty feedback | Faculty |
| GET | `/api/reflections/stats/summary` | Dashboard stats | Private |

### Faculty
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/faculty/students` | All students + stats | Faculty |
| GET | `/api/faculty/queue` | Pending review queue | Faculty |
| GET | `/api/faculty/overview` | System-wide stats | Faculty |

---

## 🗃️ Database Design

### User Schema
```
User {
  name:               String (required)
  email:              String (unique, required)
  password:           String (hashed, bcrypt-12)
  role:               "student" | "faculty"
  registrationNumber: String
  courseCode:         String
  teamName:           String
  createdAt/updatedAt: Timestamps
}
```

### Reflection Schema
```
Reflection {
  student:            ObjectId → User
  subject:            String (required)
  weekNumber:         Number (1-52)
  periodType:         "daily" | "weekly"
  date:               Date
  studiedTopics:      String (required, max 3000)
  conceptsUnderstood: String (required, max 3000)
  challengesFaced:    String (optional, max 3000)
  nextSteps:          String (optional)
  mood:               "great" | "good" | "okay" | "struggling"
  tags:               [String]
  status:             "submitted" | "reviewed"
  feedback: [{
    faculty:          ObjectId → User
    text:             String (required)
    rating:           Number (1-5, optional)
    createdAt:        Timestamp
  }]
  createdAt/updatedAt: Timestamps
}

Indexes: { student, date }, { subject }, { status }
```

---

## 🔒 Authentication & Security

1. **Password Hashing** — `bcryptjs` with salt rounds of 12
2. **JWT Tokens** — Signed with secret, 7-day expiry
3. **Protected Routes** — `protect` middleware verifies token on every private route
4. **Role-Based Access** — `authorize('faculty')` / `authorize('student')` middleware
5. **Input Validation** — `express-validator` on all POST/PUT routes
6. **Rate Limiting** — 100 requests per 15 min per IP (`express-rate-limit`)
7. **Security Headers** — `helmet` sets X-Frame-Options, CSP, HSTS, etc.
8. **CORS** — Whitelisted frontend origin only
9. **Body Size Limit** — 10kb max to prevent payload attacks

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev          # Starts on http://localhost:5000
```

### Frontend Setup (React)
```bash
cd frontend
npm install
npm start            # Starts on http://localhost:3000
```

### Quick Demo (No installation)
Open `frontend/public/index.html` directly in a browser.  
Demo credentials: `student@demo.com` / `faculty@demo.com` — password: `demo123`

---

## 🌐 Deployment Guide

### Backend → Render.com (Free)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo, select `backend/` as root
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables (copy from `.env.example`):
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string
   - `CLIENT_URL` — your Vercel frontend URL
   - `NODE_ENV` — `production`

### Frontend → Vercel (Free)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo, select `frontend/` as root
3. Framework preset: Create React App
4. Add environment variable:
   - `REACT_APP_API_URL` — your Render backend URL + `/api`
5. Deploy

### Database → MongoDB Atlas (Free)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. Add database user and whitelist `0.0.0.0/0` for Render IP
4. Copy the connection string to `MONGO_URI`

---

## ✨ Features

### Student Features
- Register/login with JWT authentication
- Submit daily or weekly reflections with mood tracking
- Tag entries by topic for easy filtering
- View all personal reflections with status tracking
- Receive faculty feedback with ratings

### Faculty Features
- View all students with progress statistics
- Review queue showing oldest-first pending reflections
- Submit feedback with optional star rating (1-5)
- System-wide dashboard with subject breakdown analytics
- AI-powered reflection analysis (Anthropic API integration)

### Technical Features
- RESTful API with proper HTTP status codes
- MongoDB aggregation pipelines for statistics
- JWT auth with auto-refresh on frontend
- Input validation on all endpoints
- Role-based access control
- Rate limiting and security headers
- Error handling middleware
- Responsive design

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JS / React | UI |
| Backend | Node.js, Express.js | REST API |
| Database | MongoDB, Mongoose | Data storage |
| Auth | JWT, bcryptjs | Security |
| Validation | express-validator | Input safety |
| Security | helmet, express-rate-limit | HTTP security |
| Logging | morgan | Request logs |
| AI | Anthropic Claude API | Reflection insights |
| Deploy (BE) | Render.com | Backend hosting |
| Deploy (FE) | Vercel | Frontend hosting |
| DB Host | MongoDB Atlas | Cloud database |
