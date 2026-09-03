"use client";

import { useUiStore } from "@/store/useUiStore";
import MarketSwitcher from "@/components/layout/MarketSwitcher";
import React, { useState, useEffect } from "react";


const CustomEconomicNews = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [dateFilter, setDateFilter] = useState("Today");
  const [showFilters, setShowFilters] = useState(false);
  const [timeMode, setTimeMode] = useState<"absolute"|"remaining">("remaining");
  const [impacts, setImpacts] = useState<string[]>(["High", "Medium", "Low", "Non-Economic"]);

  const { activeWorkspace } = useUiStore();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/news?market=${activeWorkspace}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load news");
        }
        
        setNews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [activeWorkspace]);

  const getImpactIcon = (impact: string) => {
    const imp = String(impact || "").toLowerCase().trim();
    if (imp.includes("high") || imp === "3") return <span className="text-red-500 text-lg tracking-widest">★★★</span>;
    if (imp.includes("medium") || imp === "2") return <span className="text-yellow-500 text-lg tracking-widest">★★<span className="text-gray-300 dark:text-gray-600">★</span></span>;
    if (imp.includes("low") || imp === "1") return <span className="text-emerald-500 text-lg tracking-widest">★<span className="text-gray-300 dark:text-gray-600">★★</span></span>;
    return <span className="text-gray-300 dark:text-gray-600 text-lg tracking-widest">-</span>;
  };

  const getCountryFlag = (country: string) => {
    const map: Record<string, string> = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 
      'AUD': '🇦🇺', 'CAD': '🇨🇦', 'CHF': '🇨🇭', 'NZD': '🇳🇿', 
      'CNY': '🇨🇳', 'INR': '🇮🇳', 'IN': '🇮🇳'
    };
    return map[country] || '🌐';
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    
    if (timeMode === "remaining" && d > now && d.toDateString() === now.toDateString()) {
      const diffMins = Math.floor((d.getTime() - now.getTime()) / 60000);
      if (diffMins < 60) return `${diffMins}m`;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hrs}h ${mins}m`;
    }
    
    // If it's today, return HH:mm
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // Else return Short Month + Date
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const filteredNews = news.filter((n) => {
    if (!impacts.includes(n.impact)) return false;

    const d = new Date(n.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const eventDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    switch (dateFilter) {
      case "Yesterday": return eventDate.getTime() === yesterday.getTime();
      case "Today": return eventDate.getTime() === today.getTime();
      case "Tomorrow": return eventDate.getTime() === tomorrow.getTime();
      case "This Week": return eventDate >= startOfWeek && eventDate <= endOfWeek;
      case "Next Week": 
        const startNextWeek = new Date(endOfWeek); startNextWeek.setDate(endOfWeek.getDate() + 1);
        const endNextWeek = new Date(startNextWeek); endNextWeek.setDate(startNextWeek.getDate() + 6);
        return eventDate >= startNextWeek && eventDate <= endNextWeek;
      default: return true;
    }
  });

  // Calculate where the current time line should be inserted (only for views containing today)
  let markerIndex = -1;
  if (dateFilter === "Today" || dateFilter === "This Week") {
    const now = new Date();
    markerIndex = filteredNews.findIndex((n) => new Date(n.date) > now);
    if (markerIndex === -1 && filteredNews.length > 0 && new Date(filteredNews[filteredNews.length-1].date) < now) {
      markerIndex = filteredNews.length; // all events are in the past
    }
  }

  if (loading) {
    return <div className="w-full h-[300px] rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111318] flex items-center justify-center mt-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 mt-6 p-6 text-center">
      <p className="text-red-400 font-bold mb-2">Could not load economic calendar</p>
      <p className="text-sm text-secondary">{error}</p>
      <p className="text-xs text-muted mt-4">Please try refreshing the page in a few minutes if rate limits apply.</p>
    </div>;
  }


  return (
    <div className="w-full mt-6 space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            {["Yesterday", "Today", "Tomorrow", "This Week", "Next Week"].map(filter => (
              <button 
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === filter 
                    ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-500 text-blue-600 dark:text-blue-400" 
                    : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
            <button className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors opacity-50 cursor-not-allowed">
              <i className="las la-calendar"></i> Custom dates
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-white/10 text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative"
          >
            Show Filters <i className={`las la-angle-down transition-transform ${showFilters ? 'rotate-180' : ''}`}></i>
          </button>
        </div>
        
        {/* Filters Dropdown Panel */}
        {showFilters && (
          <div className="w-full bg-white dark:bg-[#111318] border border-gray-200 dark:border-white/10 rounded-lg p-4 flex flex-wrap gap-6 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">Category <i className="las la-info-circle text-secondary"></i></label>
              <select disabled className="px-3 py-2 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-sm text-muted w-[200px] cursor-not-allowed">
                <option>All Categories</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Importance</label>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-black px-4 py-2 rounded-md border border-gray-200 dark:border-white/10">
                {["High", "Medium", "Low"].map(imp => (
                  <label key={imp} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" 
                      checked={impacts.includes(imp)}
                      onChange={(e) => {
                        if (e.target.checked) setImpacts([...impacts, imp]);
                        else setImpacts(impacts.filter(i => i !== imp));
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">{imp}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        

      </div>

      {/* Table Section */}
      <div className="w-full rounded-2xl bg-white dark:bg-[#111318] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-900 dark:text-white font-bold text-[13px] border-b border-gray-200 dark:border-white/5">
                <th className="px-4 py-4 w-24">Time</th>
                <th className="px-4 py-4 w-24">Cur.</th>
                <th className="px-4 py-4">Event</th>
                <th className="px-4 py-4 w-32">Imp.</th>
                <th className="px-4 py-4 w-28">Actual</th>
                <th className="px-4 py-4 w-28">Forecast</th>
                <th className="px-4 py-4 w-28">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredNews.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="w-full mt-2 p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                      <i className="las la-globe-asia text-3xl text-blue-500"></i>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Events Found</p>
                    <p className="text-sm text-muted dark:text-secondary max-w-sm">
                      {activeWorkspace === "DOMESTIC" 
                        ? "There are currently no major macroeconomic events scheduled for the Indian market this week." 
                        : "There are no major global macroeconomic events that match your filters."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredNews.map((n, i) => (
              <React.Fragment key={i}>
                {i === markerIndex && (
                  <tr>
                    <td colSpan={7} className="p-0 relative">
                      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-blue-500 -translate-y-1/2 z-0"></div>
                      <div className="relative z-10 w-max px-2 py-0.5 ml-4 text-[10px] font-bold text-blue-500 bg-white dark:bg-[#111318] border border-blue-500 rounded">
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 font-medium text-gray-600 dark:text-secondary w-24">
                    {formatTime(n.date)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 w-24 flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(n.country)}</span>
                    <span>{n.currency}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[300px] truncate" title={n.event}>
                    {n.event}
                  </td>
                  <td className="px-4 py-3 w-32">
                    {getImpactIcon(n.impact)}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white w-28">
                    {n.actual || ""}
                  </td>
                  <td className="px-4 py-3 text-muted dark:text-secondary w-28">
                    {n.estimate || ""}
                  </td>
                  <td className="px-4 py-3 text-muted dark:text-secondary w-28">
                    {n.previous || ""}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-globe text-3xl text-blue-500"></i>
            {isDomestic ? 'Indian' : 'Global'} Economic Calendar
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-secondary text-sm">Live macroeconomic data, filtered by impact and currency.</p>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
              <i className="las la-unlock"></i> Free for everyone
            </span>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <MarketSwitcher />
        </div>
      </div>
      
      {/* Custom Economic News API Component */}
      <CustomEconomicNews />
    </div>
  );
}
