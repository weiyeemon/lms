import { describe, expect, test } from "vitest";

import { calculateRequestedDays } from "@/features/leave-requests/calculation";

describe("leave day calculation", () => {
  test("excludes weekends and public holidays", () => {
    expect(
      calculateRequestedDays({
        startDate: "2026-08-07",
        endDate: "2026-08-11",
        leaveUnit: "full_day",
        holidayDates: ["2026-08-10"],
      }),
    ).toEqual({ days: 2, error: null });
  });

  test("counts either half-day unit as half a day", () => {
    for (const leaveUnit of [
      "half_day_morning",
      "half_day_afternoon",
    ] as const) {
      expect(
        calculateRequestedDays({
          startDate: "2026-08-11",
          endDate: "2026-08-11",
          leaveUnit,
          holidayDates: [],
        }),
      ).toEqual({ days: 0.5, error: null });
    }
  });

  test("rejects a reversed range", () => {
    expect(
      calculateRequestedDays({
        startDate: "2026-08-12",
        endDate: "2026-08-11",
        leaveUnit: "full_day",
        holidayDates: [],
      }),
    ).toEqual({ days: null, error: "End date cannot be before start date." });
  });

  test("rejects half-day leave on non-working days", () => {
    expect(
      calculateRequestedDays({
        startDate: "2026-08-08",
        endDate: "2026-08-08",
        leaveUnit: "half_day_morning",
        holidayDates: [],
      }),
    ).toEqual({
      days: null,
      error: "Half-day leave must be on a working day.",
    });
  });

  test("rejects cross-year requests", () => {
    expect(
      calculateRequestedDays({
        startDate: "2026-12-31",
        endDate: "2027-01-02",
        leaveUnit: "full_day",
        holidayDates: [],
      }),
    ).toEqual({
      days: null,
      error: "A request must stay within one calendar year.",
    });
  });
});
