// lib/compareFlightPrices.js
//
// Wrapper around the "Compare Flight Prices" API on RapidAPI:
// https://rapidapi.com/obryan-software-obryan-software-default/api/compare-flight-prices
//
// Confirmed from the RapidAPI "Code Snippets" panel on 2026-08-15:
//   Host: compare-flight-prices.p.rapidapi.com
//   1. GET /GetPricesAPI/StartFlightSearch.aspx -> kicks off a live search
//   2. GET /GetPricesAPI/GetPrices.aspx         -> poll for results
//
// StartFlightSearch params (confirmed via RapidAPI example request):
//   city1, city2, date1, date2 (format: YYYY-MM-DD),
//   adults, seniors, youth, child, infant, lapinfant,
//   flightType, cabin, islive
//
// TODO: GetPrices only takes 1 param per the RapidAPI "Params(1)" tab,
// almost certainly the ID returned by StartFlightSearch, but we haven't
// confirmed its exact name yet (guessing "SearchID" below). Check the
// GetPrices Params tab + StartFlightSearch's actual JSON response and
// fix getPrices() below if this guess is wrong.

const RAPIDAPI_HOST = "compare-flight-prices.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8; // ~16s of polling before we give up

function mapCabinClass(cabinClass) {
    const map = { economy: 1, business: 2, first: 3, premium: 5 };
    return map[cabinClass] ?? 1;
}

function mapFlightType(tripType) {
    return tripType === "roundtrip" ? 2 : 1;
}

function headers(apiKey) {
    return {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
        "Content-Type": "application/json"
    };
}

async function startFlightSearch(apiKey, search) {
    const params = new URLSearchParams({
        city1: search.from,
        city2: search.to,
        date1: search.depart,                       // already YYYY-MM-DD from the <input type="date">
        date2: search.returnDate || search.depart,   // API seems to require date2 even for one-way; reuse date1 if empty
        adults: String(search.passengers || 1),
        seniors: "0",
        youth: "0",
        child: "0",
        infant: "0",
        lapinfant: "0",
        flightType: String(mapFlightType(search.tripType)),
        cabin: String(mapCabinClass(search.cabinClass)),
        islive: "false"
    });

    const url = `${BASE_URL}/GetPricesAPI/StartFlightSearch.aspx?${params.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: headers(apiKey)
    });

    if (!response.ok) {
        throw new Error(`StartFlightSearch failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    // TODO: confirm this field name against the real response (log below helps).
    const searchId = data.SearchID || data.searchId || data.searchID || data.SearchId;

    if (!searchId) {
        console.warn("StartFlightSearch response (couldn't find a SearchID field):", data);
        throw new Error("No SearchID returned from StartFlightSearch");
    }

    return searchId;
}

async function getPrices(apiKey, searchId) {
    // TODO: confirm the single param name GetPrices expects (see Params(1) tab).
    const url = `${BASE_URL}/GetPricesAPI/GetPrices.aspx?SearchID=${encodeURIComponent(searchId)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: headers(apiKey)
    });

    if (!response.ok) {
        throw new Error(`GetPrices failed: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

// Normalizes whatever the API gives us into the shape flights.html expects:
// { route, meta, price }
function mapResultsToFlights(raw, from, to) {
    const results = raw.Results || raw.results || raw.Flights || raw.flights || [];

    if (!Array.isArray(results) || results.length === 0) {
        console.warn("GetPrices returned no recognizable results array. Raw payload:", raw);
        return [];
    }

    return results.map((item) => {
        const price = item.Price ?? item.price ?? item.TotalPrice ?? item.total_price;
        const site = item.Site ?? item.site ?? item.Source ?? item.source;
        const airline = item.Airline ?? item.airline ?? "";
        const stops = item.Stops ?? item.stops;
        const duration = item.Duration ?? item.duration;

        const metaParts = [];
        if (site) metaParts.push(site);
        if (airline) metaParts.push(airline);
        if (stops !== undefined) metaParts.push(`${stops} stop${stops === 1 ? "" : "s"}`);
        if (duration) metaParts.push(duration);

        return {
            route: `${from} → ${to}`,
            meta: metaParts.join(" · ") || "Details unavailable",
            price: Number(price) || 0
        };
    });
}

// Polls GetPrices a few times since it's a live, asynchronous search.
async function pollForResults(apiKey, searchId, from, to) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const raw = await getPrices(apiKey, searchId);

        const stillSearching = raw.Complete === false || raw.complete === false || raw.Status === "pending";
        const flights = mapResultsToFlights(raw, from, to);

        if (flights.length > 0) {
            return flights;
        }
        if (!stillSearching && flights.length === 0) {
            // Search says it's done but returned nothing -- no point polling more.
            return [];
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    return []; // gave up -- caller decides how to handle an empty result
}

async function searchFlights(apiKey, search) {
    const searchId = await startFlightSearch(apiKey, search);
    return pollForResults(apiKey, searchId, search.from, search.to);
}

module.exports = { searchFlights };
