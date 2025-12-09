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

    const mapped = alerts.map(alert => ({
      ...alert,
      id: alert._id.toString(),
      _id: alert._id.toString()
    }));

    return JSON.parse(JSON.stringify(mapped));
  } catch (error) {
    console.error("Get Alerts Error:", error);
    return [];
  }
}

export async function updateAlert(alertId: string, data: any) {
  try {
    console.log("[UPDATE ALERT] Starting update for alertId:", alertId);
    console.log("[UPDATE ALERT] Data to update:", data);
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    await connectToDatabase();

    const payload = {
      ...data,
      threshold: parseFloat(data.threshold),
    };
    
    console.log("[UPDATE ALERT] Payload:", payload);

    const result = await AlertModel.findOneAndUpdate(
      { _id: alertId, userId: session.user.id },
      payload,
      { new: true }
    );

    console.log("[UPDATE ALERT] Update result:", result ? "Updated" : "Not found");
    console.log("[UPDATE ALERT] Updated document:", JSON.stringify(result));

    revalidatePath("/watchlist");
    console.log("[UPDATE ALERT] Path revalidated");
    
    return { success: true };
  } catch (error) {
    console.error("[UPDATE ALERT] Error:", error);
    return { success: false, error: "Failed to update alert" };
  }
}

export async function deleteAlert(alertId: string){
  try {
    
    const session = await auth.api.getSession({ headers: await headers() });
    if(!session?.user) {
      throw new Error("Unauthorized");
    }

    await connectToDatabase();

    const result = await AlertModel.findOneAndDelete({
      _id: alertId,
      userId: session.user.id
    });
    

    revalidatePath("/watchlist");
    
    return { success: true};
  } catch (error) {
    console.error("[DELETE ALERT] Error:", error);
    return { success: false, error: "Failed to delete alert"}
  }
}
