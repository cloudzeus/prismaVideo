'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Play, Calendar, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Recording {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  bunnyCdnUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  callTitle: string;
  companyName: string;
}

export function RecordingsContent() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recordings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      const data = await response.json();
      if (data.success) {
        setRecordings(data.recordings);
      } else {
        throw new Error(data.error || 'Failed to fetch recordings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-[250px] animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-[200px] animate-pulse" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-[100px] animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRecordings} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No recordings found</h3>
            <p className="text-muted-foreground">
              Recordings will appear here once meetings are recorded.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <Card key={recording.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{recording.title}</h3>
                    {recording.description && (
                      <p className="text-muted-foreground text-sm">
                        {recording.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Meeting: {recording.callTitle}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(recording.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {recording.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                    )}
                    {recording.fileSize && (
                      <span>{formatFileSize(recording.fileSize)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Badge className={getStatusColor(recording.status)}>
                  {recording.status}
                </Badge>
                
                {recording.bunnyCdnUrl && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(recording.bunnyCdnUrl!, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(recording.bunnyCdnUrl!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
