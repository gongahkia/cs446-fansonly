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
        <div className="bg-fan" aria-hidden="true">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(100,100)">
              <circle r="8" fill="currentColor" />
              {/* 5 blades */}
              <path d="M0-6C-4-28-14-60-6-80 10-74 18-44 12-20Z" fill="currentColor" />
              <path d="M5.7-1.9C26-12 54-30 74-18 64-4 38 8 16 6Z" fill="currentColor" />
              <path d="M3.5 4.9C20 22 40 50 28 68 14 62 2 36 -2 14Z" fill="currentColor" />
              <path d="M-3.5 4.9C-20 22-40 50-28 68-14 62-2 36 2 14Z" fill="currentColor" />
              <path d="M-5.7-1.9C-26-12-54-30-74-18-64-4-38 8-16 6Z" fill="currentColor" />
            </g>
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
