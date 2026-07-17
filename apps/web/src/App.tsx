import { Route, Routes } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

function AppShell() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <ShieldCheck className="h-10 w-10 text-[var(--color-primary)]" aria-hidden="true" />
      <h1 className="text-2xl font-medium">11thONUS — Engineering Foundation</h1>
      <p className="text-[var(--color-muted-foreground)]">
        Phase 0 infrastructure scaffold. No product features are implemented yet.
      </p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
    </Routes>
  );
}

export default App;
