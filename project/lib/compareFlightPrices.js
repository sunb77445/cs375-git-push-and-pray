// lib/compareFlightPrices.js

const SERPAPI_URL = "https://serpapi.com/search";


// Convert our cabin names to SerpApi's numbers:

function mapCabinClass(cabinClass) {

    const map = {
        economy: 1,
        premium: 2,
        business: 3,
        first: 4
    };

    return map[cabinClass] || 1;
}


// Convert trip type to SerpApi's numbers:
// 1 = round trip
// 2 = one way
// 3 = multi-city

function mapTripType(tripType) {

    return tripType === "roundtrip"
        ? 1
        : 2;
}


//Search Google Flights through SerpApi:


async function searchFlights(apiKey, search) {

    if (!apiKey) {

        throw new Error(
            "SERPAPI_KEY is missing from your .env file."
        );
    }

const params = new URLSearchParams({

    engine: "google_flights",

    api_key: apiKey,

    departure_id:
        search.from.trim().toUpperCase(),

    arrival_id:
        search.to.trim().toUpperCase(),

    outbound_date:
        search.depart,

    type:
        String(
            mapTripType(search.tripType)
        ),

    travel_class:
        String(
            mapCabinClass(search.cabinClass)
        ),

    adults:
        String(
            search.passengers || 1
        ),

    currency: "USD",

    gl: "us",

    hl: "en"
});


    if (
        search.tripType === "roundtrip" &&
        search.returnDate
    ) {

        params.set(
            "return_date",
            search.returnDate
        );
    }


    const url =
        `${SERPAPI_URL}?${params.toString()}`;


    console.log("\n");
    console.log("========================================");
    console.log("SERPAPI GOOGLE FLIGHTS SEARCH");
    console.log("========================================");

    console.log(
        `${search.from.toUpperCase()} → ${search.to.toUpperCase()}`
    );

    console.log(
        "Departure:",
        search.depart
    );

    console.log(
        "Return:",
        search.returnDate || "N/A"
    );

    console.log(
        "Passengers:",
        search.passengers
    );

    console.log(
        "Cabin:",
        search.cabinClass
    );

    console.log(
        "Trip type:",
        search.tripType
    );

    console.log("========================================");


    const response =
        await fetch(url);


    const responseText =
        await response.text();


    console.log(
        "SERPAPI HTTP STATUS:",
        response.status
    );


    if (!response.ok) {

        console.error(
            "SERPAPI ERROR RESPONSE:"
        );

        console.error(
            responseText
        );

        throw new Error(
            `SerpApi request failed (${response.status}): ${responseText}`
        );
    }


    let data;

    try {

        data =
            JSON.parse(responseText);

    } catch (error) {

        throw new Error(
            "SerpApi returned invalid JSON."
        );
    }


    if (data.error) {

        throw new Error(
            `SerpApi error: ${data.error}`
        );
    }


    console.log(
        "SerpApi request succeeded."
    );


    console.log(
        "Best flights:",
        data.best_flights
            ? data.best_flights.length
            : 0
    );


    console.log(
        "Other flights:",
        data.other_flights
            ? data.other_flights.length
            : 0
    );


    const allFlights = [

        ...(data.best_flights || []),

        ...(data.other_flights || [])

    ];


    console.log(
        "TOTAL FLIGHTS:",
        allFlights.length
    );


    if (allFlights.length === 0) {

        console.log(
            "No flights were returned."
        );

        return [];
    }


    const flights =
        allFlights.map(
            (flight, index) => {

                const firstLeg =
                    flight.flights?.[0];


                const lastLeg =
                    flight.flights?.[
                        flight.flights.length - 1
                    ];


                //Airline
                const airline =
                    firstLeg?.airline ||
                    "Airline unavailable";


                //Flight number
                const flightNumber =
                    firstLeg?.flight_number ||
                    "";


                //Total duration
                const durationMinutes =
                    flight.total_duration;


                let duration = "";

                if (
                    durationMinutes
                    !== undefined
                ) {

                    const hours =
                        Math.floor(
                            durationMinutes / 60
                        );

                    const minutes =
                        durationMinutes % 60;


                    duration =
                        minutes > 0
                            ? `${hours}h ${minutes}m`
                            : `${hours}h`;
                }


                // Stops
                const stops =
                    Math.max(
                        0,
                        (flight.flights?.length || 1) - 1
                    );


                const stopText =
                    stops === 0
                        ? "Nonstop"
                        : `${stops} stop${
                            stops === 1
                                ? ""
                                : "s"
                        }`;


                // Price
                const price =
                    flight.price || 0;


                // Departure time
                const departureTime =
                    firstLeg
                        ?.departure_airport
                        ?.time ||
                    "";


                // Arrival time
                const arrivalTime =
                    lastLeg
                        ?.arrival_airport
                        ?.time ||
                    "";


                // Airports
                const departureAirport =
                    firstLeg
                        ?.departure_airport
                        ?.id ||
                    search.from.toUpperCase();


                const arrivalAirport =
                    lastLeg
                        ?.arrival_airport
                        ?.id ||
                    search.to.toUpperCase();

                const bookingToken =
                    flight.booking_token ||
                    null;


                return {

                    id:
                        `flight-${index}`,

                    route:
                        `${departureAirport} → ${arrivalAirport}`,

                    airline:

                        flightNumber
                            ? `${airline} ${flightNumber}`
                            : airline,

                    meta:
                        `${airline} · ${stopText} · ${duration}`,

                    price:
                        price,

                    duration:
                        duration,

                    stops:
                        stops,

                    departureTime:
                        departureTime,

                    arrivalTime:
                        arrivalTime,

                    bookingToken:
                        bookingToken,
                    raw:
                        flight
                };
            }
        );


    console.log(
        `Converted ${flights.length} flights.`
    );


    return flights;
}


module.exports = {
    searchFlights
};