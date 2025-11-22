/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 hours")
 */
export function formatDistanceToNow(date) {
  if (!date) return 'N/A';

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((targetDate - now) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(absDiff / seconds);
    if (interval >= 1) {
      const suffix = interval === 1 ? '' : 's';
      if (diffInSeconds < 0) {
        return `${interval} ${unit}${suffix} ago`;
      } else {
        return `in ${interval} ${unit}${suffix}`;
      }
    }
  }

  return 'just now';
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return 'N/A';

  const targetDate = new Date(date);
  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date to time only
 */
export function formatTime(date) {
  if (!date) return 'N/A';

  const targetDate = new Date(date);
  return targetDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if date is overdue
 */
export function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Check if date is within next N hours
 */
export function isWithinHours(date, hours) {
  if (!date) return false;
  const targetDate = new Date(date);
  const now = new Date();
  const diff = targetDate - now;
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
}
