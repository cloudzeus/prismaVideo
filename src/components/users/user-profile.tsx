'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserForm } from '@/components/forms/user-form';
import { updateUser } from '@/lib/actions/users';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Edit, 
  Mail, 
  Phone, 
  Building, 
  Shield,
  Clock,
  Users,
  Video,
  MapPin,
  CalendarDays,
  TrendingUp
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  currentUser: any;
  meetings: any[];
  departments: any[];
}

interface Company {
  id: string
  name: string
  default: boolean
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
})

export function UserProfile({ user, currentUser, meetings, departments }: UserProfileProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCompany, setDefaultCompany] = useState<Company | null>(null)

  // Fetch current default company
  useEffect(() => {
    const fetchDefaultCompany = async () => {
      try {
        const response = await fetch('/api/settings/default-company', {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setDefaultCompany(data.defaultCompany)
        }
      } catch (error) {
        console.error('Error fetching default company:', error)
      }
    }

    fetchDefaultCompany()
  }, [])

  const canEditProfile = 
    currentUser.id === user.id || 
    currentUser.role === 'Administrator' || 
    (currentUser.role === 'Manager' && user.role !== 'Administrator');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <Badge variant="destructive">Administrator</Badge>;
      case 'Manager':
        return <Badge variant="default">Manager</Badge>;
      case 'Employee':
        return <Badge variant="secondary">Employee</Badge>;
      case 'Contact':
        return <Badge variant="outline">Contact</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const calculateStats = () => {
    if (!meetings || !Array.isArray(meetings)) {
      return {
        totalMeetings: 0,
        hostedMeetings: 0,
        attendedMeetings: 0,
        upcomingMeetings: 0,
      };
    }

    const totalMeetings = meetings.length;
    const hostedMeetings = meetings.filter(m => m.createdById === user.id).length;
    const attendedMeetings = meetings.filter(m => 
      m.participants && Array.isArray(m.participants) && 
      m.participants.some((p: any) => p.userId === user.id)
    ).length;
    const upcomingMeetings = meetings.filter(m => {
      try {
        return new Date(m.startTime) > new Date() && m.status === 'scheduled';
      } catch (error) {
        return false;
      }
    }).length;
    
    return {
      totalMeetings,
      hostedMeetings,
      attendedMeetings,
      upcomingMeetings,
    };
  };

  const stats = calculateStats();

  const handleEditProfile = async (data: any) => {
    setIsLoading(true);
    try {
      // Convert the data to FormData for the API call
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      
      await updateUser(user.id, formData);
      setIsEditModalOpen(false);
      router.refresh();
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Safely get meeting data
  const getMeetingData = () => {
    if (!meetings || !Array.isArray(meetings)) {
      return [];
    }
    
    return meetings.map(meeting => ({
      id: meeting.id || `meeting-${Math.random()}`,
      title: meeting.title || 'Untitled Meeting',
      startTime: meeting.startTime || new Date().toISOString(),
      endTime: meeting.endTime || null,
      status: meeting.status || 'unknown',
      type: meeting.type || 'general',
      createdById: meeting.createdById || null,
      participants: meeting.participants || [],
      _count: meeting._count || { participants: 0 }
    }));
  };

  const safeMeetings = getMeetingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getRoleBadge(user.role)}
              {getStatusBadge(user.isActive)}
            </div>
          </div>
        </div>
        
        {canEditProfile && (
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <UserForm
                initialData={user}
                departments={departments}
                onSubmit={handleEditProfile}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              All time participation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hosted Meetings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hostedMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Meetings created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attended Meetings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendedMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Meetings joined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled meetings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="text-sm flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {defaultCompany?.name || user.companyName || 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {user.departmentName || 'No department'}
                    </p>
                  </div>
                </div>
                
                {user.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <p className="text-sm mt-1">{user.bio}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <p className="text-sm">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {safeMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(meeting.startTime)} at {formatTime(meeting.startTime)}
                          </p>
                        </div>
                        <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
                          {meeting.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Meeting Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                localizer={localizer}
                events={safeMeetings.map(meeting => ({
                  id: meeting.id,
                  title: meeting.title,
                  start: new Date(meeting.startTime),
                  end: meeting.endTime ? new Date(meeting.endTime) : new Date(new Date(meeting.startTime).getTime() + 30 * 60000),
                  resource: meeting,
                }))}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: 500 }}
                views={['month', 'week', 'day']}
                defaultView="month"
                selectable
                onSelectEvent={(event) => {
                  // Handle event selection
                  console.log('Selected event:', event);
                }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.resource.createdById === user.id ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: 'white',
                    borderRadius: '4px',
                  }
                })}
              />
              
              {safeMeetings.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Upcoming Meetings</h4>
                  <div className="space-y-2">
                    {safeMeetings
                      .filter(meeting => {
                        try {
                          return new Date(meeting.startTime) > new Date();
                        } catch (error) {
                          return false;
                        }
                      })
                      .slice(0, 5)
                      .map((meeting, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(meeting.startTime)} at {formatTime(meeting.startTime)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{meeting.type}</Badge>
                            {meeting.createdById === user.id && <Badge variant="secondary">Host</Badge>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Meeting History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safeMeetings.length > 0 ? (
                <div className="space-y-4">
                  {safeMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{meeting.title}</h4>
                          {meeting.createdById === user.id && (
                            <Badge variant="secondary">Host</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(meeting.startTime)} • {formatTime(meeting.startTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meeting._count.participants} participants
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{meeting.type}</Badge>
                        <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
                          {meeting.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No meetings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Meeting Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Meetings</span>
                    <span className="font-medium">{stats.totalMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hosted Meetings</span>
                    <span className="font-medium">{stats.hostedMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Attended Meetings</span>
                    <span className="font-medium">{stats.attendedMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Upcoming Meetings</span>
                    <span className="font-medium">{stats.upcomingMeetings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Meeting Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const typeStats = safeMeetings.reduce((acc, meeting) => {
                    acc[meeting.type] = (acc[meeting.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <div className="space-y-3">
                      {Object.entries(typeStats).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{type}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 