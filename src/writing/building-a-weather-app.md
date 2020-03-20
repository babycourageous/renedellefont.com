---
title: 'Building A Weather App With Svelte, Tailwind, and Netlify'
date: 2020-02-20
featuredimage:
excerpt: In this tutorial, we’ll be building a Weather app in Svelte. The app features a 5-day forecast as well as an interactive city search.
category: svelte
type: tutorial
tags:
  - svelte
  - api
  - tailwind
  - netlify
toc: true
---

Dark Sky Weather API
[Algolia Places API](https://community.algolia.com/places/)
Netlify FUNCTIONS??? for API masking

## New Svelte Tailwind Project

```bash
npx degit babycourageous/svelte-tailwind-starter
```

reset stuff

### All default Everything REDO WITH NEW LAYOUT

```svelte
<main class="flex justify-center pt-8">
  <div class="mb-8 text-white">
    <div class="places-input">
      <input type="text" class="form-input block w-full text-gray-800" />
    </div>
    <div
      class="weather-container mt-4 w-128 max-w-lg font-sans overflow-hidden
      bg-gray-900 rounded-lg shadow-lg"
    >
      <div class="current-weather flex items-center justify-between px-6 py-8">
        <div class="flex items-center">
          <div>
            <div class="text-6xl font-semibold">8°C</div>
            <div>Feels like 2°C</div>
          </div>
          <div class="mx-5">
            <div class="font-semibold">Cloudy</div>
            <div>Toronto, Canada</div>
          </div>
        </div>
        <div>ICON</div>
      </div>

      <div class="future text-sm bg-gray-800 px-6 py-8 overflow-hidden o-8">
        {#each [1, 2, 3, 4, 5] as item}
          <div class="flex items-center">
            <div class="w-1/6 text-lg text-gray-200">DOW : {item}</div>
            <div class="flex items-center w-2/3 px-4">
              <div>ICON</div>
              <div class="ml-3">Cloudy with a chance of showers</div>
            </div>
            <div class="w-1/6 text-right">
              <div>5°C</div>
              <div>-2°C</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</main>
```

## DARKSKY

Sign up for an account

Get an API Key

## New Netlify Project

This will be so we can hide our DarkSky API credentials from the front-facing client app.

install Netlify CLI

```bash
npm install netlify-cli -g
```

Even if you already have the Netlify CLI, run the above command to update to the latest release to take advantage of some of the features we need to use.

Create and Connect a Netlify site (we'll connect manually rather than via github repo)

```bash
netlify init
```

Follow prompts

### Add netlify toml

touch netlify.toml

Add build settings

```yaml
[build]
  # Directory (relative to root of your repo) that contains the deploy-ready
  # HTML files and assets generated by the build. If a base directory has
  # been specified, include it in the publish directory path.
  publish = "public/"

  # Default build command.
  command = "npm run build"

  # Directory with the serverless Lambda functions to deploy to AWS.
  functions = "functions/"
```

### Add dev settings

```yaml
[dev]
  command = "npm run dev" # Command to start your dev server
  publish = "public" # If you use a _redirect file, provide the path to your static content folder
```

Test it out

`netlify dev`

or

`ntl dev`

Should call `npm run dev` and serve the Svelte app at http://localhost:8888
This allows proxying of Netlify functions to the localhost for testing!

## Fetch weather in app

Fetch data onMount()

Create separate function fetchData()

```svelte
async function fetchData() {
  await response = fetch(`DEFAULT_API_URL`)
  await data = response.json()
  console.log(data)
}
```

CORS error - don't want other domains using the API key so DarkSky has CORS enabled

## Proxy that API with Netlify

Use Netlify Functions to proxy the request and hide the API Key

Then call Netlify function instead of API directly in the `fetchData` function

### Add Function

makedir functions
ntl functions:create

pick template node-fetch and give it the name dark-sky when the cli asks.

replace code - for now hard-code your API key. We'll put this in an environment variable momentarily.

```js
/* eslint-disable */
const fetch = require('node-fetch')

exports.handler = async function(event, context) {
  const API_URL = 'https://api.darksky.net/forecast'

  const DARKSKY_URL = `${API_URL}/YOUR_DARKSKY_API_KEY/41.9482,-87.6564`

  try {
    const response = await fetch(DARKSKY_URL, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }

    const data = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
```

Now in our app, call this lambda function instead of the DarkSky API directly.

```svelte
async function fetchData() {
  const response = await fetch(`/.netlify/functions/dark-sky`)
  const data = await response.json()
  console.log(data)
}
```

SUCCESS!

## Expand on the serverless API

We're gonna make the API a little more dynamic.

### Move the API Key to an environment variable.

Put it in a variable - DARKSKY_API_KEY - via the Netlify admin. This will now be available on `process.env` within our lambda.

### Add API variables to the component state

Just below our `onMount` import is where we will define all our state. Start by adding the default location info.

```svelte
  let location = {
    name: 'Chicago, Illonois',
    lat: 41.9482,
    lng: -87.6564,
  }
```

Next, pass those into `fetchData` as part of a query string.

```svelte
async function fetchData() {
  const response = await fetch(
    `/.netlify/functions/dark-sky?lat=${location.lat}&lng=${location.lng}`
  )
  const data = await response.json()
  console.log(data)
}
```

### Update lambda function

Get from query string.

Update the variable declarations above the try block:

```js
const API_URL = 'https://api.darksky.net/forecast'

// pull lat and lng params out of query string
const { lat, lng } = event.queryStringParameters

// Get env var values defined in our Netlify site UI
const { DARKSKY_API_KEY } = process.env

const DARKSKY_URL = `${API_URL}/${DARKSKY_API_KEY}/${lat},${lng}`
```

Now visit http://localhost:8888

You should still see the console log our response object!

### Optional: create redirect

Redirect the `./netlify/functions/weather` to `/api/weather`

`netlify.toml`

```toml
[[redirects]]
  from = "/api/weather/*"
  to = "/.netlify/functions/dark-sky/:splat"
  query = {lat = ":lat", lng = ":lng"}
  status = 200
  force = true
```

Now we can hit localhost:8888/api/weather instead of localhost:8888/.netlify/functions/dark-sky. This isn't a necessary step, it just makes URLs a little easier when dealing with our own API. Below is the updated `fetchData` function:

```svelte
async function fetchData() {
  const response = await fetch(
    `/api/weather?lat=${location.lat}&lng=${location.lng}`
  )
  const data = await response.json()
  console.log(data)
}
```

## Using the result

Now it's time to display some of the weather data we pulled. Begin by defining some more state just above the `location` state definition:

```svelte
let currentTemp: {
  actual:'',
  feels:'',
  summary:'',
  icon:''
}
```

Inside `fetchData` replace the `console.log` with assignments to the variables. In Svelte, assignments to a locally declared variable are reactive and result in a re-render.

```svelte
function fetchData() {
  const response = await fetch(
    `/api/weather?lat=${location.lat}&lng=${location.lng}`
  )
  const data = await response.json()

  const {temperature, apparentTemperature, summary, icon} = data.currently
  currentTemp.actual = Math.round(temperature)
  currentTemp.feels = Math.round(apparentTemperature)
  currentTemp.summary = summary
  currentTemp.icon = icon
}
```

Update the markup

```svelte
<main class="flex justify-center pt-8">

  ...

    <div
      class="weather-container mt-4 w-128 max-w-lg font-sans overflow-hidden
      bg-gray-900 rounded-lg shadow-lg"
    >
      <div class="current-weather flex items-center justify-between px-6 py-8">
        <div class="flex items-center">
          <div>
            <div class="text-6xl font-semibold">{currentTemp.actual}°C</div>
            <div>Feels like {currentTemp.feels}°C</div>
          </div>
          <div class="mx-5">
            <div class="font-semibold">{currentTemp.summary}</div>
            <div>{location.name}</div>
          </div>
        </div>
        <div>ICON</div>
      </div>

      ...

    </div>
  </div>
</main>
```

### Adding Icons

DarkSky uses an icon set called [Skycons](http://darkskyapp.github.io/skycons/). We'll just link to the cdnjs file. You could pull this down locally and link to it that way.

Add the following just below the `<script>` tag.

`App.svelte`

```svelte
<svelte:head><script src="https://cdnjs.cloudflare.com/ajax/libs/skycons/1396634940/skycons.min.js" on:load={initializeSkycons}></script></svelte:head>
```

The `<svelte:head>` element inserts elements inside the `<head>` of the document. Since The `<script>` tag (and everything else in <svelte:head>) is added programmatically, we must wait until they are loaded before using the respective code. There are a few ways to do this - notably adding the script tags manually or adding an `onload` handler. Above we use the `onload` that will initialize Skycons once ready.

Add a variable with the rest of our state declarations for the Skycons initialization as well as the `initializeSkycons` function just above `fetchData`:

```
<script>
import {onMount} from 'svelte'

let skycons

...

function initializeSkycons() {
  skycons = new Skycons({ color: 'white' })
}

async function fetchData() {
  ...
}
</script>
```

Inside the markup replace the placeholder icon text with a `canvas` element. The `canvas`'s `id` attribute is what Skycons uses to load its animated icons.

```svelte
<main>
...

  <div class="current-weather flex items-center justify-between px-6 py-8">
    <div class="flex items-center">
      <div>
        <div class="text-6xl font-semibold">8°C</div>
        <div>Feels like 2°C</div>
      </div>
      <div class="mx-5">
        <div class="font-semibold">Cloudy</div>
        <div>Toronto, Canada</div>
      </div>
    </div>
    <div><canvas id="iconCurrent" width="96" height="96"></canvas></div>
  </div>

...
</main>
```

Then update the `fetchData` function to add and animate a weather icon. Let's just hard-code one in to see how this works:

```svelte
<script>

...

  async function fetchData() {
    const response = await fetch(
      `/api/weather?lat=${location.lat}&lng=${location.lng}`
    )
    const data = await response.json()

    const { temperature, apparentTemperature, summary, icon } = data.currently
    currentTemp.actual = Math.round(temperature)
    currentTemp.feels = Math.round(apparentTemperature)
    currentTemp.summary = summary
    currentTemp.icon = icon

    skycons.add('iconCurrent', 'partly-cloudy-day')
    skycons.play()
  }

</script>
```

That should render an animated partly cloudy icon in the `canvas` element.

Now let's make the icon dynamic. The API returns the icon with spaces but the Skycons library expects an icon string that is hyphenated. So we'll create a simple hyphenate function to assist with that.

```svelte
async function fetchData() {
  const response = await fetch(
    `/api/weather?lat=${location.lat}&lng=${location.lng}`
  )
  const data = await response.json()

  const { temperature, apparentTemperature, summary, icon } = data.currently
  currentTemp.actual = Math.round(temperature)
  currentTemp.feels = Math.round(apparentTemperature)
  currentTemp.summary = summary
  currentTemp.icon = hyphenate(icon)

  skycons.add('iconCurrent', currentTemp.icon)
  skycons.play()
}

function hyphenate(str) {
  return str.split(' ').join('-')
}
```

This could also be done with a regular expression if preffered:

```js
return str.replace(/\s/g, '-')
```

## The Week Ahead

The JSON object that the DarkSky API returns contains a "daily" key that has weather info for the next 8 days. We'll filter that to a 5-day forecast and use it to populate the 5-day forecast.

Add another piece of state up top below all the other variable declarations:

```svelte
let daily = []
```

Once the API resolves we can filter the result down to five days and store it in the `daily` array.

```svelte
  async function fetchData() {
    const response = await fetch(
      `/api/weather?lat=${location.lat}&lng=${location.lng}`
    )
    const data = await response.json()

    const { temperature, apparentTemperature, summary, icon } = data.currently
    currentTemp.actual = Math.round(temperature)
    currentTemp.feels = Math.round(apparentTemperature)
    currentTemp.summary = summary
    currentTemp.icon = hyphenate(icon)

    daily = data.daily.data.filter((day, index) => index < 5)

    skycons.add("iconCurrent", currentTemp.icon)
    skycons.play()
  })
}
```

The API returns a UNIX timestamp for each day. In order to display the day of the week we'll create a simple function using the native javascript `Date` object rather than reaching for an external date library. If this was more complex or we had more date calculations to make perhaps a library like `moment` or `Datefns` would be necessary.

```svelte
<script>
...

function convertToDay(unix) {
  const newDate = new Date(unix * 1000)
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']

  return days[newDate.getDay()]
}
...
</script>
```

The function simply creates a new Date based on the UNIX timestamp passed in. Then since `Date.getDay` returns an index we use an array of day of the week abbreviations that will correspond to the index returned.

Simple as that.

In the markup loop over each day and use the result to populate our daily forecast. In this case we will destructure our day inside the `#each` expression. We'll also make use of the provided `index` for our icon `id`s as well as use the `time` property of each day as the `key` to uniquely identify each item.

```svelte
  <div class="future text-sm bg-gray-800 px-6 py-8 overflow-hidden o-8">
    {#each daily as {time, icon,summary, temperatureHigh, temperatureLow}, index (time)}
      <div class="flex items-center">
        <div class="w-1/6 text-lg text-gray-200">{time}</div>
        <div class="flex items-center w-2/3 px-4">
          <div><canvas id={`icon-week-${index+1}`} data-icon={hyphenate(icon)} width=24 height=24></canvas></div>
          <div class="ml-3">{summary}</div>
        </div>
        <div class="w-1/6 text-right">
          <div>{Math.round(temperatureHigh)}°C</div>
          <div>{Math.round(temperatureLow)}°C</div>
        </div>
      </div>
    {/each}
  </div>
```

Each of the icons in the daily forecast has a `data-icon` attribute that holds a reference to the icon string. We can use that along with the `id` to add a Skycon for each day.

We'll make use of Svelte's `tick` function. The `tick` function can be called anytime - not just when the component first initialises. It returns a promise that resolves as soon as any pending state changes have been applied to the DOM (or immediately, if there are no pending state changes).

This will be helpful since we need to reference the DOM elements for the daily forecast AFTER the updates to the state that create them.

```svelte
<script>
  import { onMount, tick } from 'svelte'

  ...

  async function fetchData() {
    const response = await fetch(
      `/api/weather?lat=${location.lat}&lng=${location.lng}`
    )
    const data = await response.json()

    const { temperature, apparentTemperature, summary, icon } = data.currently
    currentTemp.actual = Math.round(temperature)
    currentTemp.feels = Math.round(apparentTemperature)
    currentTemp.summary = summary
    currentTemp.icon = hyphenate(icon)

    daily = data.daily.data.filter((day, index) => index < 5)

    skycons.add('iconCurrent', currentTemp.icon)

    await tick()

    daily.forEach((day, index) => {
      const iconID = `icon-week-${index + 1}`
      skycons.add(
        iconID,
        document.getElementById(iconID).getAttribute('data-icon')
      )
    })
    skycons.play()
  }

...

</script>
```

Once the state is updated a `forEach` loop is used to create the five Skycons for the daily forecast.

## Integrate Algolia Places API

[Sign up](https://www.algolia.com/users/sign_up/places) for APP ID and API KEY. Totally ok to expose on client.

You'll find the Application ID and Search-Only API Key in your dashboard under API Keys

Same as before - initialize in `svelte:head` with an `on:load`.

```svelte
<script>
...

  function initPlaces() {
    var placesAutocomplete = places({
      appId: 'pl000XLR3KOB',
      apiKey: 'be931dd1c86b72dae51db881ff15f04b',
      container: document.querySelector('#search'),
    }).configure({ type: 'city' })
  }

  ...

</script>

<svelte:head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/skycons/1396634940/skycons.min.js"
    on:load={initializeSkycons}>

  </script>
  <script
    src="https://cdn.jsdelivr.net/npm/places.js@1.18.1"
    on:load={initPlaces}>

  </script>
</svelte:head>
```

The above `initPlaces` function initializes the Places autocomplete input to our search input and to only display cities.

Because of how Tailwind resets some styles we need to add some Places specific style overrides in order to display the search component properly. In Svelte styles are encapsulated with the component. Since the Places HTML is added after we have to apply styles to the selectors globally using the `:global(...)` modifier.

Place the following at the bottom of the file:

```svelte
<style type="text/postcss">
  :global([type='search']::-webkit-search-cancel-button),
  :global([type='search']::-webkit-search-decoration) {
    -webkit-appearance: none;
  }

  :global([type='search']::-ms-clear) {
    display: none;
  }
  :global(.ap-suggestion) {
    @apply text-gray-700;
  }

  :global(.ap-address) {
    @apply text-gray-700;
  }
  :global(.ap-suggestion-icon svg) {
    @apply inline-block;
    @apply -mt-3;
  }
  :global(.ap-footer svg) {
    display: inline;
  }
</style>
```

Next update the markup for our input element:

```svelte
  <main>

...

  <div class="places-input">
    <input
      id="search"
      type="search"
      class="form-input block w-full text-gray-800"
    />
    <p class="mt-4 text-gray-800 text-center">{location.name}</p>
  </div>

  ...

  </main>
```

- add change and clear callback
- fetchData on location change
  - remove onMount and make reactive with \$:

## Respond to changes in location

Uses VueWatch... maybe use \$: ?

## ADVANCED: Middleware to whitelist endpoint

## ADVANCED: STORES?

## ADVANCED: REFACTOR