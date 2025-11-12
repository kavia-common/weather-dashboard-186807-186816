import React, { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import ForecastPlaceholder from "./components/ForecastPlaceholder";
import { fetchWeather, getApiBase, getOWMApiKey } from "./api/weather";

// PUBLIC_INTERFACE
function App() {
  // Theme support (kept minimal; default light)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // State for weather fetching
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [firstLoad, setFirstLoad] = useState(true);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleSearch = async (q) => {
    setFirstLoad(false);
    setError(null);
    setWeather(null);
    if (!q || !q.trim()) {
      setError("Please enter a city name.");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWeather(q);
      setWeather(data);
    } catch (err) {
      setError(err?.message || "Failed to fetch weather.");
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = getApiBase();
  const owmKey = getOWMApiKey();

  return (
    <div className="App ocean-bg">
      <header className="ocean-header">
        <div className="container">
          <h1 className="app-title">Weather Dashboard</h1>
          <button
            className="theme-toggle btn-ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="container responsive-layout">
          <aside className="sidebar">
            <div className="panel surface shadow">
              <h2 className="panel-title">Search City</h2>
              <SearchBar onSearch={handleSearch} disabled={loading} />
              {!baseUrl && !owmKey ? (
                <div className="alert info" role="status">
                  No API configured. Set REACT_APP_API_BASE or
                  REACT_APP_BACKEND_URL to use a backend like
                  /weather?city=, or set REACT_APP_OPENWEATHER_API_KEY to call
                  OpenWeatherMap directly. The app will remain usable once one
                  of these is provided.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="content">
            <div className="panel surface shadow">
              {loading ? (
                <div className="loader" role="status" aria-live="polite">
                  Searching weather…
                </div>
              ) : error ? (
                <div className="alert error" role="alert">
                  {error}
                </div>
              ) : weather ? (
                <WeatherCard
                  name={weather.name}
                  tempC={weather.tempC}
                  description={weather.description}
                  iconUrl={weather.iconUrl}
                />
              ) : (
                <div className="placeholder" role="note">
                  {firstLoad
                    ? "Type a city and press Enter or click Search to see current weather."
                    : "No results yet. Try searching another city."}
                </div>
              )}
            </div>

            <ForecastPlaceholder />
          </section>
        </div>
      </main>

      <footer className="footer container">
        <p className="muted small">
          Data via configured backend
          {baseUrl ? ` (${baseUrl})` : owmKey ? " or OpenWeatherMap" : ""}. UI
          theme: Ocean Professional.
        </p>
      </footer>
    </div>
  );
}

export default App;
