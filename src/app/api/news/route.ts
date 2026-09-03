import { NextResponse } from 'next/server';

// Simple in-memory cache to prevent 429 rate limits on the free API
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'GLOBAL'; // 'DOMESTIC' or 'GLOBAL'

    let data;
    const nowTime = Date.now();

    if (cachedData && nowTime - lastFetchTime < CACHE_TTL) {
      data = cachedData;
    } else {
      // Fetch from free, no-key ForexFactory API feed
      const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`;
      const response = await fetch(url, { next: { revalidate: 300 } }); // Next.js fetch cache fallback
      
      if (!response.ok) {
        throw new Error(`Calendar API returned ${response.status}`);
      }

      data = await response.json();
      cachedData = data;
      lastFetchTime = nowTime;
    }

    const today = new Date();

    // Filter logic
    const globalCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];
    
    const filteredData = data.filter((event: any) => {
      // 1. We no longer filter out past events on the backend, allowing the frontend to view "Yesterday" and earlier today.

      // 2. Market filter
      if (market === 'DOMESTIC') {
        return event.country === 'INR' || event.country === 'IN';
      } else {
        return globalCurrencies.includes(event.country);
      }
    }).map((event: any) => ({
      event: event.title,
      date: event.date,
      country: event.country, // e.g. USD
      currency: event.country, 
      estimate: event.forecast,
      actual: event.actual,
      previous: event.previous,
      impact: event.impact // High, Medium, Low, Non-Economic
    }));

    return NextResponse.json(filteredData);
  } catch (error: any) {
    console.error('Error fetching economic calendar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
