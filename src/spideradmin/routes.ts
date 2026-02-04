import { Hash, FileText, ShieldAlert, BugPlay, Database, Smartphone, Globe, Activity,BarChart3,LineChart } from "lucide-react";
import ScopeSetPanel from "@/components/panels/ScopeSetPanel";
import MutedPatternsPanel from "@/components/panels/MutedAlertsPanel";
import ProviderCrawlPanel from "@/components/panels/ProviderCrawlPanel";
import AdhocTenderStatusPanel from "@/components/panels/AdhocTenderStatusPanel";
import IrepsOtpPanel from "@/components/panels/IrepsOtpPanel";
import ServerIpsPanel from "@/components/panels/ServerIpsPanel";
import MetricsPanel from "@/components/panels/MetricsPanel";
import GemStatPanel from "@/components/panels/GemStatsPanel";
import EprocurePanel from "@/components/panels/EprocureStatsPanel";

export const ROUTES = {
  configuration: [
    {
      key: "disabled-domains",
    label: "Disabled Domains",
      icon: Hash,
      component: ScopeSetPanel,
      props: {
        title: "Disabled Domains",
        listPath: "/disabled-domains",
        addPath: "/disabled-domains",
        delPath: "/disabled-domains",
        keyFormat: "suffix",
        transport: "query",
      },
    },
    {
      key: "json-cache",
      label: "Disable JSON Cache",
      icon: FileText,
      component: ScopeSetPanel,
      props: {
        title: "Disable JSON Hashcode Caching",
        listPath: "/disable-json-hashcode",
        addPath: "/disable-json-hashcode",
        delPath: "/disable-json-hashcode",
        keyFormat: "prefix",
        transport: "query",
      },
    },
    {
      key: "file-cache",
    label: "File Caching",
      icon: FileText,
      component: ScopeSetPanel,
      props: {
        title: "Disable File Caching",
        listPath: "/disable-file-caching",
        addPath: "/disable-file-caching",
        delPath: "/disable-file-caching",
        keyFormat: "domain",
        supportsEntity: false,
        transport: "query",
      },
    },
    {
      key: "muted-patterns",
      label: "Alert Mutes",
      icon: ShieldAlert,
      component: MutedPatternsPanel,
    },
  ],

  utilities: [
    {
      key: "provider-task",
      label: "Provider Crawl",
      icon: BugPlay,
      component: ProviderCrawlPanel,
    },
    {
      key: "adhoc-task",
      label: "Adhoc Status",
      icon: Database,
      component: AdhocTenderStatusPanel,
    },
    {
      key: "ireps-otp",
      label: "IREPS OTP",
      icon: Smartphone,
      component: IrepsOtpPanel,
    },
  ],

  monitoring: [
    {
      key: "server-ips",
      label: "Server IPs",
      icon: Globe,
      component: ServerIpsPanel,
    },
    {
      key: "ba-source",
      label: "Domain Metrics",
      icon: Activity,
      component: MetricsPanel,
    },
    {
      key: "gem-stats",
      label: "GeM Stats",
      icon: BarChart3,
      component: GemStatPanel,
    },
    {
      key: "eprocure-stats",
      label: "eProc Stats",
      icon: LineChart,
      component: EprocurePanel,
    },
  ],
};
