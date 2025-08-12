"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EnhancedMultiSelect } from "@/components/ui/enhanced-multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Clock, Users, Video, FileText, MapPin, Mail, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const meetingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  type: z.enum(["VIDEO_CALL", "AUDIO_CALL", "SCREEN_SHARE", "PRESENTATION"]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  participants: z.array(z.string()).min(1, "At least one participant is required"),
  isPublic: z.boolean(),
  allowJoinBeforeHost: z.boolean(),
  recordMeeting: z.boolean(),
  location: z.string().optional(),
  agenda: z.string().max(2000, "Agenda must be less than 2000 characters").optional(),
  attachments: z.array(z.string()).optional(),
})

type MeetingFormValues = z.infer<typeof meetingFormSchema>

interface MeetingFormProps {
  initialData?: Partial<MeetingFormValues>
  participants?: Array<{ id: string; name: string; email: string }>
  onSubmit: (data: MeetingFormValues) => Promise<void>
  isLoading?: boolean
}

export function MeetingForm({ initialData, participants, onSubmit, isLoading = false }: MeetingFormProps) {
  const { toast } = useToast()

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startTime: initialData?.startTime || new Date(),
      endTime: initialData?.endTime || new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      type: initialData?.type || "VIDEO_CALL",
      status: initialData?.status || "SCHEDULED",
      participants: initialData?.participants || [],
      isPublic: initialData?.isPublic ?? false,
      allowJoinBeforeHost: initialData?.allowJoinBeforeHost ?? true,
      recordMeeting: initialData?.recordMeeting ?? false,
      location: initialData?.location || "",
      agenda: initialData?.agenda || "",
      attachments: initialData?.attachments || [],
    },
  })

  // Auto-update end time when start time changes
  const handleStartTimeChange = (date: Date) => {
    form.setValue("startTime", date);
    // Set end time to 30 minutes after start time
    const endTime = new Date(date.getTime() + 30 * 60 * 1000);
    form.setValue("endTime", endTime);
  };

  const handleSubmit = async (data: MeetingFormValues) => {
    try {
      // Validate that end time is after start time
      if (data.endTime <= data.startTime) {
        toast({
          title: "Invalid Time",
          description: "End time must be after start time.",
          variant: "destructive",
        })
        return
      }

      await onSubmit(data)
      toast({
        title: "Success",
        description: "Meeting saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save meeting.",
        variant: "destructive",
      })
    }
  }

  const participantOptions = participants?.map(p => ({
    label: `${p.name} (${p.email})`,
    value: p.id,
  })) || []

  console.log('🎯 MeetingForm participantOptions:', participantOptions);
  console.log('🎯 MeetingForm participants prop:', participants);
  console.log('🎯 MeetingForm form participants value:', form.watch("participants"));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {initialData ? "Edit Meeting" : "Schedule New Meeting"}
        </CardTitle>
        <CardDescription>
          {initialData ? "Update meeting details and settings" : "Create a new meeting with participants"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Details
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Team Standup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the meeting..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description for meeting context
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agenda</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Meeting agenda and topics to discuss..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed agenda for the meeting (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Date and Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Date & Time
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={handleStartTimeChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                            required
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={field.value ? field.value.getHours().toString() : "9"}
                          onValueChange={(hour) => {
                            const newDate = new Date(field.value || new Date());
                            newDate.setHours(parseInt(hour));
                            handleStartTimeChange(newDate);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={field.value ? field.value.getMinutes().toString() : "0"}
                          onValueChange={(minute) => {
                            const newDate = new Date(field.value || new Date());
                            newDate.setMinutes(parseInt(minute));
                            handleStartTimeChange(newDate);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={field.value ? field.value.getHours().toString() : "9"}
                          onValueChange={(hour) => {
                            const newDate = new Date(field.value || new Date());
                            newDate.setHours(parseInt(hour));
                            form.setValue("endTime", newDate);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={field.value ? field.value.getMinutes().toString() : "0"}
                          onValueChange={(minute) => {
                            const newDate = new Date(field.value || new Date());
                            newDate.setMinutes(parseInt(minute));
                            form.setValue("endTime", newDate);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration Display */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Duration: {(() => {
                    const start = form.watch("startTime");
                    const end = form.watch("endTime");
                    if (start && end) {
                      const diffMs = end.getTime() - start.getTime();
                      const diffMins = Math.round(diffMs / 60000);
                      return `${diffMins} minutes`;
                    }
                    return "0 minutes";
                  })()}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const start = form.watch("startTime");
                    if (start) {
                      const endTime = new Date(start.getTime() + 30 * 60 * 1000);
                      form.setValue("endTime", endTime);
                    }
                  }}
                >
                  +30 min
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const start = form.watch("startTime");
                    if (start) {
                      const endTime = new Date(start.getTime() + 60 * 60 * 1000);
                      form.setValue("endTime", endTime);
                    }
                  }}
                >
                  +1 hour
                </Button>
              </div>
            </div>

            <Separator />

            {/* Meeting Type and Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Meeting Type & Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <FormControl>
                        <Combobox
                          options={[
                            { value: "VIDEO_CALL", label: "Video Call" },
                            { value: "AUDIO_CALL", label: "Audio Call" },
                            { value: "SCREEN_SHARE", label: "Screen Share" },
                            { value: "PRESENTATION", label: "Presentation" }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select meeting type"
                          searchPlaceholder="Search meeting types..."
                          emptyMessage="No meeting types found"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Conference Room A or Zoom Link" {...field} />
                      </FormControl>
                      <FormDescription>
                        Physical location or virtual meeting link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Meeting</FormLabel>
                        <FormDescription>
                          Allow anyone with the link to join
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowJoinBeforeHost"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Join Before Host</FormLabel>
                        <FormDescription>
                          Participants can join before the host arrives
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recordMeeting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Record Meeting</FormLabel>
                        <FormDescription>
                          Automatically record the meeting for later review
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </h3>
              
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Participants</FormLabel>
                    <FormControl>
                      <EnhancedMultiSelect
                        options={participantOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Search by name, last name, or email..."
                        disabled={isLoading}
                        searchPlaceholder="Search participants..."
                      />
                    </FormControl>
                    <FormDescription>
                      Choose who should be invited to this meeting. Users are shown first, followed by contacts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selected Participants Display */}
              {form.watch("participants") && form.watch("participants").length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Selected Participants ({form.watch("participants").length})</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Send email to participants via server-side API
                        try {
                          const selectedParticipants = participants?.filter(p => form.watch("participants").includes(p.id)) || [];
                          const participantEmails = selectedParticipants.map(p => p.email);
                          
                          if (participantEmails.length > 0) {
                            const response = await fetch('/api/meetings/send-invitations', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                title: form.watch("title"),
                                description: form.watch("description"),
                                startTime: form.watch("startTime"),
                                endTime: form.watch("endTime"),
                                location: form.watch("location"),
                                agenda: form.watch("agenda"),
                                participantEmails,
                              }),
                            });
                            
                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Meeting invitations sent successfully!",
                              });
                            } else {
                              throw new Error('Failed to send invitations');
                            }
                          }
                        } catch (error) {
                          console.error('Error sending invitations:', error);
                          toast({
                            title: "Error",
                            description: "Failed to send meeting invitations",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {form.watch("participants").map((participantId) => {
                        const participant = participants?.find(p => p.id === participantId);
                        return participant ? (
                          <div key={participantId} className="flex items-center justify-between p-2 border rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              <p className="text-xs text-muted-foreground">{participant.email}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newParticipants = form.watch("participants").filter(id => id !== participantId);
                                form.setValue("participants", newParticipants);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialData ? "Update Meeting" : "Schedule Meeting"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 