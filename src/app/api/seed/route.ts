import { NextResponse } from "next/server";
import { collection, setDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function GET() {
  try {
    // Find the user ID
    const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", "niravnasit0351@gmail.com")));
    if (usersSnap.empty) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const uid = usersSnap.docs[0].data().uid;

    const strategies = [
      {
        id: "strat_kllt_01_" + uid,
        owner_uid: uid,
        name: "Pre-Breakout (Accumulation Trap)",
        description: "Trading institutional liquidity traps when the market consolidates just below Resistance, trapping early sellers.",
        rules: [
          "Identify a clear Resistance or Day High level.",
          "Wait for price to consolidate tightly just below the level.",
          "Ensure early sellers are trapped (no significant drop).",
          "Play: Buy the upward breakout as shorts cover."
        ],
        created_at: new Date().toISOString(),
        is_public: true,
      },
      {
        id: "strat_kllt_02_" + uid,
        owner_uid: uid,
        name: "Pre-Breakdown (Distribution Trap)",
        description: "Trading institutional liquidity traps when the market consolidates just above Support, trapping early buyers.",
        rules: [
          "Identify a clear Support or Day Low level.",
          "Wait for price to consolidate tightly just above the level.",
          "Ensure early buyers are trapped (no significant bounce).",
          "Play: Short the downward breakdown as longs get stopped out."
        ],
        created_at: new Date().toISOString(),
        is_public: true,
      },
      {
        id: "strat_kllt_03_" + uid,
        owner_uid: uid,
        name: "False Breakdown (Spring)",
        description: "Trading institutional liquidity hunts when the market breaks below Support but immediately reverses upward.",
        rules: [
          "Wait for price to break below Support or Day Low.",
          "Ensure the breakdown lacks follow-through or volume.",
          "Wait for a strong bullish rejection candle closing back above Support.",
          "Play: Buy the reversal upward (Spring)."
        ],
        created_at: new Date().toISOString(),
        is_public: true,
      },
      {
        id: "strat_kllt_04_" + uid,
        owner_uid: uid,
        name: "False Breakout (Upthrust)",
        description: "Trading institutional liquidity hunts when the market breaks above Resistance but immediately reverses downward.",
        rules: [
          "Wait for price to break above Resistance or Day High.",
          "Ensure the breakout lacks follow-through or volume.",
          "Wait for a strong bearish rejection candle closing back below Resistance.",
          "Play: Short the reversal downward (Upthrust)."
        ],
        created_at: new Date().toISOString(),
        is_public: true,
      }
    ];

    for (const strat of strategies) {
      const ref = doc(collection(db, "strategies"), strat.id);
      await setDoc(ref, strat);
    }
    return NextResponse.json({ success: true, message: "Strategies seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
