import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.CARTESIA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "CARTESIA_API_KEY is not configured in .env" }, { status: 500 });
        }

        const response = await fetch("https://api.cartesia.ai/voices?expand[]=preview_file_url", {
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
        
        // Cartesia returns an array of voices.
        // We can try to fetch previews individually if needed, but for now we return the list.
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Failed to fetch Cartesia voices:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
