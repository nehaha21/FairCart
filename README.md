# FairCart - Exposing the Pink Tax in Real Time

FairCart is an AI-powered product comparison platform that **detects, scores, and exposes gendered price bias** in real time.

---

## Quick Start (2 terminals)

### Terminal 1 — Backend (Flask API)

```bash
cd backend
pip install flask flask-cors
python app.py
```
API runs at → **http://localhost:5000**

---

### Terminal 2 — Frontend (React)

```bash
cd frontend
npm install
npm start
```
App runs at → **http://localhost:3000**

---

## Project Structure

```
faircart/
├── backend/
│   ├── app.py              # Flask REST API
│   └── requirements.txt
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.js
│       │   ├── SearchBar.js
│       │   ├── BiasScoreBadge.js
│       │   └── ComparisonCard.js
│       ├── pages/
│       │   ├── HomePage.js
│       │   ├── SearchPage.js
│       │   ├── StatsPage.js
│       │   └── AboutPage.js
│       └── utils/
│           └── api.js
└── database/
    └── products.json       # 20 products across 6 categories
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/search?q=<query>` | Search & compare products |
| GET | `/api/stats` | Aggregated bias statistics |
| GET | `/api/products` | All products (filterable) |
| GET | `/api/categories` | All product categories |
| POST | `/api/report` | Report a biased product |

---

## Bias Score Formula

```
bias% = ((women_price - men_price) / men_price) × 100

Fair:     ≤ 3%   ✓ green
Moderate: 3–10%  ⚠ yellow  
High:     > 10%  ! red
```

---

## Key Features

- **Real-time bias detection** across 6 product categories
- **Transparent bias score** (Fair / Moderate / High) with % breakdown
- **Annual & lifetime cost impact** calculator
- **Interactive data dashboard** with charts
- **Product flagging system** for user reports
- **Quick suggestions** and smart keyword stripping

---

##Contributers 

Neha Rastogi
Nidhi S
Nikita Mankani
Madhuri Ravikumar


---

## Tech Stack

- **Frontend**: React.js, Recharts
- **Backend**: Flask (Python)
- **Database**: JSON (MongoDB-ready)
- **Core Logic**: Keyword stripping NLP, similarity matching, price comparison engine
