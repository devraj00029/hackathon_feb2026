/**
 * COSMIC WATCH RISK ANALYSIS ENGINE
 * Calculates a 0-100 risk score based on NASA data.
 */

export const calculateRisk = (asteroid) => {
    let score = 0;
    
    // 1. Is it hazardous?
    if (asteroid.is_potentially_hazardous_asteroid) score += 50;

    // 2. How close is it? (Closer = Higher Risk)
    const missDistance = parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers);
    if (missDistance < 1000000) score += 30;      // Critical
    else if (missDistance < 5000000) score += 15; // Warning
    else if (missDistance < 10000000) score += 5; // Watch

    // 3. How big is it?
    const diameter = asteroid.estimated_diameter.meters.estimated_diameter_max;
    if (diameter > 1000) score += 20;      // Global threat
    else if (diameter > 100) score += 10;  // City threat

    // 4. How fast is it?
    const velocity = parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour);
    if (velocity > 80000) score += 10;

    return Math.min(Math.round(score), 100);
};