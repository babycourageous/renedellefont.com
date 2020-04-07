---
title: 'Fun with APIs - Building a Pokedex Using Svelte'
date: 2020-02-20
featuredimage: '/images/writing/svelte-pokedex-detail-complete.png'
excerpt: We'll be using the PokeAPI to make a Pokedex Svelte app.
category: svelte
type: tutorial
tags:
  - svelte
  - api
  - netlify
  - REST
toc: true
---

In this tutorial, we’ll be putting together a Pokedex app in [Svelte](https://svelte.dev/). We'll make use of the free [PokeAPI](https://pokeapi.co/) to populate our Pokemon data.

Check out the finished project on github: https://github.com/babycourageous/svelte-pokedex
Check out the live app on Netlify: https://svelte-pokedex.netlify.com/

## Initialize A New Svelte Tailwind Project

We will be using [Tailwind](https://tailwindcss.com/) for our styling needs. I have a Svelte starter with Tailwind baked in:

```bash
npx degit babycourageous/svelte-tailwind-starter svelte-pokedex
```

If you wish to go with a default install of Svelte using vanilla styles then the official pipeline is the way to go:

```bash
npx degit sveltejs/template svelte-pokedex
```

This project will use `npm` as the package manager so install the dependencies:

```bash
npm i
```

We're gonna give the `fetch` alternative [ky](https://github.com/sindresorhus/ky) a shot. It's lightweight, has a simpler API, and treats non-2xx status codes as errors for us!

```bash
npm i ky
```

## Initial setup

Update the `main.js` file:

`main.js`

```js
import App from './App.svelte'
import './tailwind.css'

const app = new App({
  target: document.body,
})

export default app
```

All we did was remove the unnecessary `props` being passed in to the `App` component.

Next, remove all the code in `App.svelte` and replace it with the following:

`App.svelte`

```svelte
<script>
  import { onMount } from 'svelte'
  import ky from 'ky'

  let pokemons = []

  onMount(async () => {
    let url = 'https://pokeapi.co/api/v2/pokemon'
    const data = await ky.get(url).json()

    pokemons = data.results
  })
</script>

<div class="container mt-8">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4">
    {#each pokemons as { name, url }, index (index)}
      <li><p class="font-bold text-xl mb-2">{name}</p></li>
    {/each}
  </ul>
</div>
```

We import `onMount` and fetch the top-level pokemon using `ky`. This will return a list of 20 pokemon at a time (PokeAPI supports paging). The return object for each Pokemon contains their name and url. `ky` returns a `Response` object with `Body` methods added for convenience. Because of this we can call `ky.get(input).json()` directly without having to await the `Response` first.

Our template code is pretty straightforward and just prints out the returned Pokemon names using a Svelte `#each` block. `#each` blocks are used to iterate over any array or array-like value. We deconstruct the `name` and `url` from the individual item in the array. The second argument, `index`, is just that. The index of the current item in the array. The final piece is the `key` that Svelte uses for diffing.

If you run `npm run dev` and open your browser you should see the following:

{% figure 'svelte-pokedex-initial.png', 'Getting initial data from PokeAPI', 'Displaying our initial Pokemon API data.' %}

Now that we have our pokemon, let’s make some cards to display the data. We'll also add an image using the Pokemon index. This will work for now but we will refactor to get the index from the Pokemon url.

`App.svelte`

```html
<div class="container py-8">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4">
    {#each pokemons as { name, url }, index (index)}
    <li>
      <article
        class="flex flex-col items-center max-w-sm rounded overflow-hidden
        shadow-lg"
      >
        <div class="px-6 py-4">
          <h2 class="font-bold text-xl mb-2">{name}</h2>
        </div>
        <img
          class="w-24 h-24"
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{index + 1}.png"
          alt=""
        />
      </article>
    </li>
    {/each}
  </ul>
</div>
```

{% figure 'svelte-pokedex-initial-cards.png', 'Initial layout for Pokemon cards', 'Displaying our Pokemon in cards.' %}

## Refactor: Pokemon Card

Now that we have the start of something, let's refactor our implementation. We'll pull our card specific template and logic into a separate component called `PokemonCard`. Make a folder called `components` and add a file named `PokemonCard.svelte`.

Inside add the following code:

`components/PokemonCard.svelte`

```svelte
<script>
  export let name
  export let url

  const urlArray = url.split('/')
  const indexLocation = urlArray.length - 2

  const index = urlArray[indexLocation]

  const imgurl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index}.png`
</script>

<article
  class="flex flex-col items-center max-w-sm rounded overflow-hidden shadow-lg"
>
  <div class="px-6 py-4">
    <h2 class="font-bold text-xl mb-2">{name}</h2>
  </div>
  <img class="w-24 h-24" src={imgurl} alt="" />
</article>

```

In our `script` tag we are exporting two variables - `name` and `url`. These will be passed in as props from the `App` component. We then use `url` to construct our image url. Since the format of the url is **https://pokeapi.co/api/v2/pokemon/1/** we can `split` it on the `/` into its parts and then pull the specific Pokemon id out from the end (well, second from the end). Pretty nifty.

Update our `App` to use the new `PokemonCard` component:

`App.svelte`

```svelte
<script>
  import { onMount } from 'svelte'
  import ky from 'ky'

  import PokemonCard from './components/PokemonCard.svelte'

  let pokemons = []

  onMount(async () => {
    let url = 'https://pokeapi.co/api/v2/pokemon'
    const data = await ky.get(url).json()

    pokemons = data.results
  })
</script>

<div class="container py-8">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4">
    {#each pokemons as { name, url }, index (index)}
      <PokemonCard {name} {url} />
    {/each}
  </ul>
</div>
```

Everything should work as before. This was just a simple refactor.

Before moving on let's add a quick header to the site. Add the following just above the current template HTML.

`App.svelte`

```html
<header class="flex items-center justify-between w-full bg-red-600 px-8 py-4">
  <h1 class="text-2xl text-white uppercase">Svelte PokeDex</h1>
  <p class="text-white">
    A Svelte REST API demo using the
    <a href="https://pokeapi.co/" class="text-white underline">PokéAPI</a>
  </p>
</header>
```

{% figure 'svelte-pokedex-header.png', 'Adding a header to the app', 'Pokedex... now with a header!' %}

## Loading More Pokemon

We are currently only loading 24 Pokemon into the app. But there are 100s to be loaded. Adding a **Load More** button should do the trick and I personally like those more than an infinite scroll or pagination.

We will keep track of the current offset (`offset`) and amount of Pokemon to load at a time (`amountToLoad`) and use those to load more when we click a button. We'll also move our fetch into a reactive statement so that we fetch when the `offset` is updated (which will happen when we click our **Load More** button). The reactive statement also fires when the variable is declared so we can remove the `onMount` completely.

`App.svelte`

```svelte
<script>
  import { onMount } from 'svelte'
  import ky from 'ky'

  import PokemonCard from './components/PokemonCard.svelte'

  let pokemons = []
  let offset = 0
  let amountToLoad = 24

  $: {
    getPokemon(offset)
  }

  async function getPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${amountToLoad}`
    const data = await ky.get(url).json()

    pokemons = [...pokemons, ...data.results]
    console.log(pokemons)
  }

  function handleMoreClick(event) {
    offset += amountToLoad
  }
</script>

<header class="flex items-center justify-between w-full bg-red-600 px-8 py-4">
  <h1 class="text-2xl text-white uppercase">Svelte PokeDex</h1>
  <p class="text-white">
    A Svelte REST API demo using the
    <a href="https://pokeapi.co/" class="text-white underline">PokéAPI</a>
  </p>
</header>
<div class="container py-4">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4 py-4">
    {#each pokemons as { name, url } (url)}
      <li>
        <PokemonCard {name} {url} />
      </li>
    {/each}
  </ul>

  {#if pokemons.length > 0}
    <button
      class="border border-red-700 font-bold hover:bg-red-700 hover:text-white
      px-4 py-2 rounded text-red-700"
      type="button"
      id="more-button"
      on:click={handleMoreClick}
    >
      Load More
    </button>
  {/if}
</div>
```

We put our _Load More_ button in an `#if` block so that there won't be a random _Load More_ button when the app loads.

## Linking to a Pokemon Detail Page

Now that we can display a simple list of Pokemon retrieved from an endpoint, it's time to link them to individual detail pages. For that, we'll integrate a simple routing solution.

### Add Routing

There is not an official solution to routing with Svelte. There are a few libraries that are popular.

It isn't too difficult to roll your own with a project like [page.js](https://github.com/visionmedia/page.js) or [navaid](https://github.com/lukeed/navaid). I have used both and they have similar approaches. Perhaps a tutorial for another day...

For filesystem-based routing, there's [Routify](https://routify.dev/). It's gaining momentum in the Svelte community and a few folks swear by it. I haven't used it and it's probably a bit of overkill for a simple project like this.

The popular project for a more declarative HTML approach (like React Router if you're familiar with that), there's [svelte-routing](https://github.com/EmilTholin/svelte-routing). That's what we will go with. It's pretty simple to use and requires little to no configuration usually.

```bash
npm i svelte-routing -D
```

### Update Rollup

Since this will act as a SPA, we need to update our Rollup config to treat it as such. This will allow us to refresh a link that isn't the index route.

We are going to update the `serve` function at the bottom of the Rollup configuration file:

`rollup.config.js`

```js
function serve() {
  let started = false

  return {
    writeBundle() {
      if (!started) {
        started = true

        require('child_process').spawn('npm', ['run', 'start', '--', '--dev', '--single'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        })
      }
    },
  }
}
```

The line updated is the child process that is called when we run the app.

### Create Routes

Now let's code up a starting point for adding some routing to our app.

Add a `routes` folder to the app to hold our Route components. Inside add a `Home.svelte` and `Detail.svelte` component. We will refactor our `App` code into the `Home` component; `Detail` will be our individual Pokemon Detail page that will be found whenever we go to `"/:id"` where the value of `:id` becomes a parameter our component can access as a `params` prop.

First up replace the entirity of `App.svelte` with the following:

`App.svelte`

```svelte
<script>
  import ky from 'ky'
  import { Router, Link, Route } from 'svelte-routing'

  import Home from './routes/Home.svelte'
  import Detail from './routes/Detail.svelte'

  export let url = ''
</script>

<Router {url}>
  <header
    class="flex flex-col sm:flex-row items-center justify-between w-full
    bg-red-600 px-8 py-4"
  >
    <h1 class="text-2xl text-white uppercase">
      <Link to="/">Svelte PokeDex</Link>
    </h1>
    <p class="text-white">
      A Svelte REST API demo using the
      <a href="https://pokeapi.co/" class="text-white underline">PokéAPI</a>
    </p>
  </header>

  <main class="py-4">
    <Route path="/:id" component={Detail} />
    <Route path="/" component={Home} />
  </main>
</Router>
```

The `Router` component is a top-level component that supplies the `Link` and `Route` children components with our routing information through context. In our template we use two `Route` components to render our pages. `Route` components will render its component property or children based on a score the `Router` component assigns. All properties other than `path` and `component` given to the `Route` will be passed to the rendered component.

The `Home` component is just all the pokemon specific stuff from `App`. Copy the below code into it:

`routes/Home.svelte`

```svelte
<script>
  import ky from 'ky'

  import PokemonCard from '../components/PokemonCard.svelte'

  let pokemons = []
  let offset = 0
  let amountToLoad = 24

  $: {
    getPokemon(offset)
  }

  async function getPokemon() {
    let url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${amountToLoad}`
    const data = await ky.get(url).json()

    pokemons = [...pokemons, ...data.results]
  }

  function handleMoreClick(event) {
    offset += amountToLoad
  }
</script>

<div class="container">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4">
    {#each pokemons as { name, url } (url)}
      <li>
        <PokemonCard {name} {url} />
      </li>
    {/each}
  </ul>

  {#if pokemons.length > 0}
    <button
      class="border border-red-700 font-bold hover:bg-red-700 hover:text-white
      px-4 py-2 rounded text-red-700"
      type="button"
      id="more-button"
      on:click={handleMoreClick}
    >
      Load More
    </button>
  {/if}
</div>
```

Finally, our `Detail` component will just be some dummy text along with a console log of our `id` param as well as printing it on screen:

`routes/Detail.svelte`

```svelte
<script>
  export let id
  console.log(id)
</script>

<h1>Detail Page</h1>
<p>{id}</p>
```

Now if you go to `http://localhost:5000/7` you should see **7** printed on the screen as well as logged to the console.

### Linking Cards to the Detail page

Obviously what good is a router without links to where we want to go? Our `PokemonCard` has everything we need to set that up. Before we do that though, we are going to make a quick utility function to transform any string into title case for display.

Add a file called `utils.js` to the `src` folder and add the folling function:

`utils.js`

```js
export function toTitleCase(string, splitChar) {
  return string
    .toLowerCase()
    .split(splitChar)
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ')
}
```

This just takes a string and character to split on and spits out a new string with the first letter of every word capitalized.

Now let's update that `PokemonCard`:

`components/PokemonCard.svelte`

```svelte
<script>
  import { Link, link } from 'svelte-routing'
  import { toTitleCase } from '../utils.js'

  export let name
  export let url

  const urlArray = url.split('/')
  const indexLocation = urlArray.length - 2

  const index = urlArray[indexLocation]

  const imgurl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index}.png`
</script>

<article
  class="flex flex-col items-center max-w-sm border-red-600 border-t-8
  border-red-500 rounded overflow-hidden shadow-lg"
>
  <header class="px-6 py-4">
    <h2 class="font-bold text-xl mb-2">
      <Link href="/{index}">{toTitleCase(name, '-')}</Link>
    </h2>
  </header>
  <img class="w-24 h-24" src={imgurl} alt="" />
  <footer class="flex justify-end w-full">
    <a
      href="/{index}"
      class="p-2 text-red-600 hover:text-red-700 cursor-pointer"
      use:link
    >
      <svg fill="none" viewBox="0 0 16 16" class="w-6 h-6 fill-current">
        <path
          d="M8 9.986H3a1 1 0 01-1-1v-2a1 1 0 011-1h5v-2a1 1 0 011.7-.7l4 4a1 1
          0 010 1.4l-4 4a1 1 0 01-1.7-.7v-2z"
        />
      </svg>
    </a>
  </footer>
</article>
```

First we import `Link` and `link` from `svelte-routing`. `link` is a Svelte action (actions are functions that run when the element is created) that lets our native `a` tag behave like the `Link` component. We do this because the `Link` component won't pass our classes without some extra work.

Then we link up our header and add an `svg` to the footer that also links to our Detail.

{% figure 'svelte-pokedex-cards-with-link.png', 'Pokemon Card component with links.', 'Our updated Pokemon Cards' %}

Now if you click on the Pokemon name or Card icon you'll be taken to our temporary Detail page.

## Making the Pokemon Detail Component

Let's tackle the `Detail` route. The `Detail` route will fetch our data, process and store it in an object, and pass it on to a `PokemonDetail` component to display it.

### Fetching our Detail data

We'll need to fetch from two different endpoints to get all the data we want to display.

Let's start there. Update the `Detail.svelte` file:

`routes/Detail.svelte`

```svelte
<script>
  import { onMount } from 'svelte'
  import ky from 'ky'

  export let id

  async function getPokemon(id) {
    // pokemonIndex = params.id
    const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${id}/`
    const pokemonSpeciesURL = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    const pokemonGeneral = await ky.get(pokemonURL).json()
    const pokemonSpecies = await ky.get(pokemonSpeciesURL).json()

    console.log(pokemonGeneral)
    console.log(pokemonSpecies)
  }

  onMount(() => getPokemon(id))
</script>

<h1>Detail Page</h1>
<p>{id}</p>
```

If all goes well you should see two objects logged to the console when you visit a detail.

{% figure 'svelte-pokedex-detail-log.png', 'Console log of Pokemon data.', 'Logging our fetched Pokemon data.' %}

### Processing the Pokemon data

There's a lot of info in those two objects - we're only going to use some of it. We'll destructure the stuff we need and process/format it accordingly. Then we will bundle it all up in a `pokemon` object to pass along to a component to display.

First let's handle all that data:

`routes/Detail.svelte`

```svelte
<script>
  import ky from 'ky'

  import PokemonDetail from '../components/PokemonDetail.svelte'
  import { toTitleCase } from '../utils.js'

  export let id
  export let pokemon
  let loading = false
  let error

  $: getPokemon(id)

  const TYPE_COLORS = {
    bug: 'green-200',
    dark: 'orange-900',
    dragon: 'purple-600',
    electric: 'orange-400',
    fairy: 'pink-300',
    fighting: 'orange-800',
    fire: 'red-600',
    flying: 'purple-400',
    ghost: 'purple-700',
    grass: 'green-400',
    ground: 'yellow-500',
    ice: 'teal-200',
    normal: 'orange-300',
    poison: 'purple-800',
    psychic: 'red-500',
    rock: 'yellow-700',
    steel: 'gray-400',
    water: 'blue-600',
  }

  function getFlavorText(flavors) {
    // RANDOM FLAVOR TEXT
    let tempDescription = []
    tempDescription = flavors
      .filter(flavor => flavor.language.name === 'en')
      .map(item => item.flavor_text)

    const num = Math.floor(Math.random() * tempDescription.length)

    return tempDescription[num]
  }

  async function getPokemon(id) {
    const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${id}/`
    const pokemonSpeciesURL = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    try {
      loading = true
      const pokemonGeneral = await ky.get(pokemonURL).json()
      const pokemonSpecies = await ky.get(pokemonSpeciesURL).json()

      const {
        name,
        types,
        sprites,
        stats,
        abilities,
        height,
        weight,
      } = pokemonGeneral

      const {
        flavor_text_entries,
        capture_rate,
        growth_rate,
        gender_rate,
        egg_groups,
        evolves_from_species,
        genera,
      } = pokemonSpecies

      // POKEMON THEME (use the last type in the types array to determine)
      const pokemonTheme = TYPE_COLORS[types[types.length - 1].type.name]

      // GENDER RATIO
      const genderRate = gender_rate
      const genderRatio = {
        female: 12.5 * genderRate,
        male: 12.5 * (8 - genderRate),
      }

      //EGG GROUPS
      const eggGroups = egg_groups
        .map(group => toTitleCase(group.name, ' '))
        .join(', ')

      // ABILITIES
      const formattedAbilities = abilities
        .map(ability => toTitleCase(ability.ability.name, '-'))
        .join(', ')

      // Effort Values
      const evs = stats
        // filter out stats where effort is 0
        .filter(stat => {
          if (stat.effort > 0) {
            return true
          }
          return false
        })
        .map(stat => `${stat.effort} ${toTitleCase(stat.stat.name, '-')}`)
        .join(', ')

      // EVOLUTION
      let evolvesFrom
      if (evolves_from_species) {
        evolvesFrom = {
          name: toTitleCase(evolves_from_species.name, ' '),
          url: evolves_from_species.url.split('/')[
            evolves_from_species.url.split('/').length - 2
          ],
        }
      } else {
        evolvesFrom = undefined
      }

      const formattedStats = stats.map(stat => {
        return {
          name: toTitleCase(stat.stat.name, '-'),
          base_stat: stat.base_stat,
        }
      })

      // Species Variety
      const species = genera.filter(g => g.language.name === 'en')[0].genus

      loading = false

      pokemon = {
        name: toTitleCase(name, ' '),
        types: types.map(type => ({
          name: toTitleCase(type.type.name, ' '),
          color: TYPE_COLORS[type.type.name.toLowerCase()],
        })),
        description: getFlavorText(flavor_text_entries),
        sprites,
        stats: formattedStats,
        height,
        weight,
        captureRate: capture_rate,
        growthRate: toTitleCase(growth_rate.name, '-'),
        genderRatio,
        eggGroups,
        abilities: formattedAbilities,
        evs,
        evolvesFrom,
        pokemonTheme,
        species,
      }
    } catch (e) {
      const serverMessage = await e.response.text()
      loading = false
      error = serverMessage
    }
  }
</script>

<div class="container">
  {#if error}{error}{/if}
  {#if pokemon}
    <div class="w-full md:w-11/12 mx-auto">
      <PokemonDetail {pokemon} />
    </div>
  {:else if loading}LOADING{/if}
</div>
```

There's a lot going on in there.

We're importing `ky` and our `toTitleCase` utility. In addition we add two variables to do some very rudimentally managing of our `error` and `loading` states. We create an object of colors for our Pokemon types as well as a function to pull a random piece of text from the giant array of `flavor_text`.

We moved our `getPokemon` call out of `onMount` and into a reactive statement. This allows us to internally link to another Detail and display the data since `onMount` only fires, well, when the component mounts.

Our `getPokemon` function consists of a bunch of formatting of data and should be pretty straightforward to follow. It assigns our object to the `pokemon` prop. Once that happens, our `#if` block will display our data.

Visiting a detail route now should display a Pokemon name (or an error message if you supply an invalid id).

### Creating the Pokemon Detail component

Now let's use all that data to display a bunch of info about our Pokemon. Create a file called `PokemonDetail.svelte` inside our `components` folder.

We will be displaying some of our data as a bar so we will make a component for that. Add another file in `components` called `DataBar.svelte`. We'll use the Svelte `tweened` store which updates values over a fixed duration. This will tween our bar to the percentage to be filled.

`components/DataBar.svelte`

```svelte
<script>
  import { tweened } from 'svelte/motion'

  export let statColor
  export let value

  let amount = tweened(0)
  $: amount.set(value)
</script>

<div
  class="flex flex-col items-center justify-center text-white bg-{statColor}"
  style="width: {$amount}%;"
>
  <span class="text-xs">{value}</span>
</div>
```

Before moving on to `PokemonDetail` we'll make one more helper component to hold all the Pokemon images for display. Inside `components` add a file called `PokemonSprites.svelte` and insert the following code:

`components/PokemonSprite.svelte`

```svelte
<script>
  export let sprites
</script>

{#if sprites.front_default}
  <img alt="" src={sprites.front_default} />
{/if}
{#if sprites.back_default}
  <img alt="" src={sprites.back_default} />
{/if}

{#if sprites.front_female}
  <img alt="" src={sprites.front_female} />
{/if}
{#if sprites.back_female}
  <img alt="" src={sprites.back_female} />
{/if}

{#if sprites.front_shiny}
  <img alt="" src={sprites.front_shiny} />
{/if}
{#if sprites.back_shiny}
  <img alt="" src={sprites.back_shiny} />
{/if}

{#if sprites.front_shiny_female}
  <img alt="" src={sprites.front_shiny_female} />
{/if}
{#if sprites.back_shiny_female}
  <img alt="" src={sprites.back_shiny_female} />
{/if}
```

A series of `{#if}` checks are used to only create images for those that exist.

Finally, ur `PokemonDetail` component isn't anything too fancy. It simply takes in the `pokemon` object prop and uses it to display the data.

`components/PokemonDetail.svelte`

```svelte
<script>
  import { Link } from 'svelte-routing'

  import DataBar from './DataBar.svelte'
  import PokemonSprites from './PokemonSprites.svelte'

  export let pokemon

  const femaleColor = 'pink-600'
  const maleColor = 'blue-500'
</script>

<div class="border border-gray-500 rounded-lg overflow-hidden">
  <!-- <pre>{JSON.stringify(pokemon, null, 2)}</pre> -->
  <header class="flex justify-between p-4 bg-gray-200 border-b border-gray-500">
    <h1 class="text-lg">{pokemon.name}</h1>
    <div>
      {#each pokemon.types as type (type.name)}
        <span
          class="inline-block ml-1 py-1 px-2 text-xs text-white tracking-wide
          rounded-full bg-{type.color}"
        >
          {type.name}
        </span>
      {/each}
    </div>
  </header>

  <div class="p-4">
    <p>{pokemon.description}</p>

    <div class="grid grid-cols-8 gap-2">
      <PokemonSprites sprites={pokemon.sprites} />
    </div>

    <div class="flex flex-col lg:flex-row mt-6">

      <div class="w-full lg:w-7/12">
        <section>
          <h2 class="text-lg font-bold">Profile</h2>
          <dl class="flex flex-wrap text-sm">
            <dt class="w-5/12">Species:</dt>
            <dd class="flex-grow w-7/12">{pokemon.species}</dd>
            <dt class="w-5/12">Height:</dt>
            <dd class="flex-grow w-7/12">
              {pokemon.height / 10} m ({Math.round((pokemon.height * 0.328084 + 0.00001) * 100) / 100}
              lb)
            </dd>
            <dt class="w-5/12">Weight:</dt>
            <dd class="flex-grow w-7/12">
              {pokemon.weight / 10} kg ({Math.round((pokemon.weight * 0.220462 + 0.00001) * 100) / 100}
              lb)
            </dd>
            <dt class="w-5/12">Abilities:</dt>
            <dd class="flex-grow w-7/12">{pokemon.abilities}</dd>
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="text-lg font-bold">Training Stats</h2>
          <dl class="flex flex-wrap text-sm">
            <dt class="w-5/12">EV Yield:</dt>
            <dd class="flex-grow w-7/12">{pokemon.evs}</dd>
            <dt class="w-5/12">Capture Rate:</dt>
            <dd class="flex-grow w-7/12">{pokemon.captureRate}</dd>
            <dt class="w-5/12">Growth Rate:</dt>
            <dd class="flex-grow w-7/12">{pokemon.growthRate}</dd>
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="text-lg font-bold">Breeding Stats</h2>
          <dl class="flex flex-wrap text-sm">
            <div class="flex items-center justify-center w-full">
              <dt class="w-5/12">Gender Ratio (%F / %M):</dt>
              <div class="w-7/12">
                <dd class="flex flex-grow h-4">
                  <DataBar
                    value={pokemon.genderRatio.female}
                    statColor={femaleColor}
                  />
                  <DataBar
                    value={pokemon.genderRatio.male}
                    statColor={maleColor}
                  />
                </dd>
              </div>
            </div>
            <dt class="w-5/12">Egg Groups:</dt>
            <dd class="flex-grow w-7/12">
              {#each pokemon.eggGroups as egg}{egg}{/each}
            </dd>
          </dl>
        </section>

      </div>

      <div class="w-full lg:w-5/12">
        <section class="mt-6 lg:mt-0">
          <h2 class="text-lg font-bold">Base Stats</h2>
          <dl>
            {#each pokemon.stats as stat}
              <div class="flex items-center">
                <dt class="w-4/12">{stat.name}</dt>
                <dd class="w-7/12 h-4 text-sm bg-gray-200 rounded">
                  <DataBar
                    value={stat.base_stat}
                    statColor={pokemon.pokemonTheme}
                  />
                </dd>
              </div>
            {/each}
          </dl>
        </section>

      </div>

    </div>
  </div>

  <footer class="flex justify-center w-full p-4 border-t border-gray-500">
    {#if pokemon.evolvesFrom}
      <p>
        {pokemon.name} evolves from
        <Link to="/{pokemon.evolvesFrom.url}">
          <span class="underline">{pokemon.evolvesFrom.name}</span>
        </Link>
      </p>
    {:else}
      <p>{pokemon.name} does not evolve from another Pokemon</p>
    {/if}
  </footer>
</div>
```

{% figure 'svelte-pokedex-detail-complete.png', 'Fully rendered Pokemon detail', 'Our finished Detail page' %}

With that our Pokedex is complete.

[github](https://github.com/babycourageous/svelte-pokedex)

[demo](https://svelte-pokedex.netlify.com/)
