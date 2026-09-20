import { and, desc, eq } from "drizzle-orm";

import type { Db } from "./index";
import { monthlyReports } from "./schema";

export interface NewMonthlyReportInput {
  userId: string;
  yearMonth: string;
  summaryJson: string;
  modelUsed: string;
}

export async function getMonthlyReport(
  db: Db,
  userId: string,
  yearMonth: string,
) {
  const [row] = await db
    .select()
    .from(monthlyReports)
    .where(
      and(
        eq(monthlyReports.userId, userId),
        eq(monthlyReports.yearMonth, yearMonth),
      ),
    );
  return row ?? null;
}

export async function insertMonthlyReport(
  db: Db,
  input: NewMonthlyReportInput,
) {
  const [saved] = await db.insert(monthlyReports).values(input).returning();
  return saved;
}

export async function getLatestMonthlyReport(db: Db, userId: string) {
  const [row] = await db
    .select()
    .from(monthlyReports)
    .where(eq(monthlyReports.userId, userId))
    .orderBy(desc(monthlyReports.yearMonth))
    .limit(1);
  return row ?? null;
}
