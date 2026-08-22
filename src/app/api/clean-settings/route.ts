import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, deleteField } from "firebase/firestore";

export async function GET() {
  try {
    const docRef = doc(db, "settings", "platform");
    await updateDoc(docRef, {
      accountTypes: deleteField(),
      propFirms: deleteField()
    });
    return NextResponse.json({ success: true, message: "Legacy fields deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
