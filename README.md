# Wanderlens - Coastal Pass (Final Project)

Multi-page responsive travel website for coastal and island trips. The final version extends the midterm and endterm projects
(same topic, same team) into a client-side web application with a live weather API, classes, saved trips, a CRUD page, a dashboard and advanced catalog tools.



## Team "AI love"
* Balnur
* Ayazhan

## Pages (10, all connected through the navbar)
Home, Discover, Attractions, Experiences, Plan Your Trip, **Weather**, **My Trips**, Get Pass, About, Contact.

## Technologies
HTML5, CSS3, **Bootstrap 5.3** (grid, navbar, offcanvas, toasts, form classes), Font Awesome, Google Fonts,
**JavaScript (ES6)**, **jQuery 3.7**.

## Project structure
```
index.html, discover.html, attractions.html, experiences.html,
plan-trip.html, pass.html, about.html, contact.html
css/style.css          design tokens, light/dark theme, custom components
js/data.js             arrays with project data (attractions, experiences, destinations, passes, durations, activities, faqs)
js/main.js             functions, DOM rendering, events, filtering, favorites, theme
js/validation.js       custom form validation (contact form + trip planner)
js/jquery-effects.js   jQuery selectors, traversal, events, effects
js/trip.js             classes Trip and TripStorage (OOP + localStorage)
js/weather.js          class WeatherService, fetch with async/await, weather page UI
js/trips-page.js       My Trips page: CRUD, dashboard, bar chart
weather.html, my-trips.html   new final pages
```

## New final features
| # | Feature | Where |
|---|---|---|
| 1 | **API integration** - live 5-day forecast from Open-Meteo with loading, success, empty-data and error states, retry button, timeout, network and HTTP error handling | Weather |
| 2 | **OOP** - class `Trip` (constructor, properties, getters, methods `getTotal`, `getEndDate`, `getItinerary`, `update`, `toJSON`, static `fromObject`), class `TripStorage` (load, add, update, remove, clear), class `WeatherService` | Plan Your Trip, My Trips, Weather |
| 3 | **localStorage** - saved trips (JSON, invalid or broken data is skipped safely), recently viewed weather places, last viewed place restored on reload, update and clear options | My Trips, Plan Your Trip, Weather |
| 4 | **CRUD** - create, read, update, delete trips in a modal form with validation, delete confirmation, clear all | My Trips |
| 5 | **Dashboard** - statistics cards (trips, total cost, average, days), bar chart of cost per trip, most chosen activity | My Trips |
| 6 | **Advanced catalog tools** - sorting (A-Z, Z-A, category), pagination, favorites-only switch, combined with the existing search and category filter | Attractions, Experiences |

## API information
* **Service:** Open-Meteo Forecast API (`https://api.open-meteo.com/v1/forecast`).
* **Key:** none required, public and free for non-commercial use, so no secret is stored in the code.
* **Requested data:** current temperature, humidity, wind speed, weather code; daily weather code, max and min temperature, rain probability for 5 days.
* **Documentation:** https://open-meteo.com/en/docs

## Endterm features (kept and still working)
| Feature | Where |
|---|---|
| Cards rendered from arrays (not written in HTML) | Home (featured), Discover, Attractions, Experiences, Pass |
| Live search + category filter | Attractions, Experiences |
| Favorites list (heart button, saved in localStorage, panel with remove) | all pages (navbar heart) |
| Light / dark theme switcher (saved) | all pages (navbar moon icon) |
| Live price calculator | Plan Your Trip |
| Itinerary generator (day-by-day list) | Plan Your Trip |
| Custom form validation with messages + success message | Contact, Plan Your Trip |
| jQuery accordion, slide toggles, fade, animated counters, back-to-top | Discover, Pass, Home, all pages |
| Responsive navbar with mobile menu | all pages |

## How the requirements are covered
* **Arrays:** 7 arrays in `data.js`. **Loops:** `forEach` (renderCards), `for...of` (favorites list), `for` (buildItinerary).
* **Functions (with parameters):** `filterItems`, `calculateTotal` (both return a value), `renderCards`, `createCard`, `toggleFavorite`, `showToast`, `setTheme`, `validateForm`, `checkEmail`, ...
* **DOM:** `createElement`, `appendChild`, `remove()`, `classList.toggle`, `setAttribute`, `textContent`, show/hide with `d-none`.
* **Events (`addEventListener`):** `click`, `input`, `change`, `submit`, `keydown`, `blur`, `DOMContentLoaded`; `event.preventDefault()` on forms and heart buttons.
* **jQuery:** selectors (`#id`, `.class`, `element`, `a[href^="http"]`, descendant `.faq-item .faq-question`), traversal (`closest`, `find`, `next`, `siblings`), events (`click`, `scroll`, `mouseenter/mouseleave`), effects (`slideToggle`, `slideUp`, `fadeIn`, `fadeOut`, `slideDown`, `animate`).

## How to test (final features)
1. **Weather:** open *Weather*, choose a destination - a spinner appears, then current weather and 5 day cards. Reload: the last place and the recently viewed chips are restored. Turn off the internet and press *Refresh forecast* to see the error state with *Try again*.
2. **Save a trip:** open *Plan Your Trip*, fill the form, generate the itinerary and press *Save to My Trips*.
3. **CRUD:** open *My Trips*. *New trip* creates a record, *Edit* changes it, *Delete* removes it after confirmation, *Clear all* removes every record. Reload: records stay.
4. **Dashboard:** statistics and the bar chart update after every create, edit or delete. Sort trips with the select box.
5. **Catalog tools:** on *Attractions* and *Experiences* use the sort select, the pages at the bottom and the *Favorites only* switch together with search and categories.

## How to test (endterm features)
1. **Search & filter:** open *Attractions*, type "cove" in the search box (list shrinks, counter updates), press `Esc` to clear, click category buttons. Do the same on *Experiences*.
2. **Favorites:** click the heart on any card - toast appears and the navbar counter grows. Click the heart icon in the navbar to open the list, remove an item with the trash button. Reload the page: favorites are kept.
3. **Theme:** click the moon/sun button in the navbar. Reload: the theme is kept.
4. **Contact form:** open *Contact*, press *Confirm and Submit* with empty fields - specific messages appear under each field. Try a bad email (`abc`), short name, short message. Fill everything correctly and tick the terms - a green success message fades in. Opening it from *Get Pass* (Purchase button) preselects the pass.
5. **Plan Your Trip:** change duration / travelers / activities - the total updates instantly. Submit empty form to see errors (travelers outside 1-10, past date, no activity). Submit valid data to get a day-by-day itinerary.
6. **jQuery:** *Discover* -> "Learn more" slides details; *Get Pass* -> click FAQ questions (accordion); *Home* -> counters animate on load; scroll down on any page -> back-to-top button fades in.
7. **Mobile:** narrow the browser (or use DevTools device mode): the navbar collapses into a hamburger menu and cards stack in one column.

## Run locally
Open the folder in VS Code and run `index.html` with Live Server (or just open it in a browser). Internet is required for CDN files and images.

---
&copy; 2026 Wanderlens. All rights reserved.
