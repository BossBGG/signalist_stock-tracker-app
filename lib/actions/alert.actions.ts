"use server";

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { AlertModel } from "@/database/models/alert.model";
import { revalidatePath } from "next/cache";
import { success } from "better-auth";

export async function createAlert(data: any) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    await connectToDatabase();

    const payload = {
      ...data,
      userId: session.user.id,
      threshold: parseFloat(data.threshold),
    };

    await AlertModel.create(payload);
    revalidatePath("/watchlist");
    return { success: true };
  } catch (error) {
    console.error("Create Alert Error:", error);
    return { success: false, error: "Failed to create alert" };
  }
}

export async function getAlerts() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];
    await connectToDatabase();

    const alerts = await AlertModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(alerts));
  } catch (error) {
    console.error("Get Alerts Error:", error);
    return [];
  }
}
