const RECENT_SPOTS_KEY = 'wanderlens:recent-spots';
const WEATHER_TIMEOUT_MS = 10000;

const weatherCodes = [
    { codes: [0], label: 'Clear sky', icon: 'fa-sun' },
    { codes: [1, 2], label: 'Mostly clear', icon: 'fa-cloud-sun' },
    { codes: [3], label: 'Overcast', icon: 'fa-cloud' },
    { codes: [45, 48], label: 'Fog', icon: 'fa-smog' },
    { codes: [51, 53, 55, 56, 57], label: 'Drizzle', icon: 'fa-cloud-rain' },
    { codes: [61, 63, 65, 66, 67], label: 'Rain', icon: 'fa-cloud-showers-heavy' },
    { codes: [71, 73, 75, 77, 85, 86], label: 'Snow', icon: 'fa-snowflake' },
    { codes: [80, 81, 82], label: 'Rain showers', icon: 'fa-cloud-showers-heavy' },
    { codes: [95, 96, 99], label: 'Thunderstorm', icon: 'fa-bolt' }
];

function describeWeather(code) {
    const found = weatherCodes.find((entry) => entry.codes.includes(code));
    return found || { label: 'Unknown', icon: 'fa-circle-question' };
}

class WeatherService {
    constructor(baseUrl, timeoutMs) {
        this.baseUrl = baseUrl;
        this.timeoutMs = timeoutMs;
    }

    buildUrl(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
            timezone: 'auto',
            forecast_days: 5
        });
        return this.baseUrl + '?' + params.toString();
    }

    async getForecast(lat, lon) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(this.buildUrl(lat, lon), { signal: controller.signal });
            if (!response.ok) { throw new Error('Weather service answered with status ' + response.status + '.'); }
            const json = await response.json();
            return this.normalize(json);
        } catch (error) {
            if (error.name === 'AbortError') { throw new Error('The weather service took too long to respond.'); }
            if (error instanceof TypeError) { throw new Error('Network problem. Check your internet connection.'); }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    normalize(json) {
        if (!json || !json.current || !json.daily || !Array.isArray(json.daily.time)) { return null; }
        const daily = json.daily.time.map((date, i) => ({
            date: date,
            code: json.daily.weather_code[i],
            max: json.daily.temperature_2m_max[i],
            min: json.daily.temperature_2m_min[i],
            rain: json.daily.precipitation_probability_max[i]
        }));
        if (daily.length === 0) { return null; }
        return {
            current: {
                temp: json.current.temperature_2m,
                humidity: json.current.relative_humidity_2m,
                wind: json.current.wind_speed_10m,
                code: json.current.weather_code
            },
            daily: daily
        };
    }
}

const weatherService = new WeatherService('https://api.open-meteo.com/v1/forecast', WEATHER_TIMEOUT_MS);

function formatDay(isoDate) {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function createStat(iconClass, text) {
    const wrap = document.createElement('div');
    wrap.className = 'd-flex align-items-center gap-2';
    const icon = document.createElement('i');
    icon.className = 'fa-solid ' + iconClass + ' text-brand';
    const label = document.createElement('span');
    label.textContent = text;
    wrap.appendChild(icon);
    wrap.appendChild(label);
    return wrap;
}

function createCurrentCard(spot, current) {
    const info = describeWeather(current.code);
    const card = document.createElement('div');
    card.className = 'wl-card p-4 h-100';
    const title = document.createElement('h2');
    title.className = 'h4 font-serif-custom mb-3';
    title.textContent = spot.name;
    const main = document.createElement('div');
    main.className = 'd-flex align-items-center gap-3 mb-3';
    const icon = document.createElement('i');
    icon.className = 'fa-solid ' + info.icon + ' weather-icon text-brand';
    const temp = document.createElement('div');
    temp.className = 'price';
    temp.textContent = Math.round(current.temp) + '°C';
    const label = document.createElement('div');
    label.className = 'text-muted-brand';
    label.textContent = info.label;
    const tempBox = document.createElement('div');
    tempBox.appendChild(temp);
    tempBox.appendChild(label);
    main.appendChild(icon);
    main.appendChild(tempBox);
    const stats = document.createElement('div');
    stats.className = 'd-flex flex-column gap-2 small';
    stats.appendChild(createStat('fa-wind', 'Wind ' + Math.round(current.wind) + ' km/h'));
    stats.appendChild(createStat('fa-droplet', 'Humidity ' + Math.round(current.humidity) + '%'));
    card.appendChild(title);
    card.appendChild(main);
    card.appendChild(stats);
    return card;
}

function createDayCard(day) {
    const info = describeWeather(day.code);
    const col = document.createElement('div');
    col.className = 'col-6 col-md';
    const card = document.createElement('div');
    card.className = 'wl-card wl-card-sm text-center h-100';
    const name = document.createElement('div');
    name.className = 'small fw-bold';
    name.textContent = formatDay(day.date);
    const icon = document.createElement('i');
    icon.className = 'fa-solid ' + info.icon + ' fs-2 text-brand my-3';
    const range = document.createElement('div');
    range.className = 'fw-semibold';
    range.textContent = Math.round(day.max) + '° / ' + Math.round(day.min) + '°';
    const text = document.createElement('div');
    text.className = 'card-text-sm';
    text.textContent = info.label;
    const rain = document.createElement('div');
    rain.className = 'card-text-sm';
    rain.textContent = 'Rain chance ' + (day.rain === null || day.rain === undefined ? '—' : day.rain + '%');
    card.appendChild(name);
    card.appendChild(icon);
    card.appendChild(range);
    card.appendChild(text);
    card.appendChild(rain);
    col.appendChild(card);
    return col;
}

function getRecentSpots() {
    const stored = readStorage(RECENT_SPOTS_KEY, []);
    return Array.isArray(stored) ? stored.filter((id) => weatherSpots.some((s) => s.id === id)) : [];
}

function rememberSpot(id) {
    const list = [id].concat(getRecentSpots().filter((x) => x !== id)).slice(0, 4);
    writeStorage(RECENT_SPOTS_KEY, list);
}

function initWeatherPage() {
    const select = document.getElementById('weather-spot');
    const refresh = document.getElementById('weather-refresh');
    const retry = document.getElementById('weather-retry');
    const recentBox = document.getElementById('recent-spots');
    const recentWrap = document.getElementById('recent-wrap');
    const states = {
        empty: document.getElementById('weather-empty'),
        loading: document.getElementById('weather-loading'),
        error: document.getElementById('weather-error'),
        result: document.getElementById('weather-result')
    };
    let requestId = 0;

    function showState(name) {
        Object.keys(states).forEach(function (key) {
            states[key].classList.toggle('d-none', key !== name);
        });
    }

    function renderRecent() {
        const recent = getRecentSpots();
        recentBox.innerHTML = '';
        recentWrap.classList.toggle('d-none', recent.length === 0);
        recent.forEach(function (id) {
            const spot = weatherSpots.find((s) => s.id === id);
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'filter-btn';
            chip.dataset.spot = id;
            chip.textContent = spot.name;
            recentBox.appendChild(chip);
        });
    }

    function renderResult(spot, data) {
        const current = document.getElementById('weather-current');
        const days = document.getElementById('weather-days');
        current.innerHTML = '';
        days.innerHTML = '';
        current.appendChild(createCurrentCard(spot, data.current));
        data.daily.forEach(function (day) { days.appendChild(createDayCard(day)); });
    }

    async function loadSpot(id) {
        const spot = weatherSpots.find((s) => s.id === id);
        if (!spot) { showState('empty'); return; }
        const current = ++requestId;
        showState('loading');
        try {
            const data = await weatherService.getForecast(spot.lat, spot.lon);
            if (current !== requestId) { return; }
            if (!data) { showState('empty'); document.getElementById('weather-empty-text').textContent = 'No forecast data is available for this place right now.'; return; }
            renderResult(spot, data);
            rememberSpot(id);
            renderRecent();
            showState('result');
        } catch (error) {
            if (current !== requestId) { return; }
            document.getElementById('weather-error-text').textContent = error.message;
            showState('error');
        }
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a destination...';
    select.appendChild(placeholder);
    weatherSpots.forEach(function (spot) {
        const option = document.createElement('option');
        option.value = spot.id;
        option.textContent = spot.name;
        select.appendChild(option);
    });

    select.addEventListener('change', function () { loadSpot(select.value); });
    refresh.addEventListener('click', function () { loadSpot(select.value); });
    retry.addEventListener('click', function () { loadSpot(select.value); });
    recentBox.addEventListener('click', function (event) {
        const chip = event.target.closest('[data-spot]');
        if (!chip) { return; }
        select.value = chip.dataset.spot;
        loadSpot(chip.dataset.spot);
    });

    renderRecent();
    const last = getRecentSpots()[0];
    if (last) { select.value = last; loadSpot(last); } else { showState('empty'); }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('weather-spot')) { initWeatherPage(); }
});
