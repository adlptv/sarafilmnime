"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, TrendingUp, Compass, Film, Menu, X, Search } from "lucide-react";
import SearchInput from "./SearchInput";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Home", icon: <Home size={18} /> },
        { href: "/ongoing", label: "Ongoing", icon: <TrendingUp size={18} /> },
        { href: "/browse", label: "Browse", icon: <Compass size={18} /> },
    ];

    return (
        <>
            <header className="sticky top-0 z-[100] bg-white border-b-4 border-black px-4 md:px-10 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="lg:hidden p-2 neo-border bg-[var(--neo-yellow)] active:translate-x-[2px] active:translate-y-[2px] transition-transform"
                    >
                        <Menu size={24} />
                    </button>

                    <Link href="/" className="flex items-center gap-2 text-2xl md:text-3xl font-black tracking-tighter text-black uppercase italic shrink-0">
                        <Film className="fill-black" size={28} />
                        <span className="hidden sm:inline">SARAFILM</span>
                        <span className="sm:hidden">SF</span>
                    </Link>
                </div>

                <nav className="hidden lg:flex items-center gap-8 font-black text-sm uppercase tracking-tight text-black">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="hover:underline underline-offset-4 decoration-4 flex items-center gap-2"
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:block">
                        <SearchInput className="w-48 md:w-64" />
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="md:hidden p-2 neo-border bg-[var(--neo-blue)]"
                    >
                        <Search size={22} />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-4/5 max-w-sm h-full bg-white border-r-8 border-black p-8 flex flex-col gap-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-3xl font-black italic uppercase italic">SARAFILM</div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 neo-border bg-[var(--neo-red)] text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col gap-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Main Menu</h4>
                                    <div className="flex flex-col gap-2">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className="neo-card flex items-center gap-4 text-xl font-black uppercase hover:bg-[var(--neo-yellow)] transition-colors"
                                            >
                                                <span className="p-2 bg-black text-white">{link.icon}</span>
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Search Anime</h4>
                                    <SearchInput className="w-full" />
                                </div>
                            </div>

                            <div className="mt-auto border-t-4 border-black pt-6 flex flex-col gap-4">
                                <p className="font-bold text-sm">Streaming anime subtitle Indonesia gratis.</p>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 neo-border bg-[var(--neo-blue)]" />
                                    <div className="w-10 h-10 neo-border bg-[var(--neo-pink)]" />
                                    <div className="w-10 h-10 neo-border bg-[var(--neo-yellow)]" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
