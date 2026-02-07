import { calculateRisk } from './riskEngine.js';

// YOUR REAL KEY (Hardcoded for stability during the demo)
const NASA_API_KEY = "zJyAG6IxXmIDrxabUxFs3ZG6aA6immOztDz6N2z2"; 

export const fetchAsteroids = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`📡 CONNECTING TO NASA FEED [${today}]...`);

        // 1. FETCH REAL DATA
        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`NASA API Failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ NASA Data Received:", data);

        // 2. PARSE DATA
        // NASA returns an object with dates as keys. We flatten them into one array.
        const rawAsteroids = Object.values(data.near_earth_objects).flat();

        // 3. PROCESS & SORT (High Risk First)
        return rawAsteroids.map(asteroid => {
            const risk = calculateRisk(asteroid);
            return {
                id: asteroid.id,
                name: asteroid.name,
                risk: risk,
                hazard: asteroid.is_potentially_hazardous_asteroid,
                diameter_min: asteroid.estimated_diameter.meters.estimated_diameter_min,
                diameter_max: asteroid.estimated_diameter.meters.estimated_diameter_max,
                miss_distance_km: parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers),
                velocity_kph: parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour),
                type: 'asteroid'
            };
        }).sort((a, b) => b.risk - a.risk);

    } catch (error) {
        console.error("❌ API Error:", error);
        return []; // Returns empty array so app doesn't crash
    }
};