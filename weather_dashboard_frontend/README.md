# Weather Dashboard (React)

A lightweight, modern weather dashboard built with React. It features a responsive UI, dark/light theme toggle, search with debouncing, loading animation, error handling, and optional caching of the last searched city using localStorage.

## Quick Start

1. Install dependencies:
   - `npm install`

2. Set environment variables:
   - Create a `.env` file in the `weather_dashboard_frontend/` root next to `package.json` and add:
     ```
     REACT_APP_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
     ```
   - If the key is not set, the UI will show a prompt and disable fetching.

3. Run the dev server:
   - `npm start`
   - App runs at http://localhost:3000

## Features

- OpenWeatherMap API integration (metric units, °C)
- Displays city, country, temperature, feels-like, description, humidity, wind speed, and weather icon
- Debounced search input; click Search to finalize immediate query
- Theme toggle (dark/light) with persistence
- Loading state animation and error/not-found messages
- Card-style layout with rounded corners, shadows, soft gradient background
- Neumorphic-style buttons
- Poppins Google Font
- Mobile-friendly responsive design
- Caches last searched city in localStorage

## Environment

- Reads API key from `REACT_APP_OPENWEATHER_API_KEY`
- Other existing variables remain untouched

## Notes

- This app talks directly to OpenWeatherMap (no backend required).
- The last searched city is stored under the `last_city` localStorage key.
