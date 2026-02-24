import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SARAFILM - Streaming Anime Sub Indo",
  description: "Platform streaming anime dengan antarmuka bersih dan modern.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#f0f0f0] text-black`}>
        <Navbar />
        <main className="flex-grow">{children}</main>

        <footer className="bg-white border-t-8 border-black py-20 px-6 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col gap-6">
              <div className="text-4xl font-black tracking-tighter text-black uppercase italic">SARAFILM</div>
              <p className="text-xl font-bold text-black max-w-xs leading-snug border-l-4 border-black pl-4">
                Nonton anime subtitle Indonesia gratis dengan kualitas terbaik dan desain yang berani.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-black uppercase text-xl tracking-tighter text-black">Quick Links</h4>
              <div className="flex flex-col gap-3 text-lg font-bold text-black/80">
                <LinkItem href="/" label="Home" />
                <LinkItem href="/ongoing" label="Ongoing Anime" />
                <LinkItem href="/browse" label="Browse Anime" />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-black uppercase text-xl tracking-tighter text-black">Support</h4>
              <div className="flex flex-col gap-3 text-lg font-bold text-black/80">
                <LinkItem href="#" label="Privacy Policy" />
                <LinkItem href="#" label="Terms of Service" />
                <LinkItem href="#" label="Contact Us" />
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t-4 border-black text-center text-sm font-black text-black uppercase tracking-widest">
            © 2026 SARAFILM. <span className="bg-yellow-300 px-2 border-2 border-black inline-block ml-1">BOLD & BRUTAL ANIME STREAMING.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

import Link from "next/link";
function LinkItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="hover:underline underline-offset-4 decoration-2 transition-all">
      {label}
    </Link>
  );
}
