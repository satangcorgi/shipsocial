import "./globals.css";

export const metadata = {
  title: "ShipSocial",
  description: "Consistency engine for small brands.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The suppressHydrationWarning here avoids noisy console warnings when
    // browser extensions add attributes before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}