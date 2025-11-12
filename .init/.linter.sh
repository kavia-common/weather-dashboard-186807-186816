#!/bin/bash
cd /home/kavia/workspace/code-generation/weather-dashboard-186807-186816/weather_dashboard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

