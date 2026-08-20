//+------------------------------------------------------------------+
//|                                                   TradeSync.mq5  |
//|                                        TradinJournal Webhook EA  |
//+------------------------------------------------------------------+
#property copyright "TradinJournal"
#property link      "https://tradinjournal.com"
#property version   "1.00"
#property description "Syncs closed trades and balance to the web dashboard"

//--- Inputs
input string   InpWebhookURL = "http://localhost:3000/api/mt5-webhook"; // Next.js Webhook URL
input string   InpAccountID  = "YOUR_FIRESTORE_ACCOUNT_ID";             // Account ID from Dashboard
input string   InpSecretKey  = "TRADIN_JOURNAL_SECRET_123";             // Webhook Secret Key
input int      InpSyncTimer  = 60;                                      // Sync interval (Seconds)

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   // Validate inputs
   if(InpAccountID == "YOUR_FIRESTORE_ACCOUNT_ID" || InpAccountID == "")
     {
      Print("Error: Please enter your Firestore Account ID in EA settings.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   // Ensure WebRequest is allowed
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
      Print("Warning: Auto-trading disabled. WebRequest might still work if allowed.");
      
   Print("TradeSync EA Initialized. Syncing every ", InpSyncTimer, " seconds.");
   
   // Create a timer to sync automatically
   EventSetTimer(InpSyncTimer);
   
   // Sync immediately on startup
   SyncData();
   
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   Print("TradeSync EA Stopped.");
  }

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
  {
   SyncData();
  }

//+------------------------------------------------------------------+
//| Custom Function to Sync Data to Webhook                          |
//+------------------------------------------------------------------+
void SyncData()
  {
   Print("Starting data sync...");
   
   // 1. Get Account Info
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   
   // 2. Fetch recent trade history (Last 7 days to prevent heavy payload)
   datetime endTime = TimeCurrent();
   datetime startTime = endTime - (7 * 24 * 60 * 60); 
   
   if(!HistorySelect(startTime, endTime))
     {
      Print("Failed to load history.");
      return;
     }
     
   int totalDeals = HistoryDealsTotal();
   string tradesJson = "[";
   int addedTrades = 0;
   
   for(int i = 0; i < totalDeals; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
        {
         // We only care about closed deals (Out) that realize profit/loss
         long entryType = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entryType == DEAL_ENTRY_OUT || entryType == DEAL_ENTRY_INOUT)
           {
            long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
            // Only Buy (0) and Sell (1)
            if(type == DEAL_TYPE_BUY || type == DEAL_TYPE_SELL)
              {
               string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
               double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
               double price  = HistoryDealGetDouble(ticket, DEAL_PRICE);
               double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
               double comm   = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
               double swap   = HistoryDealGetDouble(ticket, DEAL_SWAP);
               long time     = HistoryDealGetInteger(ticket, DEAL_TIME);
               
               // Convert Unix timestamp to ISO string roughly (simplification for JSON)
               // Webhook can handle unix, but we'll send milliseconds string
               string timeStr = IntegerToString(time * 1000); 
               
               // Add comma if not first
               if(addedTrades > 0) tradesJson += ",";
               
               // Build JSON object for trade
               tradesJson += "{";
               tradesJson += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
               tradesJson += "\"symbol\":\"" + symbol + "\",";
               tradesJson += "\"type\":" + IntegerToString(type) + ",";
               tradesJson += "\"volume\":" + DoubleToString(volume, 2) + ",";
               tradesJson += "\"price_close\":" + DoubleToString(price, 5) + ",";
               tradesJson += "\"price_open\":" + DoubleToString(price, 5) + ","; // Simplified open/close mapping
               tradesJson += "\"time_close\":\"" + timeStr + "\",";
               tradesJson += "\"time_open\":\"" + timeStr + "\",";
               tradesJson += "\"profit\":" + DoubleToString(profit, 2) + ",";
               tradesJson += "\"commission\":" + DoubleToString(comm, 2) + ",";
               tradesJson += "\"swap\":" + DoubleToString(swap, 2);
               tradesJson += "}";
               
               addedTrades++;
              }
           }
        }
     }
     
   tradesJson += "]";
   
   // 3. Build Final Payload
   string payload = "{";
   payload += "\"account_id\":\"" + InpAccountID + "\",";
   payload += "\"balance\":" + DoubleToString(balance, 2) + ",";
   payload += "\"equity\":" + DoubleToString(equity, 2) + ",";
   payload += "\"trades\":" + tradesJson;
   payload += "}";
   
   // 4. Send WebRequest
   char postData[];
   char result[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   
   // Trim the null terminator that StringToCharArray adds
   ArrayResize(postData, ArraySize(postData)-1);
   
   string headers = "Content-Type: application/json\r\n";
   headers += "X-API-KEY: " + InpSecretKey + "\r\n";
   
   int res = WebRequest("POST", InpWebhookURL, headers, 5000, postData, result, resultHeaders);
   
   if(res == 200)
     {
      Print("Sync Successful! Synced ", addedTrades, " trades.");
     }
   else
     {
      Print("Sync Failed. Error Code: ", GetLastError(), " | HTTP Status: ", res);
      // Helpful tip for users
      if(GetLastError() == 4014) {
         Print("IMPORTANT: You must allow WebRequests for '", InpWebhookURL, "' in MT5 (Tools -> Options -> Expert Advisors).");
      }
     }
  }
//+------------------------------------------------------------------+
