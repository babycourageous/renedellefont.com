---
title: 'Making Tetris with Svelte: part five - Automatic Falling and Clearing Lines'
date: 2020-04-25
featuredimage: '/images/writing/svelte-tetris-featured.png'
excerpt: 'It's part five... time to get that automatic downward movement of our pieces in motion as well as clearing completed lines.'
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
**Part 5 -** Automatic Falling ([github](https://github.com/babycourageous/svelte-tetris/tree/05-automatic-falling) | [preview](https://05-automatic-falling--svelte-tetris.netlify.app/)) and Clearing Lines ([github](https://github.com/babycourageous/svelte-tetris/tree/05-clear-completed-rows) | [preview](https://05-clear-completed-rows--svelte-tetris.netlify.app/))
**Part 6 -** Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)

OK. We have player movement. We have collision detection. We have super fancy SRS rotation and wall kicks. Now it's time to get that automatic downward movement of our tetrominos started.

## Falling Pieces

First up - let's quickly define some new constants. We'll have two constants that relate to the levels - the default starting level as well as how many levels it takes to level up. There are also two constants that will help calculate how quickly a piece automatically falls - the initial rate and a modifier.

`src/constants.js`

```js
// GENERAL
// key for Svelte context
...

// Levels
export const START_LEVEL = 0
export const NEW_LEVEL_EVERY = 10

// Key mappings
...

// When holding down a key, a player will move this many times per second....

// Falling rate should be expressed in steps per second.
export const INITIAL_FALL_RATE = 1

// This number is added to the fall rate on each new level
export const FALL_RATE_LEVEL_MODIFIER = 0.5
...
```

We have three new stores to create that all play a role in how fast (or slow) a piece falls on its own. The first is a store to keep a running tally of the total number of lines cleared throughout the game. It's only job is to reset lines back to an initial state and set the current amount of lines completed.

`src/stores/lines.js`

```js
import { writable } from 'svelte/store'

const initialState = 0

function createLines(initialValue) {
  const { set, update, subscribe } = writable(initialValue)

  return {
    subscribe,
    resetLines: () => set(initialValue),
    setLines: lines => set(lines),
  }
}

export default createLines(initialState)
```

The current level is another store we will create. The level depends on how may total lines have cleared. This makes it a perfect candidate for a different kind of Svelte store - the `derived` store.

A `derived` store is a store that is derived from one or more other stores. In its simplest version a derived store takes a store (or array of stores) and a callback which is passed the value of the store(s). The callback then returns the derived value. Think of them kinda like reactive statements but for stores.

In our case the level store will derive its value based on the number of lines currently completed. When the number of lines completed increases the derived value automagically updates.

`src/stores/level.js`

```js
import { derived } from 'svelte/store'

import lines from './lines'
import { START_LEVEL, NEW_LEVEL_EVERY } from '../constants'

export const level = derived(lines, $lines =>
  Math.max(START_LEVEL, Math.floor($lines / NEW_LEVEL_EVERY))
)
```

Finally we create the store for our fall rate. The fall rate will be calculated based on the current level store as well as the initial fall rate and fall rate modifier. Since the fall rate depends on another store for its value we will once again use a derived store.

`src/stores/fallRate.js`

```js
import { derived } from 'svelte/store'

import { level } from './level'
import { INITIAL_FALL_RATE, FALL_RATE_LEVEL_MODIFIER } from '../constants'

export const fallRate = derived(
  level,
  $level => INITIAL_FALL_RATE + $level * FALL_RATE_LEVEL_MODIFIER
)
```

Now we can put all this in action inside our main `Tetris` component.

We will add the `fallRate` store with our other two store imports. There's also a new local variable to keep track of the animation loop timestamp from the previous frame. This will be used in our `animate` function to determine the elapsed time each frame in order to control when to move our current piece down. There's also a new method called `handleAutomatedFalling` inside the `animate` function to handle the logic that determines if it is time to move the piece. If the condition is met, the timer is reset and the current piece moves down 1.

`src/containers/Tetris.svelte`

```svelte
  // stores
  import board from '../stores/board.js'
  import currentPiece from '../stores/currentPiece.js'
  import { fallRate } from '../stores/fallRate.js'

  ...
  let lastFrameTime = 0 // previous frame's current time

  ...

  function resetGame() {
    // reset timers
    timeSincePieceLastFell = 0
    lastFrameTime = 0

    // reset game objects
    board.resetBoard()

    // initialize stores
    ...
  }
  ...

  function animate(currentTime) {
    let deltaTime = currentTime - lastFrameTime
    lastFrameTime = currentTime

    handlePlayerMovement(currentTime)
    handleAutomatedFalling(deltaTime)

    ...
  }

  function handlePlayerMovement() {
    ...
  }

  function handleAutomatedFalling(deltaTime) {
    timeSincePieceLastFell += deltaTime

    const shouldPieceFall = timeSincePieceLastFell > Math.ceil(1000 / $fallRate)

    if (shouldPieceFall) {
      timeSincePieceLastFell = 0
      currentPiece.movePieceDown()
    }
  }

  onMount(() => {
    ...
  })
```

If you open it up you should see everything working as before except now the current piece moves down onits own.

## Clearing Completed Rows

The whole point of Tetris is to complete and clear horizontal lines. This is how we get points and move up in levels (which results in the game getting harder and harder). We'll worry about acutally implementing points and levels later. For now we'll just get rows to clear when they are filled as well as update our running line count tally in our store.

In order to clear lines from our board we will need to add some new functions to our `matrixHelpers.js` file.

`src/matrixHelpers.js`

```js
...

function combineMatrices(
  destinationMatrix,
  sourceMatrix,
  offsetX = 0,
  offsetY = 0,
  overwrite = true
) {
  ...
}

function getFilledRows(matrix) {
  return matrix.reduce((filledRows, row, rowIndex) => {
    // check that every element in the row is a filled block
    if (row.every(i => lessThan(0, i))) {
      filledRows.push(rowIndex)
    }
    return filledRows
  }, [])
}

function removeRow(matrix, rowIndex) {
  const klone = klona(matrix)
  klone.splice(rowIndex, 1)
  return klone
}

function removeRowAndShiftDown(matrix, rowIndex) {
  const w = getMatrixWidth(matrix)
  const emptyRowMatrix = [createEmptyArray(w)]
  const newBoard = emptyRowMatrix.concat(removeRow(matrix, rowIndex))
  return newBoard
}

...

export {
  getMatrixHeight,
  getMatrixWidth,
  createEmptyMatrix,
  createEmptyArray,
  detectMatrixCollision,
  combineMatrices,
  rotate,
  getFilledRows,
  removeRow,
  removeRowAndShiftDown,
}
```

- **getFilledRows** - given a matrix will return an array of indexes corresponding to the filled rows in the matrix
- **removeRow** - simply removes a row at the given index
- **removeRowAndShiftDown** - creates a new board by creating an empty row array and then concatenating the current board with a row removed to it. This will be called as part of a reduce method in the board store.

Speaking of board store, let's update `board.js` with a new method to clear the complete lines.

`src/stores/board.js`

```js
import { writable } from 'svelte/store'

import {
  createEmptyMatrix,
  combineMatrices,
  getFilledRows,
  removeRowAndShiftDown,
} from '../matrixHelpers'

...

function createBoard(initialBoard) {
  const { subscribe, set, update } = writable(initialBoard)
  return {
    subscribe,
    resetBoard() {
      ...
    },
    mergePieceIntoBoard(piece) {
      ...
    },
    clearCompletedLines() {
      update(prevBoard => {
        const filledRows = getFilledRows(prevBoard)

        return filledRows.reduce(
          (board, rowIndex) => removeRowAndShiftDown(board, rowIndex),
          prevBoard
        )
      })
    }
  }
}

export default createBoard(initialState)
```

We import `getFilledRows` along with `removeRowAndShiftDown`. The `clearCompleteLines` function finds the filled rows from our board in its current state then reduces that array down removing and shifting each filled row along the way.

Finally add the row clearing functionality to our main `Tetris` component.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...

  // helpers
  import { detectMatrixCollision, getFilledRows } from '../matrixHelpers'

  ...

  // stores
  import board from '../stores/board.js'
  import currentPiece from '../stores/currentPiece.js'
  import lines from '../stores/lines.js'
  import { fallRate } from '../stores/fallRate.js'

  $: console.log($lines)

  ...

  function mergeCurrentPieceIntoBoard() {
    ...
  }

  /**
   * Removes and scores completed lines in the board.
   */
  function clearCompletedLines() {
    const filledRows = getFilledRows($board)
    const numberOfClearedLines = filledRows ? filledRows.length : 0

    if (numberOfClearedLines > 0) {
      // TODO: update score
      lines.setLines($lines + numberOfClearedLines)
      board.clearCompletedLines()
    }
  }

  function animate(currentTime) {
    let deltaTime = currentTime - lastFrameTime
    lastFrameTime = currentTime

    handlePlayerMovement(currentTime)
    handleAutomatedFalling(deltaTime)

    // check collision on each paint
    if (detectMatrixCollision($currentPiece, $board)) {
      mergeCurrentPieceIntoBoard()
      clearCompletedLines()
      currentPiece.setCurrentPiece(getRandomPiece())

      // If there is still a collision right after a new piece is spawned, the game ends.
      if (detectMatrixCollision($currentPiece, $board)) {
        console.error('Game over!')
        return
      }
    }

    animationID = requestAnimationFrame(animate)
  }
</script>
```

We need to import `getFilledRows` up top. We then add `lines` to our group of store imports and for now will just log the count to the console when it updates. We update the `animate` function to clear any completed lines after merging a piece into the board. The `clearCompletedLines` function will make use of `getFilledRows` to return the array of indexes that correspond to filled rows in our board matrix. If there are any filled rows after merging we pin a note to update our score, we update our running lines tally, and we have the board store clear the lines.

## Wrapping Up

We could stop here.

Our Tetris game does all the things a Tetris game should do. But why not push further. Let's get some cool bells and whistles in the mix too! In the next installment of this series we will expand on the game by adding levels, scoring, a preview of the next piece, and more.

[Part One - The Basic Set Up](/writing/svelte-tetris-part-one)
[Part Two - The Board and Pieces](/writing/svelte-tetris-part-two)
[Part Three - Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
[Part Four - SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
Part Five -
Automatic Falling ([github](https://github.com/babycourageous/svelte-tetris/tree/05-automatic-falling) | [preview](https://05-automatic-falling--svelte-tetris.netlify.app/))
Clearing Lines ([github](https://github.com/babycourageous/svelte-tetris/tree/05-clear-completed-rows) | [preview](https://05-clear-completed-rows--svelte-tetris.netlify.app/))
Part Six - Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)
