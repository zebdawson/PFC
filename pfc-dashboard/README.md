# PFC Ticketing Dashboard

Modern, professional dashboard for the PFC Ticketing System. Built with React, Vite, and Tailwind CSS.

## Features

✅ **Admin Dashboard** - Executive view of all tickets with filters and search
✅ **Department Dashboards** - Role-based views for each department (Staffing, Logistics, Finance, Scheduling, ESOC)
✅ **AI-Powered Insights** - Display Claude AI analysis and recommendations
✅ **Task Management** - Mark tasks complete, track progress
✅ **Real-time Stats** - Key metrics and KPIs at a glance
✅ **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router 6** - Client-side routing
- **Lucide React** - Modern icon library
- **Axios** - HTTP client

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Dashboard available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
pfc-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route pages
│   ├── services/            # API client with mock data
│   ├── utils/               # Helper functions
│   └── App.jsx              # Main app with routing
├── public/                  # Static assets
└── package.json
```

## Available Routes

- `/admin` - Executive dashboard (all tickets)
- `/departments` - Department selector
- `/department/:id` - Individual department dashboard
- `/ticket/:id` - Ticket detail view

## Demo Mode

Includes mock data for demonstration. Connect to real backend by setting `VITE_API_URL` in `.env`

## Key Features

### 1. Executive Dashboard
- Stats overview
- Pipeline value tracking
- Smart filters
- Ticket cards with progress

### 2. Department Dashboards
- Department-specific tasks
- Stats by status
- One-click task completion
- Overdue alerts

### 3. Ticket Detail View
- AI analysis panel
- Contact information
- Task breakdown
- Progress tracking

## ROI Demo Points

1. ⏱️ **Time Savings**: Automatic routing cuts intake time 15 min → 30 sec
2. 💰 **Revenue Impact**: Pipeline value visible at a glance
3. 🎯 **Task Efficiency**: Clear department task views
4. 🤖 **AI Intelligence**: Claude auto-analyzes and routes
5. 📊 **Executive Visibility**: Single dashboard for all activity
