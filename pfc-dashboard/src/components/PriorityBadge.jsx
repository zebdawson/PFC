import { AlertCircle, AlertTriangle, Circle, MinusCircle } from 'lucide-react';

export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    urgent: {
      label: 'Urgent',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    high: {
      label: 'High',
      icon: AlertTriangle,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    medium: {
      label: 'Medium',
      icon: MinusCircle,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    low: {
      label: 'Low',
      icon: Circle,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}
