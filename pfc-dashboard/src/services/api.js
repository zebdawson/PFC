import axios from 'axios';

// API base URL - will be from environment variable in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// GHL API wrapper functions
export const ghlAPI = {
  // Get all opportunities (tickets) from GHL
  getOpportunities: async (pipelineId, stageId = null) => {
    try {
      const params = new URLSearchParams({ pipelineId });
      if (stageId) params.append('stageId', stageId);

      const response = await api.get(`/api/opportunities?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  },

  // Get single opportunity details
  getOpportunity: async (opportunityId) => {
    try {
      const response = await api.get(`/api/opportunities/${opportunityId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      throw error;
    }
  },

  // Get tasks for a specific user (department)
  getTasks: async (userId) => {
    try {
      const response = await api.get(`/api/tasks?assignedTo=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get all tasks for all departments (admin view)
  getAllTasks: async () => {
    try {
      const response = await api.get('/api/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw error;
    }
  },

  // Update task status
  updateTask: async (taskId, updates) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Complete a task
  completeTask: async (taskId) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, {
        completed: true,
        status: 'completed'
      });
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  // Get contact details
  getContact: async (contactId) => {
    try {
      const response = await api.get(`/api/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  },
};

// Mock data for demo (when backend is not available)
export const mockData = {
  tickets: [
    {
      id: 'opp_001',
      ticketNumber: 'PFC-241122-0001',
      name: 'Security Detail for Corporate Event',
      contact: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0123',
      },
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date('2024-11-22T08:00:00'),
      dueDate: new Date('2024-11-22T12:00:00'),
      departments: ['Staffing', 'Logistics', 'Finance'],
      aiAnalysis: {
        summary: 'Corporate event requiring 5 security guards, 2 supervisors, and transportation coordination.',
        requirements: [
          '5 security guards with Level 2 certification',
          '2 supervisors with management experience',
          'Transportation for team to downtown location',
          'Quote for 8-hour shift + overtime provision',
        ],
        estimatedValue: '$2,500',
        riskLevel: 'medium',
      },
      tasks: [
        {
          id: 'task_001',
          department: 'Staffing',
          title: 'Assign 5 guards and 2 supervisors',
          status: 'in_progress',
          assignedTo: 'Lisa Chen',
          dueDate: new Date('2024-11-22T10:00:00'),
        },
        {
          id: 'task_002',
          department: 'Logistics',
          title: 'Arrange transportation to venue',
          status: 'pending',
          assignedTo: 'Mike Johnson',
          dueDate: new Date('2024-11-22T10:00:00'),
        },
        {
          id: 'task_003',
          department: 'Finance',
          title: 'Generate quote and send to client',
          status: 'pending',
          assignedTo: 'Sarah Williams',
          dueDate: new Date('2024-11-22T10:00:00'),
        },
      ],
    },
    {
      id: 'opp_002',
      ticketNumber: 'PFC-241122-0002',
      name: 'Emergency Guard Coverage - Retail Store',
      contact: {
        name: 'Maria Garcia',
        email: 'maria.garcia@retailstore.com',
        phone: '+1-555-0124',
      },
      priority: 'urgent',
      status: 'new',
      createdAt: new Date('2024-11-22T09:15:00'),
      dueDate: new Date('2024-11-22T11:15:00'),
      departments: ['Staffing', 'Finance'],
      aiAnalysis: {
        summary: 'Urgent request for guard replacement - original guard called in sick.',
        requirements: [
          '1 certified guard available within 2 hours',
          'Retail experience preferred',
          'Rush quote needed',
        ],
        estimatedValue: '$350',
        riskLevel: 'low',
      },
      tasks: [
        {
          id: 'task_004',
          department: 'Staffing',
          title: 'Find immediate guard replacement',
          status: 'pending',
          assignedTo: 'Lisa Chen',
          dueDate: new Date('2024-11-22T10:15:00'),
        },
        {
          id: 'task_005',
          department: 'Finance',
          title: 'Process rush rate quote',
          status: 'pending',
          assignedTo: 'Sarah Williams',
          dueDate: new Date('2024-11-22T10:15:00'),
        },
      ],
    },
    {
      id: 'opp_003',
      ticketNumber: 'PFC-241122-0003',
      name: 'Monthly Contract Renewal - Office Building',
      contact: {
        name: 'David Lee',
        email: 'david.lee@officepark.com',
        phone: '+1-555-0125',
      },
      priority: 'medium',
      status: 'pending',
      createdAt: new Date('2024-11-22T07:30:00'),
      dueDate: new Date('2024-11-23T17:00:00'),
      departments: ['Finance', 'Scheduling'],
      aiAnalysis: {
        summary: 'Regular monthly contract renewal with existing client.',
        requirements: [
          'Review and update contract terms',
          'Schedule guards for next month',
          'Send renewal invoice',
        ],
        estimatedValue: '$12,000',
        riskLevel: 'low',
      },
      tasks: [
        {
          id: 'task_006',
          department: 'Finance',
          title: 'Prepare renewal contract and invoice',
          status: 'completed',
          assignedTo: 'Sarah Williams',
          dueDate: new Date('2024-11-22T17:00:00'),
          completedAt: new Date('2024-11-22T09:00:00'),
        },
        {
          id: 'task_007',
          department: 'Scheduling',
          title: 'Schedule guards for December',
          status: 'pending',
          assignedTo: 'Tom Rodriguez',
          dueDate: new Date('2024-11-23T17:00:00'),
        },
      ],
    },
  ],

  // Department user info
  departments: {
    staffing: {
      id: 'user_staffing',
      name: 'Lisa Chen',
      role: 'Staffing Manager',
      department: 'Staffing',
    },
    logistics: {
      id: 'user_logistics',
      name: 'Mike Johnson',
      role: 'Logistics Coordinator',
      department: 'Logistics',
    },
    finance: {
      id: 'user_finance',
      name: 'Sarah Williams',
      role: 'Finance Manager',
      department: 'Finance',
    },
    scheduling: {
      id: 'user_scheduling',
      name: 'Tom Rodriguez',
      role: 'Scheduling Coordinator',
      department: 'Scheduling',
    },
    esoc: {
      id: 'user_esoc',
      name: 'James Carter',
      role: 'Security Operations Manager',
      department: 'ESOC',
    },
  },
};

export default api;
