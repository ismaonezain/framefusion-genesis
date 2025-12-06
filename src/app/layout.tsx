import type { Metadata } from "next";
import localFont from "next/font/local";
import '@coinbase/onchainkit/styles.css';
import "./globals.css";
import { Providers } from './providers';
import { ResponseLogger } from "@/components/response-logger";
import { cookies } from "next/headers";
import { ReadyNotifier } from "@/components/ready-notifier";
import FarcasterWrapper from "@/components/FarcasterWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestId = cookies().get("x-request-id")?.value;

  return (
    <html lang="en">
      <head>
        {requestId && <meta name="x-request-id" content={requestId} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Do not remove this component, we use it to notify the parent that the mini-app is ready */}
        <ReadyNotifier />
        <Providers>
          <FarcasterWrapper>
            {children}
          </FarcasterWrapper>
        </Providers>
        <ResponseLogger />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
        title: "FrameFusion Genesis",
        description: "Generate and mint unique NFTs up to 3000 max. Store results in Supabase, view OpenSea links, and share on social media. One mint per user limit. Powered by @ismaone.farcaster.eth.",
        icons: {
          icon: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/e876a140-46d7-484e-a113-0c8c5607a34f-GVAdj8k6w8vsqNXF4Vu9yBoM1220Sw",
          apple: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/e876a140-46d7-484e-a113-0c8c5607a34f-GVAdj8k6w8vsqNXF4Vu9yBoM1220Sw",
        },
        other: { "fc:frame": JSON.stringify({"version":"next","imageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/b4388624-c9aa-4e7f-940c-e5747935a0ab-RBk488YIQDelZdp8RcSOtGtwnqByBX","button":{"title":"Open with Ohara","action":{"type":"launch_frame","name":"FrameFusion Genesis","url":"https://partly-happily-279.app.ohara.ai","splashImageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/b4388624-c9aa-4e7f-940c-e5747935a0ab-RBk488YIQDelZdp8RcSOtGtwnqByBX","splashBackgroundColor":"#ffffff"}}}
        ) }
    };
