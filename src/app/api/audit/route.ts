import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { PropFirmDoc } from "@/lib/firebase/schema";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "prop_firms"));
    const firms = snap.docs.map(d => ({ ...d.data(), id: d.id } as PropFirmDoc));
    
    const audit = firms.map(firm => {
      return {
        id: firm.id,
        name: firm.name,
        totalPlans: firm.plans?.length || 0,
        totalRules: firm.rules?.length || 0,
        plans: firm.plans?.map(p => ({
          id: p.id,
          name: p.name,
          size: p.account_size,
          phase: p.phase_name
        }))
      };
    });
    
    return NextResponse.json({ success: true, audit, totalFirms: firms.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
