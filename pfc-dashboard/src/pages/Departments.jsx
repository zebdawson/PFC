import { Link } from 'react-router-dom';
import { Users, Truck, DollarSign, Calendar, Shield } from 'lucide-react';
import { mockData } from '../services/api';

export default function Departments() {
  const departments = [
    {
      id: 'staffing',
      name: 'Staffing',
      icon: Users,
      color: 'blue',
      description: 'Personnel assignment and guard scheduling',
      manager: mockData.departments.staffing,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'logistics',
      name: 'Logistics',
      icon: Truck,
      color: 'purple',
      description: 'Transportation and equipment coordination',
      manager: mockData.departments.logistics,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: DollarSign,
      color: 'green',
      description: 'Billing, quotes, and financial processing',
      manager: mockData.departments.finance,
      gradient: 'from-green-500 to-green-600',
    },
    {
      id: 'scheduling',
      name: 'Scheduling',
      icon: Calendar,
      color: 'orange',
      description: 'Calendar coordination and shift management',
      manager: mockData.departments.scheduling,
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      id: 'esoc',
      name: 'ESOC',
      icon: Shield,
      color: 'red',
      description: 'Security operations and threat assessment',
      manager: mockData.departments.esoc,
      gradient: 'from-red-500 to-red-600',
    },
  ];

  // Count tasks for each department
  const getTaskStats = (departmentName) => {
    const allTasks = mockData.tickets.flatMap(ticket =>
      ticket.tasks.filter(task => task.department === departmentName)
    );

    return {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-600 mt-1">Select a department to view their task dashboard</p>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const stats = getTaskStats(dept.name);

          return (
            <Link
              key={dept.id}
              to={`/department/${dept.id}`}
              className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${dept.gradient} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-lg">
                    <Icon className="w-7 h-7" />
                  </div>
                  {stats.pending > 0 && (
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                      {stats.pending} pending
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold">{dept.name}</h3>
                <p className="text-sm text-white text-opacity-90 mt-1">{dept.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Manager Info */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Manager</p>
                  <p className="text-sm font-medium text-gray-900">{dept.manager.name}</p>
                  <p className="text-xs text-gray-600">{dept.manager.role}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-gray-600">Done</p>
                  </div>
                </div>

                {/* View Dashboard Link */}
                <div className="mt-4 flex items-center justify-center text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  View Dashboard
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
        <div className="grid grid-cols-5 gap-4">
          {departments.map((dept) => {
            const stats = getTaskStats(dept.name);
            return (
              <div key={dept.id} className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">{dept.name}</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-12">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="w-12">
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-lg font-bold text-blue-600">{stats.pending + stats.inProgress}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
