import { NextResponse } from "next/server";
import { bulkTimeInputSchema, parseLocalTimeToUtc, toUtcResult } from "@/lib/time-conversion";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = bulkTimeInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request body" },
        { status: 400 },
      );
    }

    const { items, timezone, locale, date, format } = result.data;

    const results = items.map((item, index) => {
      try {
        const resolvedTimezone = item.timezone || timezone || "UTC";
        const resolvedLocale = item.locale || locale || "en-US";
        const parsedDate = parseLocalTimeToUtc(item.value, {
          timezone: resolvedTimezone,
          locale: resolvedLocale,
          date: item.date || date,
          format,
        });

        return {
          ok: true,
          index,
          result: toUtcResult(item.value, parsedDate, resolvedTimezone, resolvedLocale),
        };
      } catch (error: unknown) {
        return {
          ok: false,
          index,
          input: String(item.value),
          error: error instanceof Error ? error.message : "Failed to parse time",
        };
      }
    });

    return NextResponse.json({
      success: true,
      converted: results.filter((result) => result.ok),
      errors: results.filter((result) => !result.ok),
    });
  } catch (error: unknown) {
    console.error("Failed to convert local time to UTC:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert time to UTC" },
      { status: 500 },
    );
  }
}
