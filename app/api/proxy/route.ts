import { NextRequest, NextResponse } from "next/server";

const MIRROR_URLS = [
    "https://otakudesu.best",
    "https://otakudesu.io",
    "https://otakudesu.cloud",
    "https://otakudesu.cam",
];

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    for (const mirror of MIRROR_URLS) {
        try {
            const url = `${mirror}${path}`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": ua,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
                    "Referer": mirror + "/",
                    "Cache-Control": "no-cache",
                },
                // Use next.js cache revalidation
                next: { revalidate: 300 }, // cache 5 minutes
            });

            if (!response.ok) {
                console.warn(`[proxy] ❌ ${mirror} returned ${response.status}`);
                continue;
            }

            const html = await response.text();
            console.log(`[proxy] ✅ Success from ${mirror}${path}`);

            return new NextResponse(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
            });
        } catch (err: any) {
            console.warn(`[proxy] ❌ Failed ${mirror}${path}: ${err.message}`);
        }
    }

    return NextResponse.json({ error: "All mirrors failed" }, { status: 502 });
}
