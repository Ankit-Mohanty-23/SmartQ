import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Maps raw OpenWeatherMap data to the SmartQ WeatherCondition enum.
 *
 * Mapping logic based on:
 *  - Weather ID (thunderstorm, drizzle, rain, etc.)
 *  - Temperature (Celsius)
 *  - Humidity
 */
function mapToWeatherCondition(weatherId, tempCelsius, humidity) {
  if (weatherId >= 200 && weatherId <= 232) return "CYCLONE_WARNING";

  if (weatherId >= 502 && weatherId <= 531) return "HEAVY_RAIN_NORMAL";

  if (
    (weatherId >= 300 && weatherId <= 321) ||
    (weatherId >= 500 && weatherId <= 501)
  )
    return "RAINING_NORMAL";

  if (weatherId >= 600 && weatherId <= 781) {
    return tempCelsius >= 30 ? "CLOUDY_HOT" : "CLOUDY_NORMAL";
  }

  if (weatherId === 800) {
    if (tempCelsius >= 40) return "SUNNY_EXTREME_HEAT";
    if (tempCelsius >= 32) return "SUNNY_HOT";
    return "SUNNY_NORMAL";
  }

  if (weatherId >= 801 && weatherId <= 804) {
    if (humidity >= 80) return "HUMIDITY";
    return tempCelsius >= 30 ? "CLOUDY_HOT" : "CLOUDY_NORMAL";
  }

  return "UNKNOWN";
}

let _cache = null;
let _cacheExpiresAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches the current weather for the configured hospital city.
 * Results are cached for 15 minutes to avoid hitting rate limits.
 *
 * @returns {Promise<string>} A WeatherCondition enum string.
 */

export async function getCurrentWeather() {
  if (_cache && Date.now() < _cacheExpiresAt) {
    logger.info(`[WEATHER] Cache lookup | Status: HIT | Result: ${_cache}`);
    return _cache;
  }

  const apiKey = env.WEATHER_API_KEY;
  const city = env.HOSPITAL_CITY;

  if (!apiKey) {
    logger.warn(
      "[WEATHER] Configuration missing | Field: WEATHER_API_KEY | Action: Returning UNKNOWN",
    );
    return "UNKNOWN";
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenWeatherMap ${response.status}: ${body}`);
    }

    const data = await response.json();

    const weatherId = data.weather?.[0]?.id;
    const tempCelsius = data.main?.temp;
    const humidity = data.main?.humidity;

    if (weatherId == null || tempCelsius == null) {
      throw new Error("Incomplete weather response from API");
    }

    const condition = mapToWeatherCondition(weatherId, tempCelsius, humidity);

    logger.info(
      `[WEATHER] API Request | City: ${city} | Status: Success | Result: ${condition}`,
    );

    _cache = condition;
    _cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return condition;
  } catch (err) {
    if (err.name === "AbortError") {
      logger.warn(
        "[WEATHER] API Timeout | Status: UNKNOWN | Action: Falling back",
      );
    } else {
      logger.warn(
        `[WEATHER] API Request failure | Context: Fetch | Error: ${err.message}`,
      );
    }
    return "UNKNOWN";
  }
}
