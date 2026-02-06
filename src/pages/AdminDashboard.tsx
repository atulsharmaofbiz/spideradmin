import React, { useMemo, useState } from "react";
import { motion, Transition } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/spideradmin";

// TYPES

type AdminRoute = {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
};

type NavGroup = {
  label: string;
  key: string;
  items: AdminRoute[];
};

type NavGroupProps = {
  group: NavGroup;
  activeTab: string;
  onTabChange: (key: string) => void;
};

type NavItemProps = {
  item: AdminRoute;
  isActive: boolean;
  onSelect: () => void;
};

type BreadcrumbsProps = {
  groupLabel?: string;
  routeLabel: string;
};

// NAV STRUCTURE

const NAVIGATION_SECTIONS: NavGroup[] = [
  { label: "Configuration", key: "config", items: ROUTES.configuration },
  { label: "Utilities", key: "utils", items: ROUTES.utilities },
  { label: "Monitoring", key: "monitor", items: ROUTES.monitoring }
];

// HOOKS

function useActiveRoute(activeTab: string) {
  const routesByKey = useMemo<Record<string, AdminRoute>>(() => {
    const allRoutes = [
      ...ROUTES.configuration,
      ...ROUTES.utilities,
      ...ROUTES.monitoring
    ];
    return Object.fromEntries(allRoutes.map((r) => [r.key, r]));
  }, []);

  const route = routesByKey[activeTab];
  const groupLabel = NAVIGATION_SECTIONS.find((g) =>
    g.items.some((i) => i.key === activeTab)
  )?.label;

  return {
    route,
    groupLabel,
    component: route?.component ?? null,
    componentProps: { ...(route?.props ?? {}), icon: route?.icon }
  };
}

// NAVIGATION COMPONENTS 

function ActiveIndicatorRail() {
  return (
    <motion.div
      layoutId="sidebar-rail"
      className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r-md"
    />
  );
}

function NavIcon({ icon: Icon }: { icon?: React.ComponentType<any> }) {
  if (Icon) {
    return <Icon className="w-4 h-4 mt-[2px] shrink-0" />;
  }
  return <div className="w-1.5 h-1.5 rounded-full bg-current mt-[2px] shrink-0" />;
}

function getNavItemClasses(isActive: boolean): string {
  const base =
    "w-full flex items-start gap-3 px-3 py-2.5 min-h-[42px] text-sm rounded-lg transition-colors text-left leading-5";
  const active = "bg-white/10 text-white";
  const inactive = "text-slate-400 hover:bg-white/5 hover:text-white";
  return `${base} ${isActive ? active : inactive}`;
}

function NavItem({ item, isActive, onSelect }: NavItemProps) {
  return (
    <li className="relative">
      {isActive && <ActiveIndicatorRail />}
      <motion.button
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSelect}
        className={getNavItemClasses(isActive)}
      >
        <NavIcon icon={item.icon} />
        <span className="break-words">{item.label}</span>
      </motion.button>
    </li>
  );
}

function NavGroup({ group, activeTab, onTabChange }: NavGroupProps) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-3 mb-3">
        {group.label}
      </div>
      <ul className="space-y-2">
        {group.items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={activeTab === item.key}
            onSelect={() => onTabChange(item.key)}
          />
        ))}
      </ul>
    </div>
  );
}

// HEADER COMPONENTS

function Breadcrumbs({ groupLabel, routeLabel }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span>Admin Console</span>
      <ChevronRight className="w-4 h-4" />
      <span>{groupLabel}</span>
      <ChevronRight className="w-4 h-4" />
      <span className="text-slate-900 font-semibold">{routeLabel}</span>
    </div>
  );
}

// LAYOUT COMPONENTS

function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (key: string) => void }) {
  return (
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
        {NAVIGATION_SECTIONS.map((group) => (
          <NavGroup
            key={group.key}
            group={group}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
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
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage and view details for {title}
        </p>
      </div>
    </div>
  );
}

function ContentCard({
  ContentComponent,
  componentProps
}: {
  ContentComponent: React.ComponentType<any> | null;
  componentProps: Record<string, any>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px]">
      <div className="p-6">
        {ContentComponent ? (
          <ContentComponent {...componentProps} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p className="text-sm">Select an option from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ANIMATION CONFIG

const PAGE_TRANSITION: {
  initial: any;
  animate: any;
  transition: Transition;
} = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 260, damping: 22 }
};

// MAIN COMPONENT

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(
    ROUTES.configuration[0]?.key || ""
  );

  const { route, groupLabel, component: ContentComponent, componentProps } =
    useActiveRoute(activeTab);

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* MAIN AREA */}

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8">
          <Breadcrumbs
            groupLabel={groupLabel}
            routeLabel={route?.label || "Dashboard"}
          />
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8">
          <motion.div
            key={activeTab}
            initial={PAGE_TRANSITION.initial}
            animate={PAGE_TRANSITION.animate}
            transition={PAGE_TRANSITION.transition}
            className="w-full max-w-7xl mx-auto"
          >
            <PageHeader title={route?.label || "Dashboard"} />
            <ContentCard
              ContentComponent={ContentComponent}
              componentProps={componentProps}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}