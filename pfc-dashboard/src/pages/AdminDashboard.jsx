import { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import TicketCard from '../components/TicketCard';
import { mockData } from '../services/api';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // In production, this would call the API
      // const data = await ghlAPI.getOpportunities(pipelineId);

      // For now, use mock data
      setTickets(mockData.tickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.name.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.contact?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  // Calculate estimated value
  const totalValue = tickets.reduce((sum, ticket) => {
    const value = ticket.aiAnalysis?.estimatedValue
      ? parseFloat(ticket.aiAnalysis.estimatedValue.replace(/[$,]/g, ''))
      : 0;
    return sum + value;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">All tickets and job requests</p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Tickets</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.inProgress}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Urgent</p>
              <p className="text-3xl font-bold mt-1">{stats.urgent}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-100">Estimated Pipeline Value</p>
            <p className="text-4xl font-bold mt-2">${totalValue.toLocaleString()}</p>
            <p className="text-sm text-green-100 mt-1">Based on AI analysis of current tickets</p>
          </div>
          <TrendingUp className="w-12 h-12 text-green-200" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredTickets.length === tickets.length
              ? `All Tickets (${tickets.length})`
              : `Filtered Results (${filteredTickets.length} of ${tickets.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No tickets found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No tickets have been created yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
