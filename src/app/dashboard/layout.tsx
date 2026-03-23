import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard BellezaTurno",
    default: "Dashboard | BellezaTurno",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
