import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TaskCard from '../components/TaskCard';
import { formatDate, formatDistanceToNow } from '../utils/dateHelpers';
import { mockData } from '../services/api';

export default function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      // In production, this would call the API
      // const data = await ghlAPI.getOpportunity(ticketId);

      // For now, use mock data
      const foundTicket = mockData.tickets.find(t => t.id === ticketId);
      setTicket(foundTicket);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = (taskId) => {
    setTicket({
      ...ticket,
      tasks: ticket.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed', completedAt: new Date() }
          : task
      ),
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600">Ticket not found</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Go back to dashboard
        </button>
      </div>
    );
  }

  const completedTasks = ticket.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = ticket.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-sm font-mono text-gray-500">{ticket.ticketNumber}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Created {formatDistanceToNow(ticket.createdAt)}
              </div>
              {ticket.dueDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due {formatDistanceToNow(ticket.dueDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg mr-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
                <p className="text-sm text-gray-600">Claude AI insights and recommendations</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-sm text-gray-700">{ticket.aiAnalysis?.summary}</p>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Requirements</h3>
                <ul className="space-y-1">
                  {ticket.aiAnalysis?.requirements?.map((req, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Estimated Value</p>
                  <p className="text-lg font-bold text-green-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {ticket.aiAnalysis?.estimatedValue}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Risk Level</p>
                  <p className={`text-lg font-bold flex items-center ${
                    ticket.aiAnalysis?.riskLevel === 'high' ? 'text-red-600' :
                    ticket.aiAnalysis?.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {ticket.aiAnalysis?.riskLevel?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Department Tasks</h2>
            </div>

            <div className="space-y-3">
              {ticket.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onComplete={handleCompleteTask} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Contact & Details */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.contact?.name}</p>
                </div>
              </div>

              {ticket.contact?.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a
                      href={`mailto:${ticket.contact.email}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {ticket.contact.email}
                    </a>
                  </div>
                </div>
              )}

              {ticket.contact?.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a
                      href={`tel:${ticket.contact.phone}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {ticket.contact.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Departments Involved */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Departments Involved</h2>

            <div className="space-y-2">
              {ticket.departments?.map((dept) => (
                <div
                  key={dept}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">{dept}</span>
                  <span className="text-xs text-gray-600">
                    {ticket.tasks.filter(t => t.department === dept && t.status === 'completed').length}/
                    {ticket.tasks.filter(t => t.department === dept).length} tasks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>

            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5 mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Ticket Created</p>
                  <p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              {ticket.dueDate && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-600 mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Due Date</p>
                    <p className="text-xs text-gray-500">{formatDate(ticket.dueDate)}</p>
                  </div>
                </div>
              )}

              {ticket.tasks.filter(t => t.completedAt).map((task) => (
                <div key={task.id} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600 mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(task.completedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
