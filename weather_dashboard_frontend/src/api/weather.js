//
// API utilities for fetching weather data.
// Reads environment variables to determine backend or fallback to OpenWeatherMap.
//
/**
 * PUBLIC_INTERFACE
 * getApiBase
 * Determine the API base URL from environment variables.
 * Returns string or null if not configured.
 */
export function getApiBase() {
  const base =
    process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  const trimmed = (base || "").trim();
  return trimmed.length ? trimmed.replace(/\/+$/, "") : null;
}

/**
 * PUBLIC_INTERFACE
 * getOWMApiKey
 * Returns the OpenWeatherMap API key from env if present, otherwise null.
 */
export function getOWMApiKey() {
  const key = process.env.REACT_APP_OPENWEATHER_API_KEY;
  return key && key.trim().length ? key.trim() : null;
}

/**
 * PUBLIC_INTERFACE
 * fetchWeather
 * Fetch current weather by city.
 * - Prefer `${baseUrl}/weather?city=${city}` if REACT_APP_API_BASE or REACT_APP_BACKEND_URL exists.
 * - Fallback to OpenWeatherMap if REACT_APP_OPENWEATHER_API_KEY exists.
 * - Throws an error object with { code, message } for UI handling.
 *
 * @param {string} city
 * @returns {Promise<{ name: string, tempC: number, description: string, iconUrl: string }>}
 */
export async function fetchWeather(city) {
  if (!city || !city.trim()) {
    throw { code: "EMPTY_QUERY", message: "Please enter a city name." };
  }

  const baseUrl = getApiBase();
  const encodedCity = encodeURIComponent(city.trim());

  try {
    if (baseUrl) {
      // Use configured backend
      const url = `${baseUrl}/weather?city=${encodedCity}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        if (res.status === 404) {
          throw { code: "NOT_FOUND", message: `City "${city}" not found.` };
        }
        throw {
          code: "BACKEND_ERROR",
          message: `Request failed with status ${res.status}`,
        };
      }
      const data = await res.json();
      // Expecting backend to provide name, tempC (or temp), description, icon (url or code)
      const name = data.name || data.city || city;
      const tempC =
        typeof data.tempC === "number"
          ? data.tempC
          : typeof data.temp === "number"
          ? data.temp
          : data?.main?.temp ?? null;
      const description =
        data.description ||
        data.weather?.description ||
        data.weather?.[0]?.description ||
        "";
      let iconUrl = "";
      if (data.icon?.startsWith?.("http")) {
        iconUrl = data.icon;
      } else if (data.icon) {
        // If backend provides OWM icon code, map to OWM CDN
        iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
      } else if (data.weather?.[0]?.icon) {
        iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      }

      if (tempC == null) {
        throw {
          code: "PARSE_ERROR",
          message: "Could not parse temperature from backend response.",
        };
      }

      return {
        name,
        tempC: Number(tempC),
        description,
        iconUrl,
      };
    }

    // Fallback to OpenWeatherMap if API key available
    const apiKey = getOWMApiKey();
    if (!apiKey) {
      throw {
        code: "NO_CONFIG",
        message:
          "No backend base URL configured and no OpenWeatherMap API key found.",
      };
    }

    const owmUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric`;
    const res = await fetch(owmUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      if (res.status === 404) {
        throw { code: "NOT_FOUND", message: `City "${city}" not found.` };
      }
      throw {
        code: "OWM_ERROR",
        message: `OpenWeatherMap request failed with status ${res.status}`,
      };
    }
    const data = await res.json();
    const name = data.name || city;
    const tempC = data.main?.temp;
    const description = data.weather?.[0]?.description || "";
    const icon = data.weather?.[0]?.icon || "";
    const iconUrl = icon
      ? `https://openweathermap.org/img/wn/${icon}@2x.png`
      : "";

    if (tempC == null) {
      throw {
        code: "PARSE_ERROR",
        message: "Could not parse temperature from OpenWeatherMap response.",
      };
    }

    return {
      name,
      tempC: Number(tempC),
      description,
      iconUrl,
    };
  } catch (err) {
    if (err?.code) throw err;
    throw {
      code: "NETWORK_ERROR",
      message:
        err?.message || "Network error occurred while fetching weather data.",
    };
  }
}
