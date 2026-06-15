import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
        }

        const apiKey = process.env.CARTESIA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "CARTESIA_API_KEY is not configured in .env" }, { status: 500 });
        }

        const response = await fetch(`https://api.cartesia.ai/voices/${id}?expand[]=preview_file_url`, {
            headers: {
                "X-API-Key": apiKey,
                "Cartesia-Version": "2024-06-10"
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Cartesia API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        
        return NextResponse.json({ preview_url: data.preview_file_url || null });
    } catch (error: any) {
        console.error("Failed to fetch Cartesia voice preview:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
