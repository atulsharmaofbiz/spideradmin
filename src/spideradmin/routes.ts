import { Hash, FileText, ShieldAlert, BugPlay, Database, Smartphone, Globe, Activity } from "lucide-react";
import ScopeSetPanel from "@/components/panels/ScopeSetPanel";
import MutedPatternsPanel from "@/components/panels/MutedAlertsPanel";
import ProviderCrawlPanel from "@/components/panels/ProviderCrawlPanel";
import AdhocTenderStatusPanel from "@/components/panels/AdhocTenderStatusPanel";
import IrepsOtpPanel from "@/components/panels/IrepsOtpPanel";
import ServerIpsPanel from "@/components/panels/ServerIpsPanel";
import MetricsPanel from "@/components/panels/MetricsPanel";

export const ROUTES = {
  configuration: [
    {
      key: "disabled-domains",
      label: "View/Add/Delete Disabled Domains",
      icon: Hash,
      component: ScopeSetPanel,
      props: { title: "Disabled Domains", listPath: "/api/public/disabled-domains", addPath: "/api/public/disabled-domains", delPath: "/api/public/disabled-domains", keyFormat: "suffix", transport: "query" }
    },
    {
      key: "json-cache",
      label: "View/Add/Delete Disable JSON Hashcode Caching",
      icon: FileText,
      component: ScopeSetPanel,
      props: { title: "Disable JSON Hashcode Caching", listPath: "/api/public/disable-json-hashcode", addPath: "/api/public/disable-json-hashcode", delPath: "/api/public/disable-json-hashcode", keyFormat: "prefix", transport: "query" }
    },
    {
      key: "file-cache",
      label: "View/Add/Delete File Caching",
      icon: FileText,
      component: ScopeSetPanel,
      props: { title: "Disable File Caching", listPath: "/api/public/disable-file-caching", addPath: "/api/public/disable-file-caching", delPath: "/api/public/disable-file-caching", keyFormat: "domain", supportsEntity: false, transport: "query" }
    },
    {
      key: "muted-patterns",
      label: "View/Add/Delete Muted Alert Patterns",
      icon: ShieldAlert,
      component: MutedPatternsPanel
    }
  ],

  utilities: [
    { key: "provider-task", label: "Inject Provider Crawling Task", icon: BugPlay, component: ProviderCrawlPanel },
    { key: "adhoc-task", label: "Add Adhoc Tender Status Task", icon: Database, component: AdhocTenderStatusPanel },
    { key: "ireps-otp", label: "View/Update IREPS OTP", icon: Smartphone, component: IrepsOtpPanel }
  ],

  monitoring: [
    { key: "server-ips", label: "View Current IP Addresses", icon: Globe, component: ServerIpsPanel },
    { key: "ba-source", label: "View BA vs Source-Wise Domain Count", icon: Activity, component: MetricsPanel }
  ]
};