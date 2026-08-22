import { db } from "../src/lib/firebase/config";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { PropFirmDoc } from "../src/lib/firebase/schema";

import { goatFundedTrader } from "./prop-firm-data/goat-funded-trader";
import { ftmo } from "./prop-firm-data/ftmo";
import { fundednext } from "./prop-firm-data/fundednext";
import { the5ersData } from "./prop-firm-data/the5ers";
import { fundingPipsData } from "./prop-firm-data/fundingpips";
import { e8MarketsData } from "./prop-firm-data/e8-markets";
import { alphaCapitalData } from "./prop-firm-data/alpha-capital-group";
import { fxifyData } from "./prop-firm-data/fxify";
import { blueGuardianData } from "./prop-firm-data/blue-guardian";
import { mavenTradingData } from "./prop-firm-data/maven-trading";
import { tradeDayData } from "./prop-firm-data/tradeday";
import { myFundedFXData } from "./prop-firm-data/myfundedfx";
import { theFundedTraderData } from "./prop-firm-data/the-funded-trader";
import { topstepData } from "./prop-firm-data/topstep";
import { apexTraderFundingData } from "./prop-firm-data/apex-trader-funding";

const allFirms: PropFirmDoc[] = [
  goatFundedTrader, 
  ftmo, 
  fundednext, 
  the5ersData, 
  fundingPipsData, 
  e8MarketsData, 
  alphaCapitalData, 
  fxifyData, 
  blueGuardianData, 
  mavenTradingData,
  tradeDayData,
  myFundedFXData,
  theFundedTraderData,
  topstepData,
  apexTraderFundingData
];

async function seedPropFirms() {
  console.log("Starting idempotent seed of Prop Firms Database...");
  const batch = writeBatch(db);
  let count = 0;

  for (const firm of allFirms) {
    const firmRef = doc(db, "prop_firms", firm.id);
    const docSnap = await getDoc(firmRef);
    const firmData: any = { ...firm, updated_at: serverTimestamp() };

    if (!docSnap.exists()) {
      firmData.created_at = serverTimestamp();
      console.log(`[CREATE] Firm: ${firm.name}`);
    } else {
      console.log(`[UPDATE] Firm: ${firm.name}`);
    }
    batch.set(firmRef, firmData, { merge: true });
    count++;
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${count} Prop Firms.`);
}

seedPropFirms().catch(console.error);
