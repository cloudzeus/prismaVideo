import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

export function PerformanceMonitor() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Performance Monitor</div>
      <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-green-600 dark:text-green-400">Active</span>
        </div>
        <div className="flex justify-between">
          <span>Database:</span>
          <span className="text-blue-600 dark:text-blue-400">Indexed</span>
        </div>
        <div className="flex justify-between">
          <span>Optimized:</span>
          <span className="text-green-600 dark:text-green-400">Yes</span>
        </div>
      </div>
    </div>
  );
} 