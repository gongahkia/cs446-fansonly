import Script from "next/script";
import "@/app/globals.css";

export const metadata = {
  title: "FansOnly",
  description: "Legacy storefront for ceiling, standing, and industrial fans."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script src="/assets/site-notes.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
