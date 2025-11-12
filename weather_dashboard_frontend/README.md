# Weather Dashboard Frontend

A modern, responsive React app to search for a city and view its current weather. Styled with the Ocean Professional theme (primary #2563EB, accent #F59E0B, error #EF4444).

## Features
- Search by city and view current temperature (°C), description, and icon
- Uses backend base URL if configured, otherwise falls back to OpenWeatherMap
- Clear error handling for unknown cities and network issues
- Accessible form controls with labels and focus styles
- Responsive layout (sidebar/top search on mobile) with a forecast placeholder

## Quick Start
1. Install dependencies:
   - `npm install`
2. Run locally:
   - `npm start`
   - Visit http://localhost:3000

## Environment configuration
The app prefers a backend base URL. If none is provided, it can call OpenWeatherMap directly if the API key is available.

- Backend base URL (preferred):
  - `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL`
  - The app will request: `${BASE_URL}/weather?city=<CITY>`
- OpenWeatherMap fallback (optional):
  - `REACT_APP_OPENWEATHER_API_KEY`
  - If no backend is set but this key exists, the app will call:
    - `https://api.openweathermap.org/data/2.5/weather?q=<CITY>&appid=<KEY>&units=metric`
- If neither is set:
  - The UI shows a setup hint. The app will not crash.

Note: Do not commit real API keys. Use a `.env` file locally.

## Usage
- Type a city and press Enter or click Search.
- If the city is found, the main card displays:
  - City name
  - Temperature in Celsius
  - Weather description
  - Icon

## Development notes
- Components:
  - `src/components/SearchBar.js`
  - `src/components/WeatherCard.js`
  - `src/components/ForecastPlaceholder.js`
- API helper:
  - `src/api/weather.js` (reads envs and handles fallback)
- Styling:
  - `src/App.css` using Ocean Professional theme tokens with smooth transitions.

## Scripts
- `npm start` — Development server
- `npm test` — Tests
- `npm run build` — Production build
