import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/spideradmin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>(ROUTES.configuration[0].key);

  const all = [
    ...ROUTES.configuration,
    ...ROUTES.utilities,
    ...ROUTES.monitoring
  ];
  const lookup = Object.fromEntries(all.map(r => [r.key, r]));

  // Grab the selected route object (may include `component`, `props`, and `icon`).
  const route = (lookup[activeTab] as any) ?? {};
  const ActiveComp = route.component ?? null;
  // Merge top-level `icon` into props so panels that render an icon receive it.
  const activeProps = { ...(route.props ?? {}), icon: route.icon };


  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">⚙️ Configuration</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ROUTES.configuration.map(it => <DropdownMenuItem key={it.key} onClick={() => setActiveTab(it.key)}>{it.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">🧰 Utilities / Task Management</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ROUTES.utilities.map(it => <DropdownMenuItem key={it.key} onClick={() => setActiveTab(it.key)}>{it.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">📊 Monitoring & Reporting</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ROUTES.monitoring.map(it => <DropdownMenuItem key={it.key} onClick={() => setActiveTab(it.key)}>{it.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="pt-4">
        {ActiveComp ? <ActiveComp key={route.key} {...activeProps} /> : <div>Select an option from the menu above.</div>}
      </section>
    </motion.div>
  );
}