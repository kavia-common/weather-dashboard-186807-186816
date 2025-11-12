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
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  /**
   * Build request URL memoized
   */
  const requestUrl = useMemo(() => {
    const base = 'https://api.openweathermap.org/data/2.5/weather';
    const params = new URLSearchParams({
      q: debouncedQuery || '',
      appid: API_KEY || '',
      units: 'metric',
    });
    return `${base}?${params.toString()}`;
  }, [debouncedQuery, API_KEY]);

  /**
   * Fetch weather when debounced query changes and API key exists.
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
    async function fetchWeather() {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);
        const res = await fetch(requestUrl);
        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 404) {
            setWeather(null);
            setNotFound(true);
            return;
          }
          const text = await res.text();
          throw new Error(text || `Request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setWeather({
          name: data.name,
          country: data.sys?.country,
          temp: Math.round(data.main?.temp),
          feelsLike: Math.round(data.main?.feels_like),
          description: data.weather?.[0]?.description ?? '',
          icon: data.weather?.[0]?.icon ?? '01d',
          humidity: data.main?.humidity,
          wind: Math.round(data.wind?.speed),
        });
        setNotFound(false);
        localStorage.setItem('last_city', debouncedQuery);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load weather data. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, requestUrl, API_KEY]);

  /**
   * Helper UI pieces
   */
  const gradientClass = 'bg-gradient';
  const themeEmoji = theme === 'light' ? '🌙' : '☀️';
  const themeLabel = theme === 'light' ? 'Dark Mode' : 'Light Mode';

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
