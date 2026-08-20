"use server";

import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AccountDoc } from "@/lib/firebase/schema";

export async function createManualAccountAction(uid: string, data: {
  label: string;
  broker: string;
  account_type: string;
  currency: "USD" | "INR";
  initial_balance: number;
}) {
  try {
    const newAccountRef = doc(collection(db, "accounts"));
    
    const accountData: AccountDoc = {
      id: newAccountRef.id,
      owner_uid: uid,
      label: data.label,
      broker: data.broker,
      account_type: data.account_type,
      currency: data.currency,
      initial_balance: Number(data.initial_balance),
      current_balance: Number(data.initial_balance),
      current_equity: Number(data.initial_balance),
      created_at: new Date().toISOString(),
    };

    await setDoc(newAccountRef, accountData);

    return { success: true, accountId: newAccountRef.id };
  } catch (error: any) {
    console.error("Error creating manual account:", error);
    return { success: false, error: error.message };
  }
}
