---
title: Building A Currency Converter With Svelte
date: 2020-02-07
featuredimage:
excerpt:
category: svelte
type: tutorial
tags:
  - svelte
toc: true
---

## Install Svelte

`npx degit`

## Clean Up Default Setup

Remove props from `main.js`

```js
import App from './App.svelte'

const app = new App({
  target: document.body,
})

export default app
```

Clean Up `App.svelte`

- Remove prop export
- Remove default styles
- Simplify Markup

```svelte
<script>
</script>

<main>
	<h1>Currency Converter</h1>
</main>

<style>

</style>
```

## Quick Default Markup and Styles

Let's set up a quick proof of concept. Nothing more than some HTML and styles.

### The Markup

We'll use the HTML `<dataset>` tag to specify a list of pre-defined options for an `<input>` element. Using a `<dataset>` tag will provide an "autocomplete" feature on its parent `<input>` element.

```svelte
<main>
  <div class="card">
    <h1>Currency Converter</h1>
    <div class="input-control">
      <label for="amountToConvert">Amount to convert:</label>
      <input
        id="amountToConvert"
        name="amountToConvert"
        type="number"
        min="0"
        placeholder="Amount" />
    </div>

    <div class="currency-container">
      <div class="currency-control">
      <label for="fromCurrency">Convert From:</label>
        <input
          id="fromCurrency"
          name="fromCurrency"
          class="currency-input"
          maxlength="3"
          list="fromCurrencyList"
        />
        <datalist id="fromCurrencyList">
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </datalist>
      </div>

      <button class="svg-control">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path
            d="M377.941
            169.941V216H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029
            239.029c-9.373 9.373-9.373 24.568 0 33.941l86.059 86.059c15.119
            15.119 40.971 4.411 40.971-16.971V296h243.882v46.059c0 21.382 25.851
            32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.568
            0-33.941l-86.059-86.059c-15.119-15.12-40.971-4.412-40.971 16.97z" />
        </svg>
      </button>

      <div class="currency-control">
        <label for="toCurrency">Convert To:</label>
        <input
          id="toCurrency"
          name="toCurrency"
          class="currency-input"
          maxlength="3"
          list="toCurrencyList" />
        <datalist id="toCurrencyList">
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </datalist>
      </div>
    </div>

    <div class="amount">
      <p>Conversion Result Goes Here.</p>
    </div>

  </div>
</main>
```

### The Styles

Next let's define some default global styles.

```
<style>
  :global(html) {
    box-sizing: border-box;
  }
  :global(*),
  :global(*):before,
  :global(*):after {
    box-sizing: inherit;
  }
  :global(body) {
    padding-top: 2rem;
    background-color: #fafafa;
  }
</style>
```

In Svelte, styles are scoped to the component. This means that any non-component styles (such as you might have in a global.css file) will not apply to the element. To apply styles to a selector globally, we use the `:global(...)` modifier.

Now, let's update the styles for the other elements on the page. Add the following below the global styles:

```svelte
  main {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .card {
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    background-color: #fff;
  }
  h1 {
    width: 100%;
    margin: 0;
    padding: 0.5rem 1rem;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    color: white;
    font-weight: 200;
    background-color: #2f855a;
  }
  .input-control {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding-top: 1rem;
  }
  input {
    display: block;
    margin-bottom: 0;
    padding: 0.5rem 0.75rem;
    background-color: #fff;
    border-color: #e2e8f0;
    border-width: 1px;
    border-radius: 0.25rem;
    font-size: 1rem;
    line-height: 1.5;
  }
  .currency-container {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    text-align: center;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  .currency-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60%;
    padding-left: 1rem;
    padding-right: 1rem;
    border-bottom-left-radius: 0.25rem;
  }
  .currency-input {
    width: 100%;
  }
  .svg-control {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    background: transparent;
    border: 2px solid transparent;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .svg-control:focus {
    border: 2px solid #e2e8f0;
  }
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  .amount {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    padding-bottom: 0.5rem;
  }

  @media (min-width: 640px) {
    .card {
      width: 50%;
    }
    .currency-container {
      flex-direction: row;
    }
    .currency-control {
      width: 100%;
    }
  }
  @media (min-width: 1024px) {
    .card {
      max-width: 36rem;
    }
  }
```

## Updating the datalist with real data

The list of currencies is initialized in the onMount() using exchangerates API. The values received will be used to populate the `datalist`.

### Fetch the Exchange Rates

Every component has a lifecycle that starts when it is created, and ends when it is destroyed. There are a handful of functions that allow you to run code at key moments during that lifecycle.

The one you'll use most frequently is onMount, which runs after the component is first rendered to the DOM. We briefly encountered it when we needed to interact with a `<canvas>` element after it had been rendered.

The onMount function schedules a callback to run as soon as the component has been mounted to the DOM. It must be called during the component's initialisation (but doesn't need to live inside the component; it can be called from an external module).

It's recommended to put the fetch in onMount rather than at the top level of the `<script>` because of server-side rendering (SSR). With the exception of onDestroy, lifecycle functions don't run during SSR, which means we can avoid fetching data that should be loaded lazily once the component has been mounted in the DOM.

```svelte
<script>
  import { onMount } from "svelte";
  import CurrencySelect from "./components/CurrencySelect.svelte";

  const BASE_URL = "https://api.exchangeratesapi.io/latest";

  onMount(async () => {
    const res = await fetch(`${BASE_URL}?base=${from}`);
    const data = await res.json()
    console.log(data)
})
</script>
```

{% figure 'rates-json.png', 'The exchange rates API return data.', 'Rates property logged to console.' %}

### Populate Datalist

Decalare state by defining variables with `let`. In Svelte assignments are reactive so whenever we assign a new value to a variable in a component it re-renders.

Initialize `currencies` to empty array. Then populate it and sort it alphabetically when the fetch completes.

```svelte
<script>
  import { onMount } from "svelte";
  import CurrencySelect from "./components/CurrencySelect.svelte";

  const BASE_URL = "https://api.exchangeratesapi.io/latest";

  let currencies = [];

  onMount(async () => {
    const res = await fetch(`${BASE_URL}?base=${from}`);
    const data = await res.json();

    currencies = [from, ...Object.keys(data.rates)].sort();
  });
</script>
```

Now we can use the `currencies` array in our markup. Using Svelte's `#each` directive we can loop through the array of currencies and create an `<option>` for each item.

Replace the two `<input>`/`<dataset>` groups with the following:

```svelte
<input
  id="fromCurrency"
  name="fromCurrency"
  class="currency-input"
  maxlength="3"
  list="fromCurrencyList" />
<datalist id="fromCurrencyList">
  {#each currencies as option}
    <option>{option}</option>
  {/each}
</datalist>

...

<input
  id="toCurrency"
  name="toCurrency"
  class="currency-input"
  maxlength="3"
  list="toCurrencyList" />
<datalist id="toCurrencyList">
  {#each currencies as option}
    <option>{option}</option>
  {/each}
</datalist>
```

### Set Defaults

Now, to set some defaults for the input and dataset selections. Define variables to hold the default value of the `<input>` **amount** as well as **from** and **to** values for each `<dataset>`.

For the main `input` element we will use the `bind:value` directive to create two-way binding with our `amount` variable. This means that not only will changes to the value of the `amount` variable update the `input` value, but changes to the `input` value will update `amount`.

We aren't going to use `bind:value` with the datalist elements because we need to perform some checks with those inputs. Namely since our currency codes are uppercase making sure the inputs are uppercase when entering text.

While we are at it we will bind a focus event that will select the entire datalist input when we focus it.

```svelte
<script>
  import { onMount } from "svelte";
  import CurrencySelect from "./components/CurrencySelect.svelte";

  const BASE_URL = "https://api.exchangeratesapi.io/latest";

  let currencies = [];
  let amount = 0;
  from = "EUR";
  to = "USD";

  ...

  function handleFocus() {
    this.select()
  }

  function handleInput(e) {
    if (e.target.name === "fromCurrency") {
      from = e.target.value.toUpperCase();
    } else {
      to = e.target.value.toUpperCase();
    }
  }

</script>

<style>
...
</style>

<main>
...
<div class="input-control">
  <input
    type="number"
    bind:value={amount}
    min="0"
    placeholder="Amount"
  />
</div>

<div class="currency-container">
  <div class="currency-control">
    <input
      id="fromCurrency"
      name="fromCurrency"
      class="currency-input"
      maxlength="3"
      value={from}
      on:input={handleInput}
      on:focus={handleFocus}
      list="fromCurrencyList" />
    <datalist id="fromCurrency">
      {#each currencies as option}
        <option>{option}</option>
      {/each}
    </datalist>
  </div>

...

  <div class="currency-control">
      <input
        id="toCurrency"
        name="toCurrency"
        class="currency-input"
        maxlength="3"
        value={to}
        on:input={handleInput}
        on:focus={handleFocus}
        list="toCurrencyList" />
      <datalist id="toCurrencyList">
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </datalist>
    </div>
  </div>

...

</main>
```

## Using the Exchange Rates

We've already used the return data from our `onMount` function to create our list of currencies. The return data also has all the exchange rates for a base "from" currency of **Euro**.

### Set Exchange Rates

We are going to store the exchange rates returned in an object aptly called `exchangeRates`. Later on we will use this list of rates to recalculate the rates if we can before we hit the API again. This way we don't have to make an unnecessary `fetch` call.

We'll also store our current rate in a variable called, you guessed it, `currentRate`.

Declare the `exchangeRates` and `currentRate` variables alongside our other variables and then populate them in the `onMount` function.

```svelte
<script>
  ...

  let currencies = [];
  let amount = 1;
  let from = "EUR";
  let to = "USD";
  let exchangeRates = {};
  let currentRate = 0;

  onMount(async () => {
    const res = await fetch(`${BASE_URL}?base=${from}`);
    const data = await res.json();

    currencies = [from, ...Object.keys(data.rates)].sort();
    exchangeRates = { ...data.rates, [from]: 1 };
    currentRate = exchangeRates[to];
  });

  ...
</script>
```

### Calculate and Display Currency Conversion

We'll use a computed property or as Svelte calls them reactive statement to hold our calculated amount. In Svelte, `$:` allows us to run statements reactively. Reactive statements run immediately before the component updates, whenever the values that they depend on have changed.

In our case we will calculate the currency conversion whenever the `amount` or `currentRate`change.

Add the following below our other variable declarations:

```svelte
  $: convertedAmount = (amount * currentRate).toFixed(3);
```

Then we will update the placeholder text at the bottom of our markdown. This will check that our `amount`, `from`, or `to` variables aren't undefined before displaying our conversion result.

```svelte
<main>

...

    <div class="amount">
      {#if amount === undefined || from === undefined || to === undefined}
        <p>Please enter a valid amount.</p>
      {:else}
        <p>{amount} {from} = {convertedAmount} {to}</p>
      {/if}
    </div>

  </div>
</main>

```

## More Currency Rate Integration

Now that we have our rates for the default currencies we can add the functionality to switch our currency inputs as well as either pulling a new rate from our `exchangeRates` object or fetching new rates when we update the currency inputs.

### Flipping Currencies

Let's start with adding the ability to switch our from and to currency inputs when we click the double arrow button between them. This is one of the reasons we stored the fetched rates. We'll keep track of each time we flip our from and to currencies and recalculate our rates accordingly. There's no need to make a network request!

First add the following declaration with the rest of them:

```svelte
<script>

...
let isFlipped = false
...

</script>
```

We initialize to false since at the start currencies are in their original positions. We'll flip the `isFlipped` boolean each time we swap currencies.

We will also update our `exchangeRates` and `currentRate` values.

````svelte
  function switchCurrency() {
    isFlipped = !isFlipped;
    [from, to] = [to, from];

    Object.keys(exchangeRates).map(function(key) {
      exchangeRates[key] = 1 / exchangeRates[key];
    });
  currentRate = 1 / currentRate;
}

Then in the markup call the function in an `on:click` directive to the button.

```svelte
<main>
...
<button class="svg-control" on:click={switchCurrency}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
      d="M377.941
      169.941V216H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029
      239.029c-9.373 9.373-9.373 24.568 0 33.941l86.059 86.059c15.119
      15.119 40.971 4.411 40.971-16.971V296h243.882v46.059c0 21.382 25.851
      32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.568
      0-33.941l-86.059-86.059c-15.119-15.12-40.971-4.412-40.971 16.97z" />
  </svg>
</button>
...
</main>
````

### Updating the Current Rate

The final piece of the puzzle is updating currency rates when we change our currency via the inputs. If we haven't switched them, then updates to the `to` currency should come from the exisiting `exchangeRates` object. Otherwise we are changing our `from` base currency and need to fetch a new batch of exchange rates. If they have been switched, then the inverse should be true.

We'll add a function to fetch rates (below the `onMount` function) as well as two change handlers. One for each input. They will be similar in functionality with those slight differences depending on the state of the app.

```svelte
<script>
...

  async function fetchRates(base, current) {
    isFlipped = false;
    const res = await fetch(`${BASE_URL}?base=${base}`);
    const data = await res.json();

    exchangeRates = data.rates;
    if (base === "EUR") {
      exchangeRates["EUR"] = 1;
    }
    currentRate = data.rates[current];
  }

</script>
```

This API doesn't include the 1:1 EUR rate if EUR is the base so we check for that and add it manually.

Below that add the two change handler functions:

```svelte
  function handleFromCurrencyChange(e) {
    if (isFlipped) {
      // pull from existing list
      currentRate = exchangeRates[from];
    } else {
      // fetch new list
      fetchRates(from, to);
    }
  }

  function handleToCurrencyChange(e) {
    if (isFlipped) {
      // fetch new list
      fetchRates(to, from);
    } else {
      // pull from existing list
      currentRate = exchangeRates[to];
    }
  }
```

As mentioned these do very similar tasks just in inverse ways depening on the input that changed and status of flipped.

Update each input component with the new handlers:

```svelte
<main>
  ...

  <input
    id="fromCurrency"
    name="fromCurrency"
    class="currency-input"
    maxlength="3"
    value={from}
    on:input={handleInput}
    on:focus={handleFocus}
    on:change={handleFromCurrencyChange}
    list="fromCurrencyList" />
  <datalist id="fromCurrencyList">
    {#each currencies as option}
      <option>{option}</option>
    {/each}
  </datalist>
  ...

  <input
    id="toCurrency"
    name="toCurrency"
    class="currency-input"
    maxlength="3"
    value={to}
    on:input={handleInput}
    on:focus={handleFocus}
    on:change={handleToCurrencyChange}
    list="toCurrencyList" />
  <datalist id="toCurrencyList">
    {#each currencies as option}
      <option>{option}</option>
    {/each}
  </datalist>

  ...

</main>
```

With that our Currency Converter is complete.

## Refactor Converter into separate component

`components/CurrencySelect.svelte`

```svelte
<style>
  select {
    display: block;
    width: 100%;
    margin: 0;
    padding-top: 0.5rem;
    padding-right: 2.5rem;
    padding-bottom: 0.5rem;
    padding-left: 0.75rem;
    background-color: #fff;
    border-color: #e2e8f0;
    border-width: 1px;
    border-radius: 0.25rem;
    font-size: 1rem;
    line-height: 1.5;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'%3e%3cpath d='M15.3 9.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4l3.3 3.29 3.3-3.3z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1.5em 1.5em;
    background-color: #fff;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
</style>

<select>
  <option>1</option>
  <option>2</option>
  <option>3</option>
</select>
```

`App.svelte`

```svelte
<script>
  import CurrencySelect from "./components/CurrencySelect.svelte";
</script>

<style>
  ...
</style>

<main>
  <div class="card">
    <h1>Currency Converter</h1>
    <div class="input-control">
      <input type="number" min="0" placeholder="Amount" />
    </div>

    <div class="currency-container">
      <div class="currency-control">
        <CurrencySelect />
      </div>

      <button class="svg-control">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path
            d="M377.941
            169.941V216H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029
            239.029c-9.373 9.373-9.373 24.568 0 33.941l86.059 86.059c15.119
            15.119 40.971 4.411 40.971-16.971V296h243.882v46.059c0 21.382 25.851
            32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.568
            0-33.941l-86.059-86.059c-15.119-15.12-40.971-4.412-40.971 16.97z" />
        </svg>
      </button>

      <div class="currency-control">
        <CurrencySelect />
      </div>
    </div>

    <div class="amount">
      <p>Conversion Result Goes Here.</p>
    </div>
  </div>
</main>
```

## OLD FETCH DATA

Pass to CurrencySelect.

`./components/CurrencySelect.svelte`

First define a property in the CurrencySelect component to accept the list of currencies.

`./components/CurrencySelect.svelte`

```svelte
<script>
  export let currencies = [];
</script>

<style>
...
</style>

<select>
  {#each currencies as option, (option)}
    <option value={option}>{option}</option>
  {/each}
</select>
```

Then in `App.svelte` pass each `CurrencySelect` component the array of currencies.

```svelte
<CurrencySelect {currencies} />
```

Next in `CurrencySelect.svelte` we will define the prop to hold the selected currency value and bind each `select` element to that value.

`./components/CurrencySelect.svelte`

```svelte
<script>
  export let currencies = [];
  export let selectedCurrency;
</script>

<style>
...
</style>

<select bind:value={selectedCurrency}>
  {#each currencies as option}
    <option value={option}>{option}</option>
  {/each}
</select>
```

## SET DEFAULT OG

Finally inside `App.svelte` pass the default values to each `CurrencySelect` component.

```svelte
  <main>
  <h1>Currency Converter</h1>
  ...
  <div class="currency-control">
    <CurrencySelect {currencies} selectedCurrency={from} />
  </div>

  ...

  <div class="currency-control">
    <CurrencySelect {currencies} selectedCurrency={to} />
  </div>

  ...

</main>
```
