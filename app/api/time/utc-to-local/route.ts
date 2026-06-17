import { NextResponse } from "next/server";
import { bulkTimeInputSchema, fromUtcResult, parseUtc } from "@/lib/time-conversion";

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

    const { items, timezone, locale, format } = result.data;

    const results = items.map((item, index) => {
      try {
        const resolvedTimezone = item.timezone || timezone || "UTC";
        const resolvedLocale = item.locale || locale || "en-US";
        const resolvedFormat = item.format || format || "datetime";
        const parsedDate = parseUtc(item.value);

        return {
          ok: true,
          index,
          result: fromUtcResult(item.value, parsedDate, resolvedTimezone, resolvedLocale, resolvedFormat),
        };
      } catch (error: unknown) {
        return {
          ok: false,
          index,
          input: String(item.value),
          error: error instanceof Error ? error.message : "Failed to parse UTC time",
        };
      }
    });

    return NextResponse.json({
      success: true,
      converted: results.filter((result) => result.ok),
      errors: results.filter((result) => !result.ok),
    });
  } catch (error: unknown) {
    console.error("Failed to convert UTC time:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert UTC time" },
      { status: 500 },
    );
  }
}
