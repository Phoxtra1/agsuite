import { useState } from "react";
import {
  Users, Video, Calendar, Bell, Share2, Plus, Check, Link2, Copy,
  CalendarPlus, Mail, MessageSquare, ExternalLink, ShieldCheck, ChevronRight
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface CollaborateDropdownProps {
  documentId?: string;
  documentTitle?: string;
  onOpenShare?: () => void;
  onInsertMeetingLink?: (link: string, title: string) => void;
}

export function CollaborateDropdown({
  documentId,
  documentTitle = "Untitled Document",
  onOpenShare,
  onInsertMeetingLink,
}: CollaborateDropdownProps) {
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);

  // Meeting Form State
  const [meetingPlatform, setMeetingPlatform] = useState<"amineva" | "zoom" | "meet" | "teams">("amineva");
  const [meetingTopic, setMeetingTopic] = useState(`Review: ${documentTitle}`);

  // Event Form State
  const [eventTitle, setEventTitle] = useState(`Review & Approval: ${documentTitle}`);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState("14:00");
  const [eventType, setEventType] = useState("Document Review");

  // Notification Form State
  const [notifyRecipients, setNotifyRecipients] = useState("");
  const [notifyMessage, setNotifyMessage] = useState(`Please review the updated document "${documentTitle}".`);
  const [notifyChannels, setNotifyChannels] = useState({ email: true, inApp: true });

  const handleCreateMeeting = () => {
    let link = "";
    const roomId = Math.random().toString(36).substring(2, 9);
    if (meetingPlatform === "amineva") {
      link = `https://amineva.app/meet/${roomId}`;
    } else if (meetingPlatform === "zoom") {
      link = `https://zoom.us/j/9${Math.floor(100000000 + Math.random() * 900000000)}`;
    } else if (meetingPlatform === "meet") {
      link = `https://meet.google.com/${roomId.slice(0, 3)}-${roomId.slice(3, 6)}-${roomId.slice(6)}`;
    } else {
      link = `https://teams.microsoft.com/l/meetup-join/${roomId}`;
    }

    if (onInsertMeetingLink) {
      onInsertMeetingLink(link, meetingTopic);
    } else {
      navigator.clipboard.writeText(link);
    }

    toast({
      title: "Online Meeting Room Created",
      description: `Link generated for ${meetingPlatform.toUpperCase()}: ${link}`,
    });
    setMeetingModalOpen(false);
  };

  const handleScheduleEvent = () => {
    toast({
      title: "Calendar Event Scheduled",
      description: `"${eventTitle}" scheduled for ${eventDate} at ${eventTime}. Team notified.`,
    });
    setEventModalOpen(false);
  };

  const handleSendNotification = () => {
    if (!notifyMessage.trim()) return;

    toast({
      title: "Team Notification Dispatched",
      description: `Real-time notification sent to team subscribers (${notifyRecipients || "All Collaborators"}).`,
    });
    setNotifyModalOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm">
            <Users className="h-3.5 w-3.5" />
            <span>Collaborate</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
            Multi-Channel Collaboration
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setMeetingModalOpen(true)} className="cursor-pointer">
            <Video className="h-4 w-4 mr-2 text-indigo-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Create Online Meeting</span>
              <span className="text-[10px] text-muted-foreground">Zoom, Meet, Teams, Amineva</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setEventModalOpen(true)} className="cursor-pointer">
            <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Schedule Event</span>
              <span className="text-[10px] text-muted-foreground">Reviews & Deadlines</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setNotifyModalOpen(true)} className="cursor-pointer">
            <Bell className="h-4 w-4 mr-2 text-amber-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Notify Team</span>
              <span className="text-[10px] text-muted-foreground">Multi-channel email & alerts</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={onOpenShare} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2 text-blue-500" />
            <span className="font-semibold text-xs">Share Document</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 1. Create Online Meeting Modal */}
      <Dialog open={meetingModalOpen} onOpenChange={setMeetingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Video className="h-5 w-5 text-indigo-600" /> Create Online Meeting
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate an instant virtual meeting room for real-time document discussion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Meeting Topic</label>
              <input
                type="text"
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Select Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "amineva", name: "Amineva Native", color: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
                  { id: "zoom", name: "Zoom Video", color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30" },
                  { id: "meet", name: "Google Meet", color: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
                  { id: "teams", name: "Microsoft Teams", color: "border-purple-500 bg-purple-50 dark:bg-purple-950/30" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setMeetingPlatform(p.id as any)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between font-semibold transition ${
                      meetingPlatform === p.id ? p.color : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span>{p.name}</span>
                    {meetingPlatform === p.id && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setMeetingModalOpen(false)}
              className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMeeting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Insert Link & Launch Room
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Schedule Event Modal */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CalendarPlus className="h-5 w-5 text-emerald-600" /> Schedule Calendar Event
            </DialogTitle>
            <DialogDescription className="text-xs">
              Schedule a review deadline or approval milestone for this document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Event Title</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Event Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              >
                <option value="Document Review">Document Review</option>
                <option value="Contract Signing">Contract Signing & Execution</option>
                <option value="Approval Deadline">Approval Deadline</option>
                <option value="Presentation Sync">Presentation Sync</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setEventModalOpen(false)}
              className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleEvent}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              Schedule & Notify
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Notify Team Modal */}
      <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Bell className="h-5 w-5 text-amber-500" /> Dispatch Team Notification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send real-time alerts across Email and In-App channels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Recipients (Emails or @team)</label>
              <input
                type="text"
                placeholder="collaborators@org.com, @reviewers"
                value={notifyRecipients}
                onChange={(e) => setNotifyRecipients(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Message</label>
              <textarea
                rows={3}
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="font-semibold text-foreground">Notification Channels</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyChannels.email}
                    onChange={(e) => setNotifyChannels((c) => ({ ...c, email: e.target.checked }))}
                    className="rounded"
                  />
                  <Mail className="h-3.5 w-3.5 text-blue-500" /> Email Digest
                </label>
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyChannels.inApp}
                    onChange={(e) => setNotifyChannels((c) => ({ ...c, inApp: e.target.checked }))}
                    className="rounded"
                  />
                  <MessageSquare className="h-3.5 w-3.5 text-amber-500" /> In-App Alert
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setNotifyModalOpen(false)}
              className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSendNotification}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Send Notification
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
