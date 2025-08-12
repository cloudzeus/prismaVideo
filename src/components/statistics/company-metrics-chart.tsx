'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, Calendar, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface CompanyMetricsData {
  companyId: string;
  companyName: string;
  companyType: string;
  totalUsers: number;
  totalMeetings: number;
  totalDuration: number;
  averageMeetingDuration: number;
  userEngagementRate: number;
  meetingCompletionRate: number;
  growthRate: number;
}

interface CompanyMetricsChartProps {
  data: CompanyMetricsData[];
}

export function CompanyMetricsChart({ data }: CompanyMetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Performance
          </CardTitle>
          <CardDescription>No company metrics data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getPerformanceScore = (company: CompanyMetricsData) => {
    const engagementScore = company.userEngagementRate * 0.3;
    const completionScore = company.meetingCompletionRate * 0.3;
    const growthScore = Math.min(company.growthRate / 100, 1) * 0.4;
    return engagementScore + completionScore + growthScore;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 0.6) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 0.4) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getCompanyTypeBadge = (type: string) => {
    return type === 'client' ? 'default' : 'secondary';
  };

  // Sort by performance score
  const sortedData = [...data].sort((a, b) => getPerformanceScore(b) - getPerformanceScore(a));

  // Calculate averages
  const avgEngagement = data.reduce((sum, c) => sum + c.userEngagementRate, 0) / data.length;
  const avgCompletion = data.reduce((sum, c) => sum + c.meetingCompletionRate, 0) / data.length;
  const avgGrowth = data.reduce((sum, c) => sum + c.growthRate, 0) / data.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Company Performance</h3>
          <p className="text-sm text-muted-foreground">
            Performance metrics across all companies
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>{data.length} companies</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Engagement</span>
            </div>
            <div className="text-2xl font-bold mt-2">{formatPercentage(avgEngagement)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {data.length} companies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Avg Completion</span>
            </div>
            <div className="text-2xl font-bold mt-2">{formatPercentage(avgCompletion)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Meeting completion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Growth</span>
            </div>
            <div className="text-2xl font-bold mt-2">{Math.round(avgGrowth)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Monthly growth rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Performance Table */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Company Rankings</h4>
        
        <div className="space-y-3">
          {sortedData.map((company, index) => {
            const performanceScore = getPerformanceScore(company);
            const performanceLevel = getPerformanceLevel(performanceScore);
            
            return (
              <Card key={company.companyId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Company Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium truncate">{company.companyName}</h5>
                          <Badge variant={getCompanyTypeBadge(company.companyType)} className="text-xs">
                            {company.companyType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{company.totalUsers} users</span>
                          <span>•</span>
                          <span>{company.totalMeetings} meetings</span>
                          <span>•</span>
                          <span>{formatDuration(company.totalDuration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{formatPercentage(company.userEngagementRate)}</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{formatPercentage(company.meetingCompletionRate)}</div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{company.growthRate}%</div>
                        <div className="text-xs text-muted-foreground">Growth</div>
                      </div>

                      <div className="text-center">
                        <div className={`font-medium ${performanceLevel.color}`}>
                          {performanceLevel.level}
                        </div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Performance Score</span>
                      <span>{Math.round(performanceScore * 100)}%</span>
                    </div>
                    <Progress value={performanceScore * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Excellent', 'Good', 'Average', 'Needs Improvement'].map((level) => {
                const count = sortedData.filter(company => {
                  const score = getPerformanceScore(company);
                  const perfLevel = getPerformanceLevel(score);
                  return perfLevel.level === level;
                }).length;
                
                const percentage = (count / data.length) * 100;
                
                return (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm">{level}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedData.slice(0, 5).map((company) => (
                <div key={company.companyId} className="flex items-center justify-between">
                  <span className="text-sm truncate">{company.companyName}</span>
                  <div className="flex items-center gap-1">
                    {company.growthRate > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      company.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {company.growthRate > 0 ? '+' : ''}{company.growthRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 