---
title: 'Making Tetris with Svelte: part six - Next Piece, Levels, Lines, Score, and Statistics'
date: 2020-05-01
featuredimage: '/images/writing/svelte-tetris-featured.png'
excerpt: "Now that our game is chugging along it's time to update all our display modules with data-driven displays."
category: svelte
type: tutorial
tags:
  - svelte
toc: true
---

## Overview

**Part 1 -** [The Basic Set Up](/writing/svelte-tetris-part-one)
**Part 2 -** [The Board and Pieces](/writing/svelte-tetris-part-two)
**Part 3 -** [Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
**Part 4 -** [SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
**Part 5 -** [Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five) | [preview](https://05-automatic-falling--svelte-tetris.netlify.app/))
**Part 6 -** Next Piece ([github](https://github.com/babycourageous/svelte-tetris/tree/06-next-piece) | [preview](https://06-next-piece--svelte-tetris.netlify.app/)) | ([github](https://github.com/babycourageous/svelte-tetris/tree/06-bag-randomizer) | [preview](https://06-bag-randomizer--svelte-tetris.netlify.app/)), Levels, Lines, Score ([github](https://github.com/babycourageous/svelte-tetris/tree/06-levels-lines-score) | [preview](https://06-levels-lines-score--svelte-tetris.netlify.app/)), and Statistics ([github](https://github.com/babycourageous/svelte-tetris/tree/06-statistics) | [preview](https://06-statistics--svelte-tetris.netlify.app/))

Now that our game is chugging along it's time to update all our display modules with data-driven displays.

## Next Piece Preview

The first thing we're going to tackle is displaying the piece that will spawn next.

### Create the Next Piece store

First, we'll add a new store to keep track of the next piece and update it every time we merge a piece to the board. It's a relatively straight-forward writable store. It's only job is to update what the next piece in the queue is.

`src/stores/nextPiece.js`

```js
import { writable } from 'svelte/store'

const initialState = {
  name: '',
  matrix: [[0]],
  id: -1,
  color: 0,
}

function createNextPiece(piece = {}) {
  const { subscribe, set } = writable(piece)

  return {
    subscribe,
    setNextPiece: nextPiece => set(nextPiece),
  }
}

export default createNextPiece(initialState)
```

### Create the Piece component

To make displaying this piece a little more contained we'll create a new component - `Piece.svelte`. This will be a display component that draws a piece to its canvas element when the `nextPiece` store is updated. The `NextPiece.svelte` display container will make use of it (as well as another updated display later on).

`src/components/Piece.svelte`

```svelte
<script>
  import { onMount } from 'svelte'
  import canvasHelper from '../canvasHelpers'

  export let piece
  export let width
  export let height
  export let xOffset = 0
  export let yOffset = 0

  let ref
  let ctx

  $: piece, ctx, drawPiece(piece.matrix)

  function drawPiece(matrix) {
    if (ctx) {
      canvasHelper.clearCanvas(ctx, '#000000')
      canvasHelper.drawMatrix(ctx, matrix, x, 1)
    }
  }

  onMount(() => {
    ctx = ref.getContext('2d')
  })
</script>

<div>
  <canvas bind:this={ref} {width} {height} />
</div>

```

We're using a new style of declaring a reactive statement with dependencies. We're putting our dependencies `piece` and `ctx` before our call to `drawPiece()` so that it will run whenever `piece` or `ctx` change.

> The other method we have used is using the dependencies as an argument of the function

### Update the NextPiece display

Now, onto our `NextPiece.svelte` container. We will replace our dummy content with our `Piece` component. In addition we pull our next piece out of the svelte context (which we will update in `Tetris.svelte`) and add some styles.

`src/containers/NextPiece.svelte`

```
<script>
  import { getContext } from 'svelte'

  import { TETRIS } from '../constants'
  import Display from '../components/Display.svelte'
  import Piece from '../components/Piece.svelte'

  const { nextPiece } = getContext(TETRIS)

  export let width
  export let height

  let canvas
</script>

<Display>
  <div>
    <span>Next</span>
    <Piece {width} {height} piece={$nextPiece} />
  </div>
</Display>

<style>
  span {
    display: block;
    text-align: center;
  }
</style>
```

Finally it's time to incorporate all that into our main `Tetris` file. We import `nextPiece` with the rest of our stores and then add it in our context definition. We define two new local constants to hold the width and height of our `NextPiece` display container. We define two new functinos for creating our current and upcoming pieces and then update the code in `centerPiece`, `resetGame`, and `animate` that dealt with defining or creating our current piece.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...

  // stores
  import board from '../stores/board.js'
  import currentPiece from '../stores/currentPiece.js'
  import lines from '../stores/lines.js'
  import { fallRate } from '../stores/fallRate.js'
  import nextPiece from '../stores/nextPiece.js'

  $: console.log('lines: ', $lines)

  // initialize context
  setContext(TETRIS, { currentPiece, board, nextPiece })

  const canvasWidth = COLS * BLOCK_SIZE
  const canvasHeight = ROWS * BLOCK_SIZE
  const nextWidth = 4 * BLOCK_SIZE
  const nextHeight = 4 * BLOCK_SIZE

  ...

  function randomizeNextPiece() {
    nextPiece.setNextPiece(getRandomPiece())
  }

  function makeNextPieceCurrent() {
    const spawnedPiece = centerPiece($nextPiece)
    currentPiece.setCurrentPiece(spawnedPiece)
  }

  ...

  /**
   * Positions a piece in the center of the board.
   * @returns a copy of the input piece
   */
  function centerPiece(piece) {
    const klonedPiece = klona(piece)
    klonedPiece.x = Math.floor((COLS - klonedPiece.matrix[0].length) / 2)
    klonedPiece.y = klonedPiece.name === 'I' ? -1 : 0
    return klonedPiece
  }

  function resetGame() {
    // reset timers
    timeSincePieceLastFell = 0
    lastFrameTime = 0

    // reset game objects
    board.resetBoard()

    // initialize pieces
    randomizeNextPiece()
    makeNextPieceCurrent()
    randomizeNextPiece()
  }

  ...

  function animate(currentTime) {
    ...

    // check collision on each paint
    if (detectMatrixCollision($currentPiece, $board)) {
      mergeCurrentPieceIntoBoard()
      clearCompletedLines()

      makeNextPieceCurrent()
      randomizeNextPiece()

      // If there is still a collision right after a new piece is spawned, the game ends.
      if (detectMatrixCollision($currentPiece, $board)) {
        console.error('Game over!')
        return
      }
    }

    animationID = requestAnimationFrame(animate)
  }

  ...

</script>

<div class="game">

  ...

  <section class="meta">
    <!-- SCORE -->
    <Score />
    <!-- NEXT PIECE -->
    <NextPiece width={nextWidth} height={nextHeight} />
    <!-- LEVEL -->
    <Level />
  </section>
</div>

<style>
  ...
</style>

```

Now you can see the next piece in the queue.

{% figure 'svelte-tetris-display-next-piece.png', 'The game with our next piece displayed.', 'A glimpse into the future.' %}

## Better Randomizer

We're currently using an unbiased randomizer to get our next piece. We're just grabbing a random piece from our tetromino array with no checks or balances as to whether a piece has or hasn't been pulled yet. You may have noticed that our current method can be a bit frustrating. With this type of unbiased randomization there is nothing stopping it from flooding you with the same piece 10 times in a row or on the other end creating a piece drought where you rarely if ever get a certain piece.

We're going to update our method to use the new official Random Generator. This generates a sequence of all seven one-sided tetrominoes (I, J, L, O, S, T, Z) randomly, as if they were drawn from a bag. When all seven tetrominoes in the bag are used we generate another bag.

There are other randomizers that could be used - all with their advantages and disadvantages but the 7 bag is the all around averagest of all the different types of randomizers we could use - it creates a not too difficult puzzle with an average prevention of floods and droughts... it's just right.

### The shuffle utility

We will begin by defining our new shuffle utility in our `utils.js` file. This will shuffle an array in place using the [modern algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm) of the Fisher Yates shuffle. We begin with our collection of pieces which we want to randomly shuffle. Then, we randomly select one of the "unshuffled" items and swap the selected item with the last item in the collection that has not been selected. This continues until there are no remaining "unshuffled" items.

`src/utils.js`

```js
/**
 * Shuffles an array in place
 * - uses the modern version of the Fisher-Yates shuffle
 *
 * @param {Array} a The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffle(a) {
  let counter = a.length

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter)

    // Decrease counter by 1
    counter--

    // And swap the last element with it
    let temp = a[counter]
    a[counter] = a[index]
    a[index] = temp
  }

  return a
}

export { inRange, times, constant, partial, lessThan, shuffle }
```

### Implement the bag

Now let's update our game to use the bag system and our new shuffle function. In `Tetris.svelte` import our shuffle utility alongside our other helpers and initialize a new local variable `bag` as an empty array. This is what we'll be populating and pulling from to recreate the idea of a bag of pieces. We'll add a function `createBag` to klone our tetrominos into the bag and shuffle them and then update `randomizeNextPiece` to check our bag and if it's empty generate a new one otherwise, pull a piece out.

`src/Tetris.svelte`

```svelte
<script>
  ...

  // helpers
  import { detectMatrixCollision, getFilledRows } from '../matrixHelpers'
  import { shuffle } from '../utils'


  // local variables
  ...
  let bag = []

  function createBag() {
    // make a bag
    bag = klona(tetrominos)
    // shuffle pieces
    shuffle(bag)
  }

  function randomizeNextPiece() {
    // if there are no pieces in the bag
    if (bag.length === 0) {
      // create a new bag
      createBag()
    }
    // grab next piece
    const piece = bag.pop()
    nextPiece.setNextPiece(piece)
  }

  ...

</script>
```

Note that we also removed the `getRandomPiece()` function since that is now part of our bag creation.

## Levels, Lines, and Scoring

The levels, lines, and score displays should be fairly simple to update since during the course of the tutorial we implemented almost everything we need to get them displayed. besides adding our score calculation all that needs to be done is make some adjustments to our components.

### Displaying The Current Level

In order to use our `level` store in the `Level.svelte` display we first have to import and add the derived `level` store into our context in `Tetris.svelte`. While we are in there - delete that `console.log` of the lines.

`src/containers/Tetris.svelte`

```svelte
<script>
...
  // stores
  ...
  import { level } from '../stores/level.js'

  // initialize context
  setContext(TETRIS, { currentPiece, board, nextPiece, level })

  ...

</script>
```

Then in our `Level.svelte` display we get our `level` store out of context and add a couple local constants to store some amounts for padding our number with zeroes and spaces. The `padLevel` function uses native string padding to create a level display with leading and ending spaces along with leading zeroes to match our intended design. We also create our local display variable using a reactive statement so it recalculates when the level updates.

There is also a small style update to handle our display string's white space since by default sequences of white space will be collapsed by HTML. So we declare have our display use `white-space: pre;` which will preserve our intended white space.

`src/containers/Level.svelte`

```svelte
<script>
  import { getContext } from 'svelte'

  import Display from '../components/Display.svelte'
  import { TETRIS } from '../constants'

  const zeroPaddingTotal = 2
  const displayLength = 5

  const { level } = getContext(TETRIS)

  $: display = padLevel($level)

  function padLevel(currentLevel) {
    // convert level number to string
    const level = currentLevel.toString()

    // determine amount to pad for the extra space at end
    const spacePadStart = Math.floor((5 - level.length) / 2) + level.length
    return level
      .padStart(zeroPaddingTotal, '0')
      .padEnd(spacePadStart, ' ')
      .padStart(displayLength, ' ')
  }
</script>

<Display>
  <div>
    <span>Level</span>
    <span class="display">{display}</span>
  </div>
</Display>

<style>
  span {
    display: block;
  }
  .display {
    white-space: pre;
  }
</style>
```

If you save and check it out we have a properly displayed Level indicator.

{% figure 'svelte-tetris-display-level.png', 'A new Level display', 'The updated level display.' %}

### Displaying Lines

Displaying our lines isn't too different from what we just did with our levels. The store is already imported in `Tetris.svelte` so we just need to add it to context.

`src/containers/Tetris.svelte`

```svelte
 // initialize context
  setContext(TETRIS, {
    currentPiece,
    board,
    nextPiece,
    level,
    lines
  })
```

Then, it's just a matter of updating the display container. Much like `Levels.svelte` we get our store from context, set some spacing variables, and create a reactive display variable to call a padding function when our line store updates.

`src/containers/Lines.svelte`

```svelte
<script>
  import { getContext } from 'svelte'

  import Display from '../components/Display.svelte'
  import { TETRIS } from '../constants'

  const { lines } = getContext(TETRIS)

  const zeroPaddingTotal = 3

  $: display = padLines($lines)

  function padLines(currentLines) {
    // convert level number to string
    const lines = currentLines.toString()

    // determine amount to pad for the extra space at end
    const spacePadStart = Math.floor((5 - lines.length) / 2) + lines.length
    return lines.padStart(zeroPaddingTotal, '0')
  }
</script>

<Display>
  <div>
    <span>Lines {display}</span>
  </div>
</Display>

<style>
  div {
    width: 100%;
  }
  span {
    display: block;
    text-align: right;
  }
</style>
```

Clear some lines and watch that line count grow!

{% figure 'svelte-tetris-display-lines.png', 'Our game with proper lines displayed.', 'Our lines display updated.' %}

### Calculating Score

Tetris awards points for completing lines. We are going to implement the scoring system originallly used by the NES version of Tetris. It has a simple formula we can apply to all levels.

**Points awarded for 1 line:** 40 _ (level + 1)
**Points awarded for 2 line:** 100 _ (level + 1)
**Points awarded for 3 line:** 300 _ (level + 1)
**Points awarded for 4 line:** 1200 _ (level + 1)

The level multiplier is based on the level after the line clear, not before so we will calculate score only after we have updated our `lines` store which in turn updates our derived`level` store.

For each piece, the game will also award the number of points equal to the number of grid spaces that the player has continuously soft dropped the piece by holding the **DOWN** key. The amount of points are based only on the last press that leads to a lock; any earlier soft drops are not counted. Unlike the points for lines, this does not increase per level.

We'll start with a new constant to store the points awarded per line.

`src/constants.js`

```js
// GENERAL
...

// Levels
...

// Points
export const LINE_POINTS = [40, 100, 300, 1200];
```

Let's create our `score.js` store now.

`src/stores/score.js`

```js
import { writable } from 'svelte/store'

import { LINE_POINTS } from '../constants'

const initialState = 0

function createScore(initialValue) {
  const { subscribe, set, update } = writable(initialValue)
  return {
    subscribe,
    resetScore: () => set(0),
    addPieceScore: piecePoints => update(prevScore => prevScore + piecePoints),
    addClearedLineScore(linesCleared, currentLevel) {
      update(prevScore => {
        const linesPointIndex = linesCleared - 1
        const basePoints = LINE_POINTS[linesPointIndex]
        const increase = basePoints * (currentLevel + 1)
        return prevScore + increase
      })
    },
  }
}

export default createScore(initialState)
```

We have two store methods - `addPieceScore` and `addClearedLineScore` - to handle our scoring. The `addPieceScore` method simply adds an amount passed in to our currentScore. The amount will be equal to the number of spaces the piece was dropped before locking. The `addClearedLineScore` takes the number of lines cleard along with the current level and calculates the points based on the NES formula.

### Displaying Score

Now that the data is in place let's update our main `Tetris.svelte` file to use our store and then we will update the `Score.svelte` file to display our score.

The `Tetris.svelte` file imports the store and adds it to our context. We add a new local variable to track our drop count - `softDropCount`. We then update our `mergeCurrentPieceIntoBoard` and `clearCompleteLines` to integrate and calculate scoring. We also have to update `handlePlayerMovement` to calculate our extra points when we hold the **DOWN** key.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...

  // stores
  ...
  import score from '../stores/score.js'

  // initialize context
  setContext(TETRIS, {
    currentPiece,
    board,
    nextPiece,
    level,
    lines,
    score,
    stats,
  })

  ...
  let bag = []
  let softDropCount = 0

  ...
  function mergeCurrentPieceIntoBoard() {
    ...
    // add points equal to spaces DOWN was held
    score.addPieceScore(softDropCount)
    // reset the drop count
    softDropCount = 0
  }

  ...

  function clearCompletedLines() {
    ...

    if (numberOfClearedLines > 0) {
      lines.setLines($lines + numberOfClearedLines)
      board.clearCompletedLines()
      // update score after any line and level updates
      score.updateScore(numberOfClearedLines, $level)
    }
  }

  ...

  function handlePlayerMovement(currentTime) {

    ...

    if (pressed.some(...DOWN_KEYS)) {
      if (isDownMovementAllowed) {
        lastDownMove = currentTime
        timeSincePieceLastFell = 0

        // increase count for each space moved
        softDropCount += 1
        currentPiece.movePieceDown()
      }
    } else {
      lastDownMove = 0
      // reset drop count
      softDropCount = 0
    }

  }

  ...

</script>
```

{% figure 'svelte-tetris-score-display.png', 'Checking out the score display.', "You can't tell from the image but that score is reactive!" %}

## Statistics

On to the final display - the Statistics (another element borrowed from the classic NES game). This shows a running tally of the pieces that have spawned. Our version of the game has updated the truly random piece generator with the 7 bag randomizer so the numbers in the statistics window will all br relatively equal, but it's still a neat little feature to add.

### Calculating Stats

We will create a store to manage our statistics. This way updates will trickle own and cause re-rendering of our display component. It will be responsible for creating the base statistics which is just an array wiht an object that has an id and count that corresponds to each tetromino piece. It also will manage updates to the array with the `updateStats` method. This simply increases the stat count for the id passed in.

`src/stores/stats.js`

```js
import { writable } from 'svelte/store'

const initialState = []

function createStats() {
  const { subscribe, set, update } = writable(initialState)

  return {
    subscribe,
    setBaseStats(pieces) {
      let stats = []
      stats = pieces.map(piece => {
        return {
          id: piece.id,
          count: 0,
        }
      })
      set(stats)
    },
    updateStats(id) {
      update(prevStats => {
        const index = prevStats.findIndex(item => item.id === id)
        prevStats[index].count++
        return prevStats
      })
    },
  }
}

export default createStats()
```

### Displaying Stats

In order to display our statistics we will need to update our main `Tetris.svelte` file. This shoud be very familiar after this article - importing the store and adding to context. In addition, we will call `updateStats()` whenever a new current piece spawns.

`src/containers/Tetris.svelte`

```svelte
<script>

  ...

  // stores
  ...
  import stats from '../stores/stats.js'

  stats.setBaseStats(tetrominos)

  // initialize context
  setContext(TETRIS, {
    currentPiece,
    board,
    nextPiece,
    level,
    lines,
    score,
    tetrominos,
    stats,
  })

  ...

  function makeNextPieceCurrent() {
    const spawnedPiece = centerPiece($nextPiece)
    currentPiece.setCurrentPiece(spawnedPiece)
    stats.updateStats($currentPiece.id)
  }

  ...

</script>
```

Before we move to displaying this we need to make a quick pitstop in our `canvasHelpers` file to make a correction to how we draw our highlights. The `lineTo` calls were subtracting "18" to get to the number "2". Instead we will use the magic number "2" throughout. It's a minor adjustment but will help with keeping our overall rendering consistent.

`src/canvasHelpers.js`

```js
function drawHighlight(context, x, y, w, h) {
  context.beginPath()
  context.moveTo(x, y)
  context.lineTo(x + w, y)
  context.lineTo(x + w - 2, y + 2)
  context.lineTo(x + 2, y + 2)
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
```

Now that we have some statistic data, update our `Statistics.svelte` display component to grab the store from context and then loop through it to create our little display.

`src/containers/Statistics.svelte`

```svelte
<script>
  import { onMount, getContext } from 'svelte'
  import { get } from 'svelte/store'

  import Display from '../components/Display.svelte'
  import Piece from '../components/Piece.svelte'
  import { TETRIS } from '../constants'

  const { stats, tetrominos } = getContext(TETRIS)
</script>

<Display>
  <div>
    <div class="title">Statistics</div>
    {#each $stats as stat}
      <div class="stat">
        <Piece
          width={45}
          height={20}
          piece={tetrominos[stat.id - 1]}
        />
        <span>{stat.count.toString().padStart(3, '0')}</span>
      </div>
    {/each}
  </div>
</Display>

<style>
  .stat {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;
  }
</style>
```

If you check out the game you'll notice a big fat error message.

{% figure 'svelte-tetris-stats-error.png', 'Statistics display with error.', 'We have an error - but why?' %}

This one stumped me but I think this is due to a component mounting/store populating race condition. Instead of checking for a `matrix` before drawing a piece, changing it to check for the `ctx` of our canvas seems to do the trick:

`src/containers/Piece.svelte`

```svelte
  function drawCanvas(matrix) {
    if (ctx) {
      const x = (4 - matrix[0].length) / 2

      canvasHelper.clearCanvas(ctx, '#000000')
      canvasHelper.drawMatrix(ctx, matrix, x, 1)
    }
  }
```

Now - the error is gone but even though our stats are displaying none of the associated pieces have been drawn.

{% figure 'svelte-tetris-stats-no-pieces.png', 'Statistics display with no pieces.', 'We have stats but where are the pieces?' %}

Well, that's not 100% accurate. They have been drawn but we just can't see them because we originally hard-coded our offsets into the `drawCanvas` function inside of `Piece.svelte`. We're going to refactor `Piece.svelte` once again to make those offsets props. That way `NextPiece.svelte` and `Statistics.svelte` can apply their own offsets to render pieces in the right place.

`src/containers/Piece.svelte`

```svelte
<script>
  ...

  export let xOffset = 0
  export let yOffset = 0

  ...

  function drawCanvas(matrix) {
    if (ctx) {
      canvasHelper.clearCanvas(ctx, '#000000')
      canvasHelper.drawMatrix(ctx, matrix, xOffset, yOffset)
    }
  }

  ...
</script>
```

{% figure 'svelte-tetris-stats-giant-pieces.png', 'Our statistics pieces are too big.', 'Our statsitcs pieces are drawn... but way too big.' %}

OK. The size of the rendered pieces is something else we need to leave to props. That way our statistic pieces can be scaled down to fit.

`src/containers/Piece.svelte`

```svelte
<script>

  ...
  export let xOffset = 0
  export let yOffset = 0
  export let scale = 1

  ...

  onMount(() => {
    ctx = ref.getContext('2d')
    ctx.scale(scale, scale)
  })
</script>
```

Here we simply adjust the canvas scale when we mount the component. It defaults to "1" which is no scale. That way in `Statistics.svelte` we can shrink to fit. Update `Statistics.svelte` to incorporate those prop changes:

`src/containers/Statistics.svelte`

```svelte
<Display>
  <div>
    <div class="title">Statistics</div>
    {#each $stats as stat}
      <div class="stat">
        <Piece
          width={45}
          height={20}
          piece={tetrominos[stat.id - 1]}
          scale={0.5}
          xOffset={(4 - tetrominos[stat.id - 1].matrix[0].length) / 2} />
        <span>{stat.count.toString().padStart(3, '0')}</span>
      </div>
    {/each}
  </div>
</Display>
```

And voila!

{% figure 'svelte-tetris-statistics-scaled.png', 'The Statistics window in all its glory.', 'The statistics window in all its glory' %}

## Final Tweaks

And now a couple final tweaks.

We need to change our `NextPiece.svelte` file to use our new offset props:

`src/containers/NextPiece.svelte`

```svelte
<Display>
  <div>
    <span>Next</span>
    <Piece
      {width}
      {height}
      piece={$nextPiece}
      xOffset={(4 - $nextPiece.matrix[0].length) / 2}
      yOffset={1} />
  </div>
</Display>
```

In addition, our overall font size is a little large so we will change that in `App.svelte`:

`src/App.svelte`

```svelte
<style>
  main {
    display: flex;
    justify-content: center;
    padding: 1rem;
    font-size: 0.75rem;
  }
</style>
```

## Wrapping Up

We have done it. An "almost" fully featured Tetris game built in Svelte. There are still some things we could add (notably the _Hard Drop_ feature). But that's for another day. For now, enjoy your game!

[Part One - The Basic Set Up](/writing/svelte-tetris-part-one)
[Part Two - The Board and Pieces](/writing/svelte-tetris-part-two)
[Part Three - Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
[Part Four - SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
[Part Five - Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
Part Six - Next Piece ([github](https://github.com/babycourageous/svelte-tetris/tree/06-next-piece) | [preview](https://06-next-piece--svelte-tetris.netlify.app/)) | ([github](https://github.com/babycourageous/svelte-tetris/tree/06-bag-randomizer) | [preview](https://06-bag-randomizer--svelte-tetris.netlify.app/)), Levels, Lines, Score ([github](https://github.com/babycourageous/svelte-tetris/tree/06-levels-lines-score) | [preview](https://06-levels-lines-score--svelte-tetris.netlify.app/)), and Statistics ([github](https://github.com/babycourageous/svelte-tetris/tree/06-statistics) | [preview](https://06-statistics--svelte-tetris.netlify.app/))
