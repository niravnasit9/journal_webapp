import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { TradeDoc } from "@/lib/firebase/schema";

export const tradeService = {
  /**
   * Fetches all trades for a given array of account IDs.
   */
  async fetchTradesForAccounts(accountIds: string[]): Promise<TradeDoc[]> {
    if (!accountIds || accountIds.length === 0) return [];
    
    let allTrades: TradeDoc[] = [];
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 10000));
    
    // Using Promise.all for faster parallel fetching
    const promises = accountIds.map(async (accId) => {
      const tQuery = query(collection(db, "trades"), where("account_id", "==", accId));
      const tSnap: any = await Promise.race([getDocs(tQuery), timeoutPromise]);
      return tSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as TradeDoc));
    });

    const results = await Promise.all(promises);
    allTrades = results.flat();
    
    // Sort by close_time descending
    return allTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
  }
};
