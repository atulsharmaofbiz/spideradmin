import React, { useEffect, useState } from "react";
import AdminDashboard from "@/pages/AdminDashboard";

const DevAuthBanner: React.FC = () => {
  const headerName =
    import.meta.env.VITE_BFF_DEV_AUTH_HEADER_NAME || "x-admin-ui-token";
  const token = import.meta.env.VITE_BFF_DEV_AUTH_TOKEN || "";

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // No token configured → don’t show banner at all
    if (!token) {
      setAuthorized(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch("/bff/dev-auth-status", { method: "GET" });
        // 200 => authorized, 401/other => not
        setAuthorized(res.ok);
      } catch {
        setAuthorized(false);
      }
    };

    checkAuth();
  }, [token]);

  // If authorized (or still checking), don’t show banner
  if (authorized !== false) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      alert("Dev auth token copied to clipboard!");
    } catch {
      alert("Could not copy token automatically. Please copy it manually.");
    }
  };

  return (
    <div
      style={{
        padding: "8px 12px",
        background: "#fff7e6",
        borderBottom: "1px solid #f0c36d",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <strong>Dev Auth Required</strong>
      <span>
        Add header <code>{headerName}</code> with value{" "}
        <code>{token}</code> in ModHeader for calls to the BFF.
      </span>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          padding: "2px 8px",
          borderRadius: "4px",
          border: "1px solid #f0c36d",
          background: "#ffe8ba",
          cursor: "pointer",
        }}
      >
        Copy token
      </button>
    </div>
  );
};

export default function App() {
  return (
    <>
      <DevAuthBanner />
      <AdminDashboard />
    </>
  );
}