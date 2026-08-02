import React from "react";
import { ChevronRight, Home, Folder } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface DriveBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (id: string | null) => void;
}

export function DriveBreadcrumbs({ breadcrumbs, onNavigate }: DriveBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 py-3 text-sm text-muted-foreground select-none overflow-x-auto whitespace-nowrap">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-foreground transition duration-150 py-1 px-1.5 rounded-md hover:bg-muted"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="font-medium">My Drive</span>
      </button>

      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <button
              onClick={() => onNavigate(crumb.id)}
              disabled={isLast}
              className={`flex items-center gap-1 transition duration-150 py-1 px-1.5 rounded-md ${
                isLast
                  ? "text-foreground font-semibold cursor-default"
                  : "hover:text-foreground hover:bg-muted"
              }`}
            >
              <Folder className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span className="max-w-[120px] truncate">{crumb.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
