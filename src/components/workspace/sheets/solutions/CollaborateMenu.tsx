import { useState } from "react";
import { ChevronDown, Video, Calendar, Share2, BellRing } from "lucide-react";

interface CollaborateMenuProps {
  onCreateMeeting: () => void;
  onScheduleEvent: () => void;
  onShare: () => void;
  onNotifyTeam: () => void;
}

export default function CollaborateMenu({
  onCreateMeeting,
  onScheduleEvent,
  onShare,
  onNotifyTeam
}: CollaborateMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5"
      >
        <Share2 className="h-3.5 w-3.5" /> Collaborate <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-[100] w-52 rounded-lg border border-border bg-popover shadow-xl py-1 text-xs text-foreground">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateMeeting();
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
            >
              <Video className="h-3.5 w-3.5 text-accent" />
              <span>Create Online Meeting</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onScheduleEvent();
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <span>Schedule Calendar Event</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onShare();
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Share Workspace</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onNotifyTeam();
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-500" />
              <span>Notify Team members</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
