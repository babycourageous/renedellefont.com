---
title: 'Building a simple router component with Svelte and Navaid'
date: 2020-04-07
featuredimage: '/images/writing/navaid.png'
excerpt: Since there is no official client-side router for Svelte let's try to build our own version using the ultra-slim Navaid router.
category: svelte
type: tutorial
tags:
  - svelte
  - navaid
toc: true
draft: true
---

## Overview

## Svelte starter

svelte/template
`main.js`

```js
import App from './App.svelte'

const app = new App({
  target: document.body,
})

export default app
```

## Install navaid

```bash
npm i navaid -D
```

## Simple routing with navaid alone

### Single Page App config

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

### Components

`App.svelte`

```svelte
<script>
  import navaid from "navaid"

  import Home from "./pages/Home.svelte"
  import About from "./pages/About.svelte"

  // set default component
  let current = Home

  const router = navaid()

  // Map routes to page. If a route is hit the current
  // reference is set to the route's component
  router
    .on("/", () => (current = Home))
    .on("/about", () => (current = About))
    .listen()
</script>

<style>
  main {
    text-align: center
    padding: 1em
    max-width: 240px
    margin: 0 auto
  }

  h1 {
    color: #ff3e00
    text-transform: uppercase
    font-size: 4em
    font-weight: 100
  }

  @media (min-width: 640px) {
    main {
      max-width: none
    }
  }

  nav a {
    padding-right: 3rem
  }
</style>

<main>
  <nav>
    <a href="/">home</a>
    <a href="/about">about</a>
  </nav>
  <h1>Svelte Navaid Router Demo</h1>
  <svelte:component this={current} />
</main>
```

`pages/Home.svelte`

```svelte
<h2>Home</h2>
```

`pages/About.svelte`

```svelte
<h2>About</h2>
```

First, we wire up the router where each route when hit re-assigns the current var to its matched component.
Then our svelte:component tag sees that the reference has changed.
It then creates the new component and renders it.

Note on `<svelte:component>`
This Svelte directive works like this:

If its property `this` is `null` or `undefined` it ignores it and does nothing.
If you pass it a component it will create a new instance of the component and mount it.
If the var reference passed to `this` changes it will destroy old component and create and mount new one.

## Create Router Base

### Router

We will start with the router as it's the main file that will do the dirty work for us. Since we will do the routing in there we need to move the page.js to it.

slot means it will display its children.

```svelte
<script>
  import navaid from "navaid";
</script>

<slot />
```

### Route

We also need to declare the routes inside our router. For that we will use Svelte's slot. See slot as a placeholder into which you can put other components and html tags and stuff. Here is the file so far.

```svelte
<script>
  export let path = "/"
  export let component = null
</script>

<slot />
```

### NotFound

```html
<slot />
```

### Update App to use new Router components

```svelte
<script>
  import Router from './pager/Router.svelte';
  import Route from './pager/Route.svelte';
  import NotFound from './pager/NotFound.svelte';

  import Home from './pages/Home.svelte';
  import About from './pages/About.svelte';
</script>

<main>
  <nav>
    <a href="/">home</a>
    <a href="/about">about</a>
  </nav>

  <Router>
    <Route path="/" component="{Home}" />
    <Route path="/about" component="{About}" />
    <NotFound>
      <h2>Sorry. Page not found.</h2>
    </NotFound>
  </Router>
</main>
```

Start the app and now at least it should not give you compile errors. But it's not usable at all as we only got the structure, but not logic. Let's fill that part in. Back to our router.

Now, from our simple example in the beginning, we know that we have to use slots to render our components. How can we do that? We are passing path and components to individual routes, right? Add the following code line to the Route.svelte file right above the <slot /> tag and the components passed in will now be rendered.

```svelte
<svelte:component this="{component}" />
```

Great! Well, actually not THAT great as all components are shown at once, but at least some progress!

We now need to get back to the main router file and add some logic to it.

We need to share some data between the Router and the Route. We'll use context to share data between the parent Router component and child Route component. Since the data will change dynamically we will also make use of svelte stores.

## How to register a Route

- create route store
- add to store from the ROUTE component
-

## Create Route Base

## Create NotFound Base

Create navigate

Create Link
