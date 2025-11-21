# PFC System - Project Structure & Code Examples

## Repository Structure

```
pfc-ticketing-system/
├── README.md
├── .env.example
├── .gitignore
├── package.json
│
├── backend/                          # API Server
│   ├── src/
│   │   ├── index.js                 # Server entry point
│   │   ├── config/
│   │   │   ├── database.js          # DB connection
│   │   │   ├── email.js             # SendGrid config
│   │   │   └── ai.js                # Claude API config
│   │   │
│   │   ├── models/                  # Database models
│   │   │   ├── User.js
│   │   │   ├── Ticket.js
│   │   │   ├── Task.js
│   │   │   ├── Client.js
│   │   │   └── Activity.js
│   │   │
│   │   ├── routes/                  # API endpoints
│   │   │   ├── auth.js              # Login, logout
│   │   │   ├── tickets.js           # CRUD for tickets
│   │   │   ├── tasks.js             # CRUD for tasks
│   │   │   ├── users.js             # User management
│   │   │   └── webhooks.js          # Email/external webhooks
│   │   │
│   │   ├── services/                # Business logic
│   │   │   ├── aiService.js         # Claude AI integration
│   │   │   ├── emailService.js      # Email sending/parsing
│   │   │   ├── notificationService.js
│   │   │   ├── ticketService.js
│   │   │   └── taskService.js
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── validate.js          # Input validation
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── jobs/                    # Background jobs
│   │   │   ├── checkOverdueTasks.js
│   │   │   ├── sendDigests.js
│   │   │   └── cleanupOldData.js
│   │   │
│   │   └── utils/                   # Helper functions
│   │       ├── logger.js
│   │       ├── validators.js
│   │       └── formatters.js
│   │
│   ├── prisma/                      # Database schema (if using Prisma)
│   │   └── schema.prisma
│   │
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── frontend/                        # Client Application
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── App.jsx                  # Main app component
│   │   ├── index.jsx                # Entry point
│   │   │
│   │   ├── pages/                   # Route pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TicketList.jsx
│   │   │   ├── TicketDetail.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── UserManagement.jsx
│   │   │
│   │   ├── components/              # Reusable components
│   │   │   ├── TicketCard.jsx
│   │   │   ├── TaskItem.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PriorityIndicator.jsx
│   │   │   ├── ActivityFeed.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── UserAvatar.jsx
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useTickets.js
│   │   │   ├── useTasks.js
│   │   │   ├── useAuth.js
│   │   │   └── useNotifications.js
│   │   │
│   │   ├── services/                # API calls
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── ticketAPI.js
│   │   │   ├── taskAPI.js
│   │   │   └── authAPI.js
│   │   │
│   │   ├── context/                 # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── styles/                  # CSS/Tailwind
│   │   │   └── globals.css
│   │   │
│   │   └── utils/
│   │       ├── formatDate.js
│   │       └── constants.js
│   │
│   └── package.json
│
├── ai-service/                      # Separate AI microservice (optional)
│   ├── index.js
│   ├── analyzeTicket.js
│   ├── prompts/
│   │   └── ticketAnalysis.js
│   └── package.json
│
└── docs/                            # Documentation
    ├── API.md                       # API documentation
    ├── DEPLOYMENT.md                # Deployment guide
    └── USER_GUIDE.md                # End-user guide
```

---

## Sample Code Examples

### 1. Backend - Ticket Model (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(TEAM_MEMBER)
  department String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  assignedTickets Ticket[] @relation("AssignedTickets")
  assignedTasks   Task[]   @relation("AssignedTasks")
  activities      Activity[]
}

enum Role {
  ADMIN
  MANAGER
  TEAM_MEMBER
}

model Client {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  phone     String?
  company   String?
  createdAt DateTime @default(now())

  tickets Ticket[]
}

model Ticket {
  id           String   @id @default(uuid())
  ticketNumber String   @unique
  clientId     String
  assignedToId String?
  subject      String
  description  String
  status       TicketStatus @default(NEW)
  priority     Priority     @default(MEDIUM)
  source       IntakeSource @default(EMAIL)
  aiAnalysis   Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  closedAt     DateTime?

  client     Client   @relation(fields: [clientId], references: [id])
  assignedTo User?    @relation("AssignedTickets", fields: [assignedToId], references: [id])
  tasks      Task[]
  activities Activity[]
}

enum TicketStatus {
  NEW
  IN_PROGRESS
  PENDING_CLIENT
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum IntakeSource {
  EMAIL
  PHONE
  WEB_FORM
  SMS
}

model Task {
  id           String   @id @default(uuid())
  ticketId     String
  department   String
  assignedToId String?
  description  String
  status       TaskStatus @default(PENDING)
  priority     Priority   @default(MEDIUM)
  dueDate      DateTime?
  completedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ticket     Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  assignedTo User?  @relation("AssignedTasks", fields: [assignedToId], references: [id])
  activities Activity[]
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

model Activity {
  id        String   @id @default(uuid())
  ticketId  String?
  taskId    String?
  userId    String?
  action    String
  details   Json?
  createdAt DateTime @default(now())

  ticket Ticket? @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  task   Task?   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user   User?   @relation(fields: [userId], references: [id])
}
```

---

### 2. Backend - AI Service

```javascript
// backend/src/services/aiService.js

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class AIService {
  async analyzeTicket(ticketData) {
    try {
      const prompt = this.constructAnalysisPrompt(ticketData);

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      });

      // Extract JSON from response
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('AI did not return valid JSON');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return this.validateAnalysis(analysis);

    } catch (error) {
      console.error('AI Analysis Error:', error);
      // Return default analysis on failure
      return this.getDefaultAnalysis();
    }
  }

  constructAnalysisPrompt(ticketData) {
    return `
You are an intelligent job request analyzer for PFC, a staffing and logistics company.

Analyze the following job request and determine:
1. Which departments need to be involved (Staffing, Logistics, Finance, Scheduling)
2. What specific requirements each department needs to handle
3. Priority level (low, medium, high, urgent)
4. Estimated number of staff needed (if applicable)

Job Request:
- Client: ${ticketData.clientName}
- Subject: ${ticketData.subject}
- Description: ${ticketData.description}
${ticketData.requestedDate ? `- Requested Date: ${ticketData.requestedDate}` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "departments": {
    "staffing": {
      "required": true or false,
      "details": "specific requirements",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedStaffCount": number or null
    },
    "logistics": {
      "required": true or false,
      "details": "specific requirements",
      "priority": "low" | "medium" | "high" | "urgent"
    },
    "finance": {
      "required": true or false,
      "details": "specific requirements",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedBudget": number or null
    },
    "scheduling": {
      "required": true or false,
      "details": "specific requirements",
      "priority": "low" | "medium" | "high" | "urgent"
    }
  },
  "overallPriority": "low" | "medium" | "high" | "urgent",
  "summary": "brief summary of the request",
  "flags": ["any special considerations or warnings"]
}
`;
  }

  validateAnalysis(analysis) {
    // Ensure required fields exist
    if (!analysis.departments || !analysis.overallPriority) {
      throw new Error('Invalid analysis structure');
    }

    // Ensure all departments have required fields
    const requiredDepts = ['staffing', 'logistics', 'finance', 'scheduling'];
    for (const dept of requiredDepts) {
      if (!analysis.departments[dept]) {
        analysis.departments[dept] = {
          required: false,
          details: '',
          priority: 'medium'
        };
      }
    }

    return analysis;
  }

  getDefaultAnalysis() {
    // Fallback when AI fails
    return {
      departments: {
        staffing: { required: true, details: 'Review manually', priority: 'medium' },
        logistics: { required: false, details: '', priority: 'medium' },
        finance: { required: true, details: 'Review manually', priority: 'medium' },
        scheduling: { required: true, details: 'Review manually', priority: 'medium' }
      },
      overallPriority: 'medium',
      summary: 'Manual review required',
      flags: ['AI analysis failed - manual review needed']
    };
  }
}

module.exports = new AIService();
```

---

### 3. Backend - Ticket Routes

```javascript
// backend/src/routes/tickets.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedToId = assignedTo;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        assignedTo: true,
        tasks: {
          include: { assignedTo: true }
        },
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ticket (usually from email webhook)
router.post('/', authenticate, async (req, res) => {
  try {
    const { clientEmail, clientName, subject, description, source = 'EMAIL' } = req.body;

    // Find or create client
    let client = await prisma.client.findUnique({
      where: { email: clientEmail }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          email: clientEmail,
          name: clientName || clientEmail.split('@')[0]
        }
      });
    }

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        clientId: client.id,
        subject,
        description,
        status: 'NEW',
        source
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        ticketId: ticket.id,
        action: 'TICKET_CREATED',
        details: { source }
      }
    });

    // Send confirmation email to client
    await emailService.sendConfirmation(client.email, ticketNumber);

    // Trigger AI analysis in background
    analyzeTicketAsync(ticket.id);

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedToId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        updatedAt: new Date()
      },
      include: {
        client: true,
        assignedTo: true,
        tasks: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        ticketId: ticket.id,
        userId: req.user.id,
        action: 'TICKET_UPDATED',
        details: { status, priority, assignedToId }
      }
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate unique ticket number
async function generateTicketNumber() {
  const prefix = 'PFC';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Get count of tickets this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = await prisma.ticket.count({
    where: { createdAt: { gte: startOfMonth } }
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${sequence}`;
}

// Helper: Analyze ticket asynchronously
async function analyzeTicketAsync(ticketId) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { client: true }
    });

    const analysis = await aiService.analyzeTicket({
      clientName: ticket.client.name,
      subject: ticket.subject,
      description: ticket.description
    });

    // Update ticket with AI analysis
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        aiAnalysis: analysis,
        priority: analysis.overallPriority.toUpperCase()
      }
    });

    // Create tasks for required departments
    const taskPromises = [];
    for (const [dept, config] of Object.entries(analysis.departments)) {
      if (config.required) {
        taskPromises.push(
          prisma.task.create({
            data: {
              ticketId,
              department: dept,
              description: config.details,
              priority: config.priority.toUpperCase(),
              status: 'PENDING'
            }
          })
        );
      }
    }

    await Promise.all(taskPromises);

    // Log activity
    await prisma.activity.create({
      data: {
        ticketId,
        action: 'AI_ANALYSIS_COMPLETED',
        details: analysis
      }
    });

  } catch (error) {
    console.error('AI Analysis failed for ticket:', ticketId, error);
  }
}

module.exports = router;
```

---

### 4. Frontend - Ticket List Component

```jsx
// frontend/src/pages/TicketList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import StatusBadge from '../components/StatusBadge';
import PriorityIndicator from '../components/PriorityIndicator';

export default function TicketList() {
  const { tickets, loading, error, fetchTickets } = useTickets();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  useEffect(() => {
    fetchTickets(filters);
  }, [filters]);

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <Link
          to="/tickets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ticket #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tasks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {ticket.ticketNumber}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{ticket.client.name}</div>
                    <div className="text-sm text-gray-500">{ticket.client.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate">{ticket.subject}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityIndicator priority={ticket.priority} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {ticket.tasks.filter(t => t.status === 'COMPLETED').length} /
                  {ticket.tasks.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 5. Frontend - Custom Hook for Tickets

```javascript
// frontend/src/hooks/useTickets.js

import { useState, useCallback } from 'react';
import ticketAPI from '../services/ticketAPI';

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketAPI.getAll(filters);
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = async (ticketData) => {
    setLoading(true);
    setError(null);
    try {
      const newTicket = await ticketAPI.create(ticketData);
      setTickets([newTicket, ...tickets]);
      return newTicket;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTicket = await ticketAPI.update(id, updates);
      setTickets(tickets.map(t => t.id === id ? updatedTicket : t));
      return updatedTicket;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket,
    updateTicket
  };
}
```

---

### 6. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pfc_ticketing"

# API
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=notifications@pfc.com

# Twilio (for SMS/Phone)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis (for job queue)
REDIS_URL=redis://localhost:6379
```

---

### 7. Package.json Files

```json
// backend/package.json
{
  "name": "pfc-ticketing-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.17.0",
    "@prisma/client": "^5.9.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@sendgrid/mail": "^8.1.0",
    "bull": "^4.11.5",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "prisma": "^5.9.0"
  }
}
```

```json
// frontend/package.json
{
  "name": "pfc-ticketing-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "axios": "^1.6.5",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

---

This structure provides a solid foundation for the PFC ticketing system with clear separation of concerns and scalability built in.
