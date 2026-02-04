import React, { useMemo, useState } from "react";
import { motion, Transition } from "framer-motion";
import {
  Settings,
  Wrench,
  BarChart3,
  ChevronRight,
  Search,
  Bell
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/spideradmin";

// -------------------- TYPES --------------------

type AdminRoute = {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
};

// -------------------- NAV STRUCTURE --------------------

const NAV_GROUPS = [
  { label: "Configuration", key: "config", items: ROUTES.configuration },
  { label: "Utilities", key: "utils", items: ROUTES.utilities },
  { label: "Monitoring", key: "monitor", items: ROUTES.monitoring }
];

// -------------------- MAIN COMPONENT --------------------

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(
    ROUTES.configuration[0]?.key || ""
  );

  // -------------------- ROUTE LOOKUP --------------------

  const lookup = useMemo<Record<string, AdminRoute>>(() => {
    const allRoutes: AdminRoute[] = [
      ...ROUTES.configuration,
      ...ROUTES.utilities,
      ...ROUTES.monitoring
    ];

    return Object.fromEntries(allRoutes.map((r) => [r.key, r]));
  }, []);

  const route = lookup[activeTab];
  const ActiveComp = route?.component ?? null;
  const activeProps = { ...(route?.props ?? {}), icon: route?.icon };

  const activeGroupLabel = NAV_GROUPS.find((g) =>
    g.items.some((i: any) => i.key === activeTab)
  )?.label;

  // -------------------- ANIMATION CONFIG --------------------

  const pageTransition: {
    initial: any;
    animate: any;
    transition: Transition;
  } = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 260, damping: 22 }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">

      {/* -------------------- SIDEBAR -------------------- */}

      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shadow-xl">

        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
            A
          </div>
          <div>
            <h2 className="font-semibold text-lg tracking-tight">Admin Console</h2>
            <p className="text-xs text-slate-400">BidAssist Team</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
{NAV_GROUPS.map((group, groupIndex) => (
<div key={group.key} className={`${groupIndex !== 0 ? "mt-6" : ""}`}>


{/* Group Label */}
<div className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-3 mb-3">
{group.label}
</div>


<ul className="space-y-2">
{group.items.map((item: any) => {
const isActive = activeTab === item.key;


return (
<li key={item.key} className="relative">


{/* Active Rail */}
{isActive && (
<motion.div
layoutId="sidebar-rail"
className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r-md"
/>
)}


<motion.button
whileHover={{ x: 4 }}
whileTap={{ scale: 0.97 }}
onClick={() => setActiveTab(item.key)}
className={`
w-full flex items-start gap-3 px-3 py-2.5
min-h-[42px]
text-sm rounded-lg transition-colors text-left
leading-5
${
isActive
? "bg-white/10 text-white"
: "text-slate-400 hover:bg-white/5 hover:text-white"
}
`}
>
{/* Icon */}
<span className="mt-[2px] shrink-0">
{item.icon ? (
<item.icon className="w-4 h-4" />
) : (
<div className="w-1.5 h-1.5 rounded-full bg-current" />
)}
</span>


{/* Label */}
<span className="break-words">
{item.label}
</span>


</motion.button>
</li>
);
})}
</ul>
</div>
))}
</nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-slate-700 ring-offset-2 ring-offset-[#0f172a]">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-slate-700 text-white">
                AD
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin User</span>
            </div>
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN AREA -------------------- */}

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Admin Console</span>
            <ChevronRight className="w-4 h-4" />
            <span>{activeGroupLabel}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-semibold">
              {route?.label || "Dashboard"}
            </span>
          </div>

        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8">
          <motion.div
            key={activeTab}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            transition={pageTransition.transition}
            className="w-full max-w-7xl mx-auto"
          >

            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {route?.label}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage and view details for {route?.label}
                </p>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px]">

              {/* Card Body */}
              <div className="p-6">
                {ActiveComp ? (
                  <ActiveComp {...activeProps} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <p className="text-sm">Select an option from the sidebar</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}