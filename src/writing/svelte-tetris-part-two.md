---
title: 'Making Tetris with Svelte: part two - The Board and Pieces'
date: 2020-04-14
featuredimage: '/images/writing/svelte-tetris-featured.png'
excerpt: 'In the second installment we get our board and a piece rendered using the HTML canvas element.'
category: svelte
type: tutorial
tags:
  - svelte
toc: true
---

## Overview

**Part 1 -** [The Basic Set Up](/writing/svelte-tetris-part-one)
**Part 2 -** The Board and Pieces ([github](https://github.com/babycourageous/svelte-tetris/tree/02-board-and-pieces) | [preview](https://02-board-and-pieces--svelte-tetris.netlify.app/))
**Part 3 -** [Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
**Part 4 -** [SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
**Part 5 -** [Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
**Part 6 -** Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)

The board and the pieces are at the heard of every Tetris game. All the other components won't make sense until we have those two thing in place. We'll start slow and just get the basics on the screen and add interactivity later.

## The Tetris Board

The Tetris board is the area that the pieces fall. Our board will be 10 cells wide and 20 cells tall. Because of how our matrix is constructed the columns are numbered from left to right and the rows from top to bottom.

### Drawing The Board

The tetris board is an HTML `<canvas>` element. Our game will have 10 columns and 20 rows. Let's get something on the screen that more represents the size of the board.

From our main `Tetris` component we will pass the props our `Board` component needs. We'll be storing some values - like columns, rows, and block size - in a `constants` file since we will likely be referencing them a lot throughout the app.

`src/constants.js`

```js
// BOARD
export const COLS = 10 //width
export const ROWS = 20 // height
export const BG_COLOR = '#000000'

// PIECE
export const BLOCK_SIZE = 20
```

Inside `Tetris.svelte` import our constants and calculate the width and height of our HTML `canvas` just below our initial imports. Then pass our props into the `Board` component.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...
  // constants and data
  import { COLS, ROWS, BLOCK_SIZE } from '../constants.js'

  const canvasWidth = COLS * BLOCK_SIZE
  const canvasHeight = ROWS * BLOCK_SIZE
</script>

<div class="game">
  ...

  <Board width={canvasWidth} height={canvasHeight} />

  ...
</div>
```

In order to pass data from one component down to its children in Svelte we use the `export` keyword in the child component. This marks the variable as a prop that the child expects to recieve.

Open up `Board.svelte` and define our props using Svelte's `export` keyword. Then replace our placeholder text with an HTML canvas.

`src/containers/Board.svelte`

```svelte
<script>
  import Display from '../components/Display.svelte'

  export let width
  export let height
</script>

<Display>
  <canvas {width} {height} />
</Display>
```

{% figure 'svelte-tetris-initial-board-canvas.png', 'A blank canvas displayed.', 'A blank canvas for us to explore.' %}

### Defining The Board

Our Tetris board will be represented by a 2D array - aka matrix - that will correspond to all the cells of the board. Each piece will also be a matrix of cells. This way we can use some fancy array calculations to determine how to draw to the canvas as well as collisions and locking our pieces in place.

We'll leverage custom Svelte stores for all our data. The recommended approach is to create a store for each piece of data in order to keep our stores from getting too complicated.

Create a new folder inside `src` called `stores`. This will - as you can probably guess - hold all our stores. Let's kick things off with the store for our board.

`src/stores/board.js`

```js
import { writable } from 'svelte/store'

import { createEmptyMatrix } from '../matrixHelpers'
import { COLS, ROWS } from '../constants'

const initialState = createEmptyMatrix(COLS, ROWS)

function createBoard(initialBoard) {
  const { subscribe, set, update } = writable(initialBoard)
  return {
    subscribe,
    resetBoard() {
      set(createEmptyMatrix(COLS, ROWS))
    },
  }
}

export default createBoard(initialState)
```

We import `writable` from svelte as well as a helper function we'll create momentarily to create an empty matrix. We then create our store with a reset method and export it for use in our components.

Let's make that helper. In the `src` folder create a file called `matrixHelpers.js`. This is where we will centralize our matrix manipulation code.

`src/matrixHelpers.js`

```js
import { inRange, times, constant, partial, lessThan } from './utils'

/**
 * Create a matrix of "0"s given the number of columns and rows
 *
 * @param {Number} cols Number of columns
 * @param {Number} rows Number of rows
 * @returns {Array} Empty 2 dimensional array
 */
function createEmptyMatrix(cols, rows) {
  // create a single column
  const column = createEmptyArray(rows)
  // callback function to create the row
  const createRow = partial(createEmptyArray, cols)
  // for each column create a row and return matrix
  return column.map(createRow)
}

/**
 * Creates an array with length "length" filled with "0"s
 *
 * @param {Number} length The length of the returned empty array
 * @returns {Array} An empty array
 */
const createEmptyArray = length => times(length, constant(0))

export { createEmptyMatrix, createEmptyArray }
```

All we need at this point is our `createEmptyMatrix` function as well as a function to create an empty array of constants.

Head over to our main `Tetris` file. Let's introduce our store to the file and log the results just to see what our matrix looks like.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...
  import { COLS, ROWS, BLOCK_SIZE } from '../constants.js'

  // stores
  import board from '../stores/board.js'

  console.table($board)

  const canvasWidth = COLS * BLOCK_SIZE
  const canvasHeight = ROWS * BLOCK_SIZE
</script>

<div class="game">
...
</div>

<style>
...
</style>
```

Below our constants import we import our board store. Svelte allows us to access stores by prefixing the reference with a `$` character. This sets up our store subscription automatically that will also be unsubscribed to when relevant.

All we do then is log our board in a `console.table`. If you check your console output it should look like this:

{% figure 'svelte-tetris-board-log.png', 'The console log of the tetris board matrix.', 'Our board matrix.' %}

Before we can add pieces to our board, we actually NEED pieces to add. Let's take a quick break from our board and work on our Tetris pieces - the **Tetrominos**.

## The Pieces

A piece in Tetris is called a tetromino. It is a shape consisting of four blocks that come in seven different patterns and colors. The patterns look like the letters I, J, L, O, S, T, and Z.

### Defining The Tetrominos

The tetromino will be an object with id, name, color, and matrix properties. The matrix will be the representation of each tetromino shape as a 2 dimensional array (a smaller version of how we defined the board).

Inside our `src` directory create a file called `tetrominos.js`. In here we will define our array of tetrominos as well as some related helper functions.

`src/tetrominos.js`

```js
let id = 0

const colors = {
  t: '#6B46C1',
  j: '#F6AD55',
  z: '#E53E3E',
  o: '#F6E05E',
  s: '#68D391',
  l: '#2B6CB0',
  i: '#4FD1C5',
}

const matrixes = {
  t: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  j: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  o: [
    [1, 1],
    [1, 1],
  ],
  s: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  l: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  i: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
}

function createPiece(name, color, matrix) {
  id++

  // map non-zero values to the id of this piece
  matrix = matrix.map(row => row.map(value => (value === 0 ? 0 : id)))

  return {
    name,
    id,
    color,
    matrix,
    x: 0,
    y: 0,
  }
}

const tetrominos = [
  createPiece('I', colors.i, matrixes.i),
  createPiece('L', colors.l, matrixes.l),
  createPiece('J', colors.j, matrixes.j),
  createPiece('O', colors.o, matrixes.o),
  createPiece('T', colors.t, matrixes.t),
  createPiece('S', colors.s, matrixes.s),
  createPiece('Z', colors.z, matrixes.z),
]

export default tetrominos
```

Up top we define an `id` that we will use for our tetromino object `id`. Then we define a color and matrix for each "letter". We then create our tetrominos array with the help of the function `createPiece` which takes a letter, color, and matrix and spits out our tetromino object.

### Displaying A Tetromino

Since throughout the game we will be spawning new pieces to the board we will use another custom store to keep track of the current piece displayed. We'll add more methods later but for now we will simply define our store and a method to set the current piece.

> We could just as easily be exporting the store's `set` method and set our currentPiece with `$currentPiece = the_new_piece`. I'm just setting up all our stores to be explicit with the allowed functionality.

Add the file `currentPiece.js` inside our `stores` folder with the following code:

`src/stores/currentPiece.js`

```js
import { writable } from 'svelte/store'

const initialState = null

function createCurrentPiece(initialPiece) {
  const { set, update, subscribe } = writable()
  return {
    subscribe,
    setCurrentPiece: piece => set(piece),
  }
}

export default createCurrentPiece(initialState)
```

In this case we default our store to be `null` because we will assign a random piece from our game.

We are going to make use of another constant in our `Tetris.svelte` file so let's define that quick.

Update the `constants.js` file with this new constant:

`src/constants.js`

```js
// GENERAL
// key for Svelte context
export const TETRIS = {}
...
```

We will use Svelte's `Context API` to pass our stores to the children components of `Tetris`. The Context API has two methods: `setContext` and `getContext`. We'll `setContext` using the `TETRIS` constant as our key. Even though the context key can be anything (string, number, etc) we will use the TETRIS variable so that the key is an object literal. This means the key won't conflict in any circumstance since an object only has referential equality to itself, i.e. `{} !== {}` (unlie a string where `"x" === "x"`).

`src/containers/Tetris.svelte`

```svelte
<script>
  import { setContext } from 'svelte'
  ...

  // constants & data
  import { COLS, ROWS, BLOCK_SIZE, TETRIS } from '../constants.js'
  import tetrominos from '../tetrominos.js'

  // stores
  import board from '../stores/board.js'
  import currentPiece from '../stores/currentPiece.js'

  // initialize context
  currentPiece.setCurrentPiece(tetrominos[1])
  setContext(TETRIS, { currentPiece, board })
  ...
</script>
```

First, we import our `TETRIS` object form our constants file. We also import our new array of tetrominos and our `currentPiece` store. We then set our current piece to the 2nd item in the tetrominos array (remember arrays are zero indexed) before setting our context with an object containing our store and board.

Before we update `Board.svelte` to actually handle drawing the piece to the board, we are going to put all our functions that deal with drawing to the canvas in another helper file. Create `canvasHelpers.js` inside our `src` folder and copy the following code:

`src/canvasHelpers.js`

```js
import { BLOCK_SIZE, BG_COLOR } from './constants'
import tetrominos from './tetrominos'

/**
 * Gets a piece color from an object for the piece with the provided id.
 *
 * @param {Number} id The id of the object to find
 * @returns {String} The HEX color of the piece
 */
const getColorForID = id => tetrominos.find(o => o.id === id).color

/**
 * Draw a single block to the canvas at the row and column provided
 *
 * @param {CanvasRenderingContext2D} context the canvas
 * @param {Number} row the row to draw to
 * @param {Number} col the column to draw to
 * @param {String} color the HEX color of the block
 */
function drawBlock(context, row, col, color) {
  // scale the coordinates up
  const x = row * BLOCK_SIZE
  const y = col * BLOCK_SIZE
  const w = BLOCK_SIZE
  const h = BLOCK_SIZE

  context.fillStyle = color
  context.fillRect(x, y, w, h)

  drawHighlight(context, x, y, w, h)
}

/**
 * Draws a highlight to a block within the given context
 *
 * @param {CanvasRenderingContext2D} context The context to draw to.
 * @param {Number} x The x coordinate for the fill
 * @param {Number} y The y coordinate for the fill
 * @param {Number} w  The width of the block
 * @param {Number} h The height of the block
 */
function drawHighlight(context, x, y, w, h) {
  context.beginPath()
  context.moveTo(x, y)
  context.lineTo(x + w, y)
  context.lineTo(x + w - 2, y + h - 18)
  context.lineTo(x + w - 18, y + 2)
  context.closePath()
  context.fillStyle = `rgba(255, 255, 255, .2)`
  context.fill()

  context.beginPath()
  context.moveTo(x + w, y)
  context.lineTo(x + w, y + h)
  context.lineTo(x + w - 2, y + h - 2)
  context.lineTo(x + w - 2, y + 2)
  context.closePath()
  context.fillStyle = `rgba(255,255,255, .2)`
  context.fill()

  context.beginPath()
  context.moveTo(x + w, y + h)
  context.lineTo(x, y + h)
  context.lineTo(x + 2, y + h - 2)
  context.lineTo(x + w - 2, y + h - 2)
  context.closePath()
  context.fillStyle = `rgba(0,0,0, .4)`
  context.fill()

  context.beginPath()
  context.moveTo(x, y + h)
  context.lineTo(x, y)
  context.lineTo(x + 2, y + 2)
  context.lineTo(x + 2, y + h - 2)
  context.closePath()
  context.fillStyle = `rgba(0,0,0, .2)`
  context.fill()
}

/**
 * Draws a rectangle representing a board
 *
 * @param {CanvasRenderingContext2D} context The canvas 2D context
 * @param {Array} boardMatrix The 2D array to use as our coordinates
 */
function drawBoard(context, boardMatrix) {
  drawMatrix(context, boardMatrix, 0, 0)
}

/**
 * Draw a single tetromino to an HTML canvas
 *
 * @param {CanvasRenderingContext2D} context The canvas 2D context
 * @param {Object} piece The piece object to use
 */
function drawPiece(context, piece) {
  drawMatrix(context, piece.matrix, piece.x, piece.y)
}

/**
 * Clears then draws a board and current piece to the canvas
 *
 * @param {CanvasRenderingContext2D} context The canvas 2D context
 * @param {Array} board The 2D array to use as our coordinates
 * @param {Object} currentPiece The piece object to use
 */
function drawGame(context, board, currentPiece) {
  clearCanvas(context, BG_COLOR)
  // if (config.showGuideLines && !isMidnightMode()) {
  // drawGuideLines(context)
  // }
  drawBoard(context, board)
  drawPiece(context, currentPiece)
}

/**
 * Renders the provided matrix to a canvas
 * @param {CanvasRenderingContext2D} context The canvas 2D context
 * @param {Array} matrix The 2D array to use as our coordinates
 * @param {Number} xOffset
 * @param {Number} yOffset
 */
function drawMatrix(context, matrix, xOffset = 0, yOffset = 0) {
  matrix.map((col, colIndex) => {
    col.map((row, rowIndex) => {
      if (row !== 0) {
        drawBlock(context, rowIndex + xOffset, colIndex + yOffset, getColorForID(row))
      }
    })
  })
}

/**
 * Reset the canvas
 *
 * @param {CanvasRenderingContext2D} context The canvas 2D context
 * @param {String} color The color to fill the resulting rectangle with
 */
function clearCanvas(context, color) {
  context.fillStyle = color
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)
}

export default {
  drawGame,
  drawMatrix,
  clearCanvas,
}
```

There's a lot to breakdown but the comments should give some more detail to what's happening. For an overview here's the general purpose of each function:

- **getColorForID** returns the color for a provided piece id
- **drawBlock** - draws a block with highlights (for tetrominos)
- **drawHighlight** - draws a highlight on a tetromino block
- **drawBoard** - draws the board
- **drawPiece** - draws a piece
- **drawGame** - clears the canvas and then draws the board and piece
- **drawMatrix** - renders a matrix to the canvas
- **clearCanvas** - resets the canvas to a color

Now let's get that piece drawn to our canvas.

`src/containers/Board.svelte`

```svelte
<script>
  import { onMount, getContext } from 'svelte'

  import { TETRIS } from '../constants'
  import canvasHelper from '../canvasHelpers.js'
  import Display from '../components/Display.svelte'

  export let width
  export let height

  let canvas
  let ctx

  const { currentPiece, board } = getContext(TETRIS)

  function drawCanvas() {
    canvasHelper.drawGame(ctx, $board, $currentPiece)
  }

  onMount(() => {
    ctx = canvas.getContext('2d')
    drawCanvas()
  })
</script>

<Display>
  <canvas bind:this={canvas} {width} {height} />
</Display>
```

Up top we import `onMount` and `getContext` from Svelte along with the context key `TETRIS`. We also import our canvasHelpers.

We define a variable, `canvas`, that we will use to bind a reference of our canvas to. The `drawCanvas` function calls on our canvas helper to draw our game. We also get our canvas context and call `drawCanvas` from our `onMount` lifecyle.

We have to put the logic to get the canvas context in `onMount` because the value of the `canvas` prop will be undefined until the component has mounted.

Fire up the app and you should see a piece drawn to our board canvas.

{% figure 'svelte-tetris-board--and-piece.png', 'The game board with a single tetromino piece.' 'Voila! We have a tetromino!' %}

## Randomizing Tetrominos

Ideally we don't just want to hard code our pieces to the game. We want to spawn random new pieces.

Inside our main `Tetris` component we will create a very basic function to pull a random piece from our tetrominos array. We'll use the random number it returns as the index for which piece in the tetrominos array to grab.

`src/containers/Tetris.svelte`

```svelte
<script>
  import { setContext } from 'svelte'

  // components
  import Statistics from './Statistics.svelte'
  import Lines from './Lines.svelte'
  import Board from './Board.svelte'
  import Score from './Score.svelte'
  import NextPiece from './NextPiece.svelte'
  import Level from './Level.svelte'

  // constants and data
  import { COLS, ROWS, BLOCK_SIZE, TETRIS } from '../constants.js'
  import tetrominos from '../tetrominos'

  // stores
  import board from '../stores/board.js'
  import currentPiece from '../stores/currentPiece.js'

  // initialize context
  currentPiece.setCurrentPiece(getRandomPiece())
  setContext(TETRIS, { currentPiece, board })

  const canvasWidth = COLS * BLOCK_SIZE
  const canvasHeight = ROWS * BLOCK_SIZE

  /**
   * Returns a random piece from the tetromino matrix.
   * @returns {Object} The piece object
   */
  function getRandomPiece() {
    const l = tetrominos.length
    const i = Math.floor(Math.random() * l)
    return tetrominos[i]
  }
</script>

<div class="game">
  ...
</div>

<style>
  ...
</style>
```

### Initialization Refactor

Before we call it quits on this installment let's refactor a bit.

We are going to move our main initialization into a separate function we'll call `resetGame`. It will allow us to easily reset our game on command.

For now, the reset function will be where our `currentPiece` initialization will live. So remove that from below the `setContext` call and place it in the `resetGame` function. We'll call `resetGame` from inside an `onMount` lifecycle.

`src/containers/Tetris.svelte`

```svelte
<script>
  import { setContext, onMount } from 'svelte'

  ...

  // initialize context
  setContext(TETRIS, { currentPiece, board })

  ...

  function resetGame() {
    // initialize stores
    currentPiece.setCurrentPiece(getRandomPiece())
  }

  onMount(() => {
    // reset values
    resetGame()
  })
</script>
```

This minor adjustment will break our game. This is because when the `Board` mounts the store isn't defined yet. It attempts to draw a piece and bingo bango big fat error.

Since there's no current piece when the component mounts, the first thing we have to do is remove our call to `drawCanvas` from `onMount`.

We want our component to rerender when the current piece updates. The component has to _react_ to a change. Another cool Svelte trick comes to the rescue - **reactive statements**. Reactive statements run immediately before the component updates whenever the values that they depend on have changed.

In our case our reactivity depends on the `currentPiece` so we'll add a reactive statement that draws the canvas only if a current piece exists.

> We could just as easily go back through our `canvasHelpers` code to put checks and balances in there. As far as I know it's really a personal preference and this just seemed easier.

`src/containers/Board.svelte`

```svelte
<script>
  ...

  const { currentPiece, board } = getContext(TETRIS)

  $: $currentPiece && drawCanvas()

  function drawCanvas() {
    canvasHelper.drawGame(ctx, $board, $currentPiece)
  }

  onMount(() => {
    ctx = canvas.getContext('2d')
  })
</script>

<Display>
  <canvas bind:this={canvas} {width} {height} />
</Display>
```

Now when you refresh the browser our random tetromino will once again be displayed.

## Wrapping Up

We've got our basics wrapped up. our little fledgling game is starting to look like Tetris. But it still feels like a work in progress. In the next installment of this series we'll add player interaction and collision detection.

[Part One - The Basic Set Up](/writing/svelte-tetris-part-one)
Part Two - The Board and Pieces ([github](https://github.com/babycourageous/svelte-tetris/tree/02-board-and-pieces) | [preview](https://02-board-and-pieces--svelte-tetris.netlify.app/))
[Part Three - Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
[Part Four - SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
[Part Five - Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
Part 6 - Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)
