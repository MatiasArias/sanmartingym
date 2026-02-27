import type { Metadata } from "next";
import "./globals.css";
import { GlobalFetchLoading } from "@/components/GlobalFetchLoading";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "San Martín Gym",
  description: "Sistema de entrenamiento para Club San Martín",
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#E31E24",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "San Martín Gym",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <GlobalFetchLoading />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
