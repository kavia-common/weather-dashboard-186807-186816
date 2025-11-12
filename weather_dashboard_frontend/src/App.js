import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Weather types mapping for icons. Using OpenWeather icon set.
 */
const iconUrl = (iconCode) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

/**
 * Simple debounce hook for search input to reduce API calls.
 */
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Derive a simple 5-day forecast from OpenWeather "5 day / 3 hour" list.
 * We aggregate by day:
 * - min/max temperature over the day
 * - pick a representative "midday" item (12:00 or closest) to choose icon/description
 */
function buildFiveDayForecast(list = []) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const byDay = new Map();
  list.forEach((item) => {
    const date = new Date((item.dt ?? 0) * 1000);
    // Group by YYYY-MM-DD in the local timezone of the user
    const key = date.toISOString().slice(0, 10);
    const arr = byDay.get(key) || [];
    arr.push(item);
    byDay.set(key, arr);
  });

  const days = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, items]) => {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      let representative = null;
      let repDiff = Number.POSITIVE_INFINITY;

      items.forEach((it) => {
        const t = it.main?.temp;
        const tmin = it.main?.temp_min;
        const tmax = it.main?.temp_max;
        if (typeof tmin === 'number') min = Math.min(min, tmin);
        if (typeof tmax === 'number') max = Math.max(max, tmax);
        // choose an item closest to 12:00 local time for icon/description
        const d = new Date((it.dt ?? 0) * 1000);
        const diff = Math.abs(d.getHours() - 12); // 12 noon anchor
        if (diff < repDiff) {
          repDiff = diff;
          representative = it;
        }
      });

      // fallback in case no mins/maxes were set (shouldn't happen)
      if (!isFinite(min) || !isFinite(max)) {
        const temps = items
          .map((it) => it.main?.temp)
          .filter((n) => typeof n === 'number');
        if (temps.length) {
          min = Math.min(...temps);
          max = Math.max(...temps);
        } else {
          min = 0;
          max = 0;
        }
      }

      const repWeather = representative?.weather?.[0];
      const icon = repWeather?.icon ?? '01d';
      const description = repWeather?.description ?? '';

      return {
        key,
        date: new Date(key),
        min: Math.round(min),
        max: Math.round(max),
        icon,
        description,
      };
    });

  // Return next 5 days (some APIs include partial current day; we keep first 5)
  return days.slice(0, 5);
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Theme handling (light/dark) with persistence.
   */
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Search + caching of last city.
   */
  const [query, setQuery] = useState(() => localStorage.getItem('last_city') || 'London');
  const debouncedQuery = useDebounce(query, 600);

  /**
   * API and state
   */
  const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]); // 5-day forecast cards
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  /**
   * Build request URLs memoized
   */
  const weatherUrl = useMemo(() => {
    const base = 'https://api.openweathermap.org/data/2.5/weather';
    const params = new URLSearchParams({
      q: debouncedQuery || '',
      appid: API_KEY || '',
      units: 'metric',
    });
    return `${base}?${params.toString()}`;
  }, [debouncedQuery, API_KEY]);

  const forecastUrl = useMemo(() => {
    const base = 'https://api.openweathermap.org/data/2.5/forecast';
    const params = new URLSearchParams({
      q: debouncedQuery || '',
      appid: API_KEY || '',
      units: 'metric',
    });
    return `${base}?${params.toString()}`;
  }, [debouncedQuery, API_KEY]);

  /**
   * Fetch current weather and forecast when debounced query changes.
   * We keep existing loading/error/404 behavior and reuse the same states.
   */
  useEffect(() => {
    if (!API_KEY) {
      setError('Missing API key. Please set REACT_APP_OPENWEATHER_API_KEY in environment.');
      return;
    }
    if (!debouncedQuery || debouncedQuery.trim() === '') {
      return;
    }

    let cancelled = false;
    async function fetchAll() {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);

        // Fetch both endpoints in parallel for responsiveness
        const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
        if (cancelled) return;

        // Handle current weather errors first (this gates the UI)
        if (!wRes.ok) {
          if (wRes.status === 404) {
            setWeather(null);
            setForecast([]);
            setNotFound(true);
            return;
          }
          const text = await wRes.text();
          throw new Error(text || `Weather request failed with status ${wRes.status}`);
        }

        // Forecast can fail independently; we will still show current weather
        let fJson = null;
        if (fRes.ok) {
          fJson = await fRes.json();
        }

        const wJson = await wRes.json();
        if (cancelled) return;

        setWeather({
          name: wJson.name,
          country: wJson.sys?.country,
          temp: Math.round(wJson.main?.temp),
          feelsLike: Math.round(wJson.main?.feels_like),
          description: wJson.weather?.[0]?.description ?? '',
          icon: wJson.weather?.[0]?.icon ?? '01d',
          humidity: wJson.main?.humidity,
          wind: Math.round(wJson.wind?.speed),
        });
        setNotFound(false);
        localStorage.setItem('last_city', debouncedQuery);

        // Build forecast only if forecast data is present
        if (fJson?.list?.length) {
          setForecast(buildFiveDayForecast(fJson.list));
        } else {
          setForecast([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load weather data. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, weatherUrl, forecastUrl, API_KEY]);

  /**
   * Helper UI pieces
   */
  const gradientClass = 'bg-gradient';
  const themeEmoji = theme === 'light' ? '🌙' : '☀️';
  const themeLabel = theme === 'light' ? 'Dark Mode' : 'Light Mode';

  // PUBLIC_INTERFACE
  function formatDayLabel(dateObj) {
    /** Returns short, readable day label for forecast cards */
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);
    } catch {
      return dateObj.toDateString();
    }
  }

  return (
    <div className={`App ${gradientClass}`}>
      {/* Header */}
      <header className="wd-header">
        <div className="brand">
          <span className="brand-icon">🌦️</span>
          <h1 className="title">Weather Dashboard</h1>
        </div>

        <button
          className="btn btn-neumorphic theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={themeLabel}
        >
          {themeEmoji} {themeLabel}
        </button>
      </header>

      {/* Search */}
      <main className="container">
        {!API_KEY && (
          <div className="notice-card" role="alert" aria-live="polite">
            <h2>API key required</h2>
            <p>
              Please set the environment variable REACT_APP_OPENWEATHER_API_KEY, then restart the app.
            </p>
            <p className="small">
              This key is used only in the browser to query the OpenWeatherMap API.
            </p>
          </div>
        )}

        <div className="search-row">
          <input
            type="text"
            className="input input-lg"
            placeholder="Search city (e.g., London, Paris, New York)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search city"
          />
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setQuery((q) => q.trim())}
            disabled={!query || loading}
          >
            🔎 Search
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loader" role="status" aria-live="polite">
            <div className="spinner" />
            <span>Fetching latest weather...</span>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div className="notice-card error" role="alert" aria-live="assertive">
            <h3>City not found</h3>
            <p>Please check the spelling and try another location.</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="notice-card error" role="alert" aria-live="assertive">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Weather Card */}
        {weather && !loading && !notFound && (
          <>
            <section className="weather-card" aria-live="polite">
              <div className="card-header">
                <div className="location">
                  <h2>
                    {weather.name}
                    {weather.country ? `, ${weather.country}` : ''}
                  </h2>
                  <p className="description">{weather.description}</p>
                </div>
                <div className="icon-wrap">
                  <img
                    src={iconUrl(weather.icon)}
                    alt={weather.description}
                    className="weather-icon"
                  />
                </div>
              </div>

              <div className="card-body">
                <div className="metric">
                  <div className="metric-value">
                    {weather.temp}
                    <span className="unit">°C</span>
                  </div>
                  <div className="metric-label">Temperature</div>
                </div>

                <div className="metric">
                  <div className="metric-value">
                    {weather.feelsLike}
                    <span className="unit">°C</span>
                  </div>
                  <div className="metric-label">Feels like</div>
                </div>

                <div className="metric">
                  <div className="metric-value">
                    {weather.humidity}
                    <span className="unit">%</span>
                  </div>
                  <div className="metric-label">Humidity</div>
                </div>

                <div className="metric">
                  <div className="metric-value">
                    {weather.wind}
                    <span className="unit"> m/s</span>
                  </div>
                  <div className="metric-label">Wind</div>
                </div>
              </div>
            </section>

            {/* 5-Day Forecast */}
            {forecast.length > 0 && (
              <section
                className="forecast"
                aria-label="5 day forecast"
                aria-live="polite"
              >
                <h3 className="forecast-title">5-Day Forecast</h3>
                <div
                  className="forecast-grid"
                  role="list"
                  aria-label="Forecast cards"
                >
                  {forecast.map((d, idx) => (
                    <article
                      key={d.key || idx}
                      role="listitem"
                      className="forecast-card"
                      tabIndex={0}
                      aria-label={`${formatDayLabel(d.date)}: ${d.description}, min ${d.min}°C, max ${d.max}°C`}
                    >
                      <div className="forecast-date">{formatDayLabel(d.date)}</div>
                      <img
                        className="forecast-icon"
                        src={iconUrl(d.icon)}
                        alt={d.description}
                        width={64}
                        height={64}
                      />
                      <div className="forecast-temps" aria-label={`Temperatures for ${formatDayLabel(d.date)}`}>
                        <span className="t-max" title="Max temperature">
                          {d.max}°C
                        </span>
                        <span className="t-min" title="Min temperature">
                          {d.min}°C
                        </span>
                      </div>
                      <div className="forecast-desc">{d.description}</div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer help */}
        <footer className="footer">
          <p className="small">
            Data by OpenWeatherMap • Last searched city is cached locally for convenience.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
