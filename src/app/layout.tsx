import type { Metadata } from "next";
import { plusJakartaSans } from "@/lib/fonts";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "POHub by Tojuko.ID — Jualan PO, tanpa ribetnya",
    template: "%s | POHub",
  },
  description:
    "Pelangganmu pesan lebih gampang lewat satu link, kamu tahu bahan yang harus dibeli dan untung dari setiap PO.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border !border-border !shadow-md !font-sans",
              success: "!bg-success !text-secondary",
              error: "!bg-error !text-white",
            },
          }}
        />
      </body>
    </html>
  );
}
