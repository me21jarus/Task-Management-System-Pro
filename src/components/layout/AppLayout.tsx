import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import { cn } from "../../lib/utils";

const SIDEBAR_WIDTH = 260;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* ── Fixed header ── */}
      <Header
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* ── Body below header ── */}
      <div
        className={cn(
          "flex-1 flex overflow-hidden",
          "pt-16"
        )}
      >
        <div
          className={cn(
            "flex-1 flex overflow-hidden",
            "flex flex-col md:grid"
          )}
          style={{ gridTemplateColumns: `${SIDEBAR_WIDTH}px 1fr` }}
        >
          {/* Column 1 — Left Sidebar */}
          <div className="md:h-full flex flex-col min-w-0">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Column 2 + 3 — Main + Right Rail wrapper */}
          <div className="flex flex-1 overflow-hidden min-w-0">
            {/* Column 2 — Main content (scrolls independently) */}
            <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 min-w-0">
              <div
                className={cn(
                  "min-h-full px-4 py-6",
                  "xl:px-8"
                )}
              >
                <Outlet />
              </div>
            </main>

            {/* Column 3 — Right Rail */}
            <RightRail />
          </div>
        </div>
      </div>
    </div>
  );
}
