import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'GLOBAL'; // 'DOMESTIC' or 'GLOBAL'

    // Fetch from free, no-key ForexFactory API feed
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Calendar API returned ${response.status}`);
    }

    const data = await response.json();
    const today = new Date();

    // Filter logic
    const globalCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];
    
    const filteredData = data.filter((event: any) => {
      // 1. Only upcoming events
      const eventTime = new Date(event.date).getTime();
      if (eventTime < today.getTime()) return false;

      // 2. Market filter
      if (market === 'DOMESTIC') {
        return event.country === 'INR' || event.country === 'IN';
      } else {
        return globalCurrencies.includes(event.country);
      }
    }).map((event: any) => ({
      event: event.title,
      date: event.date,
      country: event.country,
      currency: event.country, // FF provides currency in 'country'
      estimate: event.forecast,
      actual: event.previous, // we just show previous as actual isn't populated for future
      impact: event.impact
    }));

    return NextResponse.json(filteredData);
  } catch (error: any) {
    console.error('Error fetching economic calendar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
