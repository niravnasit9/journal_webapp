"use server";

import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function deleteAccountAction(accountId: string) {
  try {
    const accountRef = doc(db, "accounts", accountId);
    await deleteDoc(accountRef);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message };
  }
}
