import { useState, useEffect } from "react";
import { Video, X, Calendar, Clock, Users, FileText, Sparkles } from "lucide-react";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilled?: { title: string; participants: string } | null;
  onSchedule: (meeting: {
    id: string;
    title: string;
    date: string;
    time: string;
    participants: string;
    agenda: string;
    provider: "google-meet" | "zoom" | "teams" | "amineva";
    meetingLink: string;
  }) => void;
}

export default function MeetingModal({ isOpen, onClose, prefilled, onSchedule }: MeetingModalProps) {
  const [title, setTitle] = useState("Contextual Business Review");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [agenda, setAgenda] = useState("");
  const [provider, setProvider] = useState<"google-meet" | "zoom" | "teams" | "amineva">("google-meet");

  useEffect(() => {
    // Set a default date for convenience (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
    setTime("14:00");
  }, []);

  useEffect(() => {
    if (prefilled) {
      if (prefilled.title) setTitle(prefilled.title);
      if (prefilled.participants) setParticipants(prefilled.participants);
    }
  }, [prefilled]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate link based on provider
    let meetingLink = "";
    const randId = Math.floor(100000000 + Math.random() * 900000000);
    if (provider === "google-meet") {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      const grp = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * 26)]).join("");
      meetingLink = `https://meet.google.com/${grp()}-${grp()}-${grp()}`;
    } else if (provider === "zoom") {
      meetingLink = `https://zoom.us/j/${randId}`;
    } else if (provider === "teams") {
      meetingLink = `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${randId}`;
    } else {
      meetingLink = `https://meeting.amineva.com/room/amv-${randId}`;
    }

    onSchedule({
      id: String(Date.now()),
      title,
      date,
      time,
      participants,
      agenda,
      provider,
      meetingLink
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog container */}
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-accent" />
            <h3 className="font-bold text-foreground text-sm">Schedule Online Meeting</h3>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground">Meeting Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none focus:ring-1 focus:ring-accent text-xs"
              placeholder="e.g. Q2 Partnership Sync"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Attendees
            </label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
              placeholder="Attendee emails (comma separated)"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Agenda / Description
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
              placeholder="What will this meeting cover?"
            />
          </div>

          {/* Provider Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground">Select Meeting Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "google-meet", label: "Google Meet", color: "border-emerald-300" },
                { id: "zoom", label: "Zoom Workspace", color: "border-blue-300" },
                { id: "teams", label: "MS Teams Link", color: "border-indigo-300" },
                { id: "amineva", label: "Amineva Meeting", color: "border-purple-300", premium: true }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as any)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between h-14 hover:bg-muted/50 transition ${
                    provider === p.id ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-card"
                  }`}
                >
                  <span className="font-bold">{p.label}</span>
                  {p.premium ? (
                    <span className="text-[9px] text-purple-600 font-bold flex items-center gap-0.5 mt-0.5">
                      <Sparkles className="h-2 w-2" /> Native Audio/Video
                    </span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">External Service</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 shadow-sm"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
