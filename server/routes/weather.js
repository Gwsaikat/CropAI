const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/weather/forecast?lat=22.57&lng=88.36
router.get('/forecast', async (req, res) => {
    try {
        const { lat = 22.57, lng = 88.36, city = 'Kolkata' } = req.query;

        // Free Open-Meteo API - no key needed
        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&current_weather=true&timezone=Asia%2FKolkata&forecast_days=7`,
            { timeout: 5000 }
        );

        const data = response.data;
        const daily = data.daily;

        const forecast = daily.time.map((date, i) => ({
            date,
            maxTemp: daily.temperature_2m_max[i],
            minTemp: daily.temperature_2m_min[i],
            precipitation: daily.precipitation_sum[i],
            windSpeed: daily.windspeed_10m_max[i],
            humidity: daily.relative_humidity_2m_max[i],
            diseaseRisk: calculateDiseaseRisk(daily.temperature_2m_max[i], daily.precipitation_sum[i], daily.relative_humidity_2m_max[i]),
        }));

        res.json({
            city,
            current: data.current_weather,
            forecast,
        });
    } catch (err) {
        // Return mock data if API fails
        res.json({
            city: req.query.city || 'Demo Location',
            current: { temperature: 28, windspeed: 12, weathercode: 2 },
            forecast: generateMockForecast(),
            mock: true,
        });
    }
});

function calculateDiseaseRisk(maxTemp, precipitation, humidity) {
    let risk = 0;
    if (humidity > 80) risk += 3;
    else if (humidity > 60) risk += 1;
    if (precipitation > 10) risk += 3;
    else if (precipitation > 2) risk += 1;
    if (maxTemp >= 20 && maxTemp <= 30) risk += 2;
    if (risk >= 6) return 'critical';
    if (risk >= 4) return 'high';
    if (risk >= 2) return 'medium';
    return 'low';
}

function generateMockForecast() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const temp = 25 + Math.random() * 10;
        const precip = Math.random() * 15;
        const humidity = 55 + Math.random() * 40;
        return {
            date: d.toISOString().split('T')[0],
            maxTemp: Math.round(temp),
            minTemp: Math.round(temp - 8),
            precipitation: Math.round(precip * 10) / 10,
            windSpeed: Math.round(8 + Math.random() * 12),
            humidity: Math.round(humidity),
            diseaseRisk: calculateDiseaseRisk(temp, precip, humidity),
        };
    });
}

module.exports = router;
