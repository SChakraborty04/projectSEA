import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, body, from, timezone } = await req.json()

    const now = new Date()
    // Use the client's timezone or fall back to UTC
    const userTimezone = timezone || 'UTC'
    const nowInUserTz = now.toLocaleString('en-US', { timeZone: userTimezone })
    const currentDateStr = new Date(nowInUserTz).toLocaleDateString('en-CA') // YYYY-MM-DD

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const prompt = `You are an expert at extracting meeting/event details from email content.

Current date (user local): ${currentDateStr}
User's timezone: ${userTimezone}

Extract the meeting/event details from the following email and return ONLY a valid JSON object with these exact fields:
- "summary": event title (e.g. "Meeting with Reo Overa")
- "startDateTime": ISO 8601 datetime string in the user's local timezone (e.g. "2026-06-27T11:00:00")
- "endDateTime": ISO 8601 datetime string in the user's local timezone, 1 hour after start unless specified
- "description": brief context from the email (1-2 sentences max)

Rules:
- Parse ordinal dates like "27th june", "June 27th", "June 27" correctly
- Parse times like "11:00 AM IST", "3 PM", "15:00" correctly
- If no specific time is mentioned, default to 10:00 AM
- If no specific date is mentioned, default to tomorrow
- Return ONLY the raw JSON object, no markdown, no explanation, no code blocks

Email:
From: ${from || 'Unknown'}
Subject: ${subject || '(no subject)'}
Body: ${body?.substring(0, 2000) || '(no body)'}

JSON:`

    const result = await generateText({
      model: openrouter('google/gemini-3.1-flash-lite'),
      prompt,
    })


    // Clean response — strip any markdown fences if model adds them
    let raw = result.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim()
    }

    const parsed = JSON.parse(raw)

    // Validate required fields
    if (!parsed.summary || !parsed.startDateTime || !parsed.endDateTime) {
      throw new Error('AI response missing required fields')
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (err: any) {
    console.error('[Extract Calendar] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to extract calendar data' },
      { status: 500 }
    )
  }
}
