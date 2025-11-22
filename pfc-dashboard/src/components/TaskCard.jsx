import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from '../utils/dateHelpers';

export default function TaskCard({ task, onComplete, compact = false }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isUrgent = task.dueDate &&
    new Date(task.dueDate) - new Date() < 2 * 60 * 60 * 1000 &&
    task.status !== 'completed';

  const handleComplete = () => {
    if (task.status !== 'completed' && onComplete) {
      onComplete(task.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${
      isOverdue ? 'border-red-300' : isUrgent ? 'border-orange-300' : 'border-gray-200'
    } p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
            {isOverdue && (
              <span className="inline-flex items-center text-xs text-red-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Overdue
              </span>
            )}
          </div>

          {!compact && (
            <>
              <p className="text-sm text-gray-600 mb-2">{task.department} Department</p>

              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Due {formatDistanceToNow(task.dueDate)}
                </div>
                {task.assignedTo && (
                  <div>
                    Assigned to: {task.assignedTo}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <StatusBadge status={task.status} />
            {task.completedAt && (
              <span className="text-xs text-gray-500">
                Completed {formatDistanceToNow(task.completedAt)}
              </span>
            )}
          </div>
        </div>

        {task.status !== 'completed' && (
          <button
            onClick={handleComplete}
            className="ml-4 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Mark as complete"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
