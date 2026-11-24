export default function GlobalFooter() {
  return (
    <footer className="border-t border-border bg-background px-5 py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Amineva Global. All rights reserved.
    </footer>
  );
}
