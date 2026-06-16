import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CARTESIA_API_KEY is not configured in .env" }, { status: 500 });
    }

    const { text, voiceId } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const cartesiaVoiceId = (voiceId && isUuid(voiceId)) ? voiceId : "57dcab65-68ac-45a6-8480-6c4c52ec1cd1";

    // Call Cartesia API for TTS
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: "sonic-3.5",
        voice: {
          mode: "id",
          id: cartesiaVoiceId
        },
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 24000
        },
        transcript: text
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cartesia error: ${errText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
