import { Link } from 'react-router-dom';
import { Clock, User, Briefcase, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { formatDistanceToNow } from '../utils/dateHelpers';

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/ticket/${ticket.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 mb-2">{ticket.name}</h3>

          {/* Contact Info */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <User className="w-4 h-4 mr-1" />
            <span>{ticket.contact?.name || 'Unknown'}</span>
            {ticket.contact?.phone && (
              <>
                <span className="mx-2">•</span>
                <span>{ticket.contact.phone}</span>
              </>
            )}
          </div>

          {/* Departments */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            {ticket.departments?.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
              >
                {dept}
              </span>
            ))}
          </div>

          {/* Time info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Created {formatDistanceToNow(ticket.createdAt)}
            </div>
            {ticket.dueDate && (
              <div>
                Due {formatDistanceToNow(ticket.dueDate)}
              </div>
            )}
          </div>

          {/* Task summary */}
          {ticket.tasks && ticket.tasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600">Tasks:</span>
                <span className="text-green-600 font-medium">
                  {ticket.tasks.filter(t => t.status === 'completed').length} completed
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">
                  {ticket.tasks.length} total
                </span>
              </div>
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
      </div>
    </Link>
  );
}
