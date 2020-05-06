---
title: 'Making Tetris with Svelte: part three - Player Movement and Collision Detection'
date: 2020-04-17
featuredimage: '/images/writing/svelte-tetris-featured.png'
excerpt: 'This third part of the Tetris tutorial is all about controlling the piece on the board with the keyboard.'
category: svelte
type: tutorial
tags:
  - svelte
toc: true
---

## Overview

**Part 1 -** [The Basic Set Up](/writing/svelte-tetris-part-one)
**Part 2 -** [The Board and Pieces](/writing/svelte-tetris-part-two)
**Part 3 -** Player Movement ([github](https://github.com/babycourageous/svelte-tetris/tree/03-player-movement) | [preview](https://03-player-movement--svelte-tetris.netlify.app/)) and Collision Detection ([github](https://github.com/babycourageous/svelte-tetris/tree/03-collision-detection) | [preview](https://03-collision-detection--svelte-tetris.netlify.app/))
**Part 4 -** [SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
**Part 5 -** [Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
**Part 6 -** Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)

Having a tetromino on our board is nice, but we want to be able to move the tetromino with our keys. We'll use keyboard events coupled with a library to make our interactions as smooth as silk. We'll also spend some time developing the collision detection that we will use throughout the tutorial.

## Player Movement

We could make use of the native `keydown` listeners but instead will make use of a key event library. There are a few contenders out there but I settled on [pressed.js](https://github.com/mimshwright/pressed.js). [Mousetrap](https://github.com/ccampbell/mousetrap) and [keydrown](https://github.com/jeremyckahn/keydrown) were others I looked at but I liked some of the functionality of Pressed. For example, it will run as part of an animation loop so is a little more responsive; also, we can stop listening after a press to prevent repeating callbacks if necessary.

### Integrating Pressed.js

We already installed `pressed` at the beginning so now let's add it to our app. We are going to store our list of keys in our constants file. For now we'll add the keys that move a piece left, right, and down.

`src/constants.js`

```js
// GENERAL
...

// Key mappings
export const DOWN_KEYS = ['down']
export const LEFT_KEYS = ['left']
export const RIGHT_KEYS = ['right']
```

We are going to make use of `requestAnimationFrame` to create our game loop. The way to animate with `requestAnimationFrame` is to create a callback function that paints a frame and then re-schedules itself. It tells the browser that the next time it paints to the screen to call that callback function and paint that too.

We are going ot create the game loop inside our main `Tetris.svelte` file. First, we'll import `pressed.js` at the top. Below that we create a new variable called `animationID`. This will hold a reference to the ID that `requestAnimationFrame` returns. Then at the bottom we will add two new functions - `handlePlayerMovement` and `animate` - as well as initialize `pressed` and our animation cycle in the `onMount` lifecyle:

`src/containers/Tetris.svelte`

```svelte
<script>
  import { setContext, onMount } from 'svelte'
  import pressed from 'pressed'
  ...

  // constants & data
  import {
    TETRIS,
    COLS,
    ROWS,
    BLOCK_SIZE,
    DOWN_KEYS,
    LEFT_KEYS,
    RIGHT_KEYS,
  } from '../constants.js'

  ...

  const canvasWidth = COLS * BLOCK_SIZE
  const canvasHeight = ROWS * BLOCK_SIZE

  let animationID

  ...

  function animate(currentTime) {
    handlePlayerMovement(currentTime)
    animationID = requestAnimationFrame(animate)
  }

  function handlePlayerMovement(currentTime) {
    // handle key presses
    if (pressed.some(...LEFT_KEYS)) {
      console.log('LEFT is pressed')
    }

    if (pressed.some(...RIGHT_KEYS)) {
      console.log('RIGHT is pressed')
    }

    if (pressed.some(...DOWN_KEYS)) {
      console.log('DOWN is pressed')
    }
  }

  onMount(() => {
    // Initialize pressed utility for tracking key presses
    pressed.start(window)

    // reset values
    resetGame()

    // Start the update loop
    animationID = requestAnimationFrame(animate)
  })
</script>
```

The keyboard interaction is handled inside `handlePlayerMovement`. For now we just output logs for testing. `animate` is where we call handlePlayerMovement`and then recursively call`animate` again. This creates our loop.

If you fire up the game and press any of the defined keys you should see some logs firing in the console.

{% figure 'svelte-tetris-key-press-logs.png', 'Display of logged key presses', 'Logging key presses to the console.' %}

Now that we have some keyboard interaction set up it's time to actually do something with it.

### Moving Left and Right

When a player presses a key we have to determine if the movement is allowed. Since our key event is fired on every paint we are going to do some math to determine if enough time has elapsed since the last press to warrant moving the piece. The amount of times a piece can move per second will be stored in a couple new constants:

`src/constants.js`

```js
// Key mappings
...

// When holding down a key, a player will move this many times per second.
export const PLAYER_SIDEWAYS_RATE = 6
export const PLAYER_DOWN_RATE = 20
```

Then inside our main `Tetris.svelte` file we will use the new constants along with some local variables at the start of each cycle that `handlePlayerMovement` is called. We'll start with our LEFT and RIGHT movement.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...
  // constants & data
  import {
    TETRIS,
    COLS,
    ROWS,
    BLOCK_SIZE,
    DOWN_KEYS,
    LEFT_KEYS,
    RIGHT_KEYS,
    PLAYER_SIDEWAYS_RATE,
    PLAYER_DOWN_RATE,
  } from '../constants.js'
  ...

  let animationID
  let lastRightMove = 0
  let lastLeftMove = 0
  ...

  function animate(currentTime) {
    ...
  }

  function handlePlayerMovement(currentTime) {
    // Calculate whether movement is allowed
    const playerSidewaysThreshold = Math.ceil(1000 / PLAYER_SIDEWAYS_RATE)
    const isLeftMovementAllowed =
      currentTime - lastLeftMove > playerSidewaysThreshold
    const isRightMovementAllowed =
      currentTime - lastRightMove > playerSidewaysThreshold

    // handle key presses
    if (pressed.some(...LEFT_KEYS)) {
      if (isLeftMovementAllowed) {
        lastLeftMove = currentTime
        console.log('LEFT pressed')
      }
    } else {
      lastLeftMove = 0
    }

    if (pressed.some(...RIGHT_KEYS)) {
      if (isRightMovementAllowed) {
        lastRightMove = currentTime
        console.log('RIGHT pressed')
      }
    } else {
      lastRightMove = 0
    }

    if (pressed.some(...DOWN_KEYS)) {
      console.log('DOWN is pressed')
    }
  }


  onMount(() => {
    ...
  })
</script>
```

After importing our new constants, we set when we last moved a piece left or right to zero.

Then, in our `handlePlayerMovement` function we calculate whether movement is allowed using our movement constants and the `currentTime` that `requestAnimationFrame` passes into the callback. After our math, we only perform our actions if our allowed player movement check passes.

If you peek at things you should notice that our LEFT and RIGHT keys log to the console slower than our DOWN key does. It now prints 6 times per second as opposed to the rapidfire rate of each frame paint.

The sideways movement by a player is handled inside our `currentPiece` store since it requires us to update our object with new `x` or `y` positions. Update the store with new methods to move our piece left or right as well as importing `klona`:

`src/stores/currentPiece.js`

```js
import { writable } from 'svelte/store'
import klona from 'klona'
...

function createCurrentPiece(initialPiece) {
  const { set, update, subscribe } = writable()
  return {
    subscribe,
    setCurrentPiece: piece => set(piece),
    movePieceLeft(board) {
      update(prevPiece => {
        const newPiece = klona(prevPiece)
        newPiece.x -= 1
        return newPiece
      })
    },
    movePieceRight(board) {
      update(prevPiece => {
        const newPiece = klona(prevPiece)
        newPiece.x += 1
        return newPiece
      })
    },
  }
}
...
```

The `update` method is how Svelte updates its stores. It takes one argument which is a callback. The callback takes the existing store value as its argument and returns the new value to be set to the store.

All we are currently doing is cloning our current state and returning it with adjustments to either it's `x` or `y` value. We clone the store using `klona` since it is a deeply nested array. A simpler data object would be able to take advantage of the ES6 `spread` syntax.

Update our handler to incorporate these new methods.

`src/containers/Tetris.svelte`

```js
  function handlePlayerMovement(currentTime) {
    ...

    // handle key presses
    if (pressed.some(...LEFT_KEYS)) {
      if (isLeftMovementAllowed) {
        lastLeftMove = currentTime
        currentPiece.movePieceLeft($board)
      }
    } else {
      lastLeftMove = 0
    }

    if (pressed.some(...RIGHT_KEYS)) {
      if (isRightMovementAllowed) {
        lastRightMove = currentTime
        currentPiece.movePieceRight($board)
      }
    } else {
      lastRightMove = 0
    }

    if (pressed.some(...DOWN_KEYS)) {
      console.log('DOWN is pressed')
    }
  }
```

If you check out the game you can now move the piece left and right. Unfortunately, it will move right through walls.

We'll add our down movement before handling the boundary detection.

### Moving Down

First let's handle updating our `currentPiece` store with a funciton to move it down.

`src/stores/currentPiece.js`

```js
function createCurrentPiece(initialPiece) {
  const { set, update, subscribe } = writable()
  return {
    subscribe,
    setCurrentPiece: piece => set(piece),
    movePieceLeft(board) {
      ...
    },
    movePieceRight(board) {
      ...
    },
    movePieceDown(board) {
      update(prevPiece => {
        const newPiece = klona(prevPiece)
        newPiece.y += 1
        return newPiece
      })
    },
  }
}
```

The logic to move a piece down in `Tetris.js` is almost identical to moving sideways. We have our variable to hold when the piece was last moved down, we calculate if we can move it down, and based on that calculation call `movePieceDown` on our store. The only difference is that eventually our piece will also be automatically dropping so we keep track of that as part of our checks and balances in our key handler as well.

`src/containers/Tetris.svelte`

```svelte
<script>
  ...

  let animationID
  let lastRightMove = 0
  let lastLeftMove = 0
  let lastDownMove = 0
  // time since the piece last moved down automatically
  let timeSincePieceLastFell = 0
  ...

  function handlePlayerMovement(currentTime) {
    // Calculate whether movement is allowed
    ...
    const isDownMovementAllowed =
      currentTime - lastDownMove > Math.ceil(1000 / PLAYER_DOWN_RATE)

    if (pressed.some(...LEFT_KEYS)) {
      ...
    }

    if (pressed.some(...RIGHT_KEYS)) {
      ...
    }

    if (pressed.some(...DOWN_KEYS)) {
      if (isDownMovementAllowed) {
        lastDownMove = currentTime
        timeSincePieceLastFell = 0

        currentPiece.movePieceDown()
      }
    } else {
      lastDownMove = 0
    }
  }

  ...
</script>
```

Wtih that - we can move the piece down!

Of course those walls and floor aren't doing anything to stop the piece. Let's bring some collision detection to the party.

## Collision Detection

We will handle collision detection in two places. When we move LEFT and RIGHT we will detect collision from within our store since the only time we move sideways is from direct interaction. When we move a piece down, the downward collision detection will get handled from within the `animate` function in `Tetris.svelte`. Checking for collisions below on every paint will come in handy when we add the automating downward movement.

### Defining Our Collision Helper Functions

We'll begin with some matrix helpers that will do the heavy lifting in all cases.

`src/matrixHelpers.js`

```js
import { inRange, times, constant, partial, lessThan } from './utils'
import { COLS, ROWS } from './constants'

...

/**
 * Detects collision between a piece and board
 * by checking if the piece is within the bounds of the board
 *
 * @param {Object} piece The full piece object
 * @param {Array} board The board matrix
 * @returns {Boolean} True if there is a collision, false if not
 */
function detectMatrixCollision(piece, board) {
  if (inBounds(piece, board)) {
    return false
  }
  return true
}

/**
 * Checks if a piece is within the bounds of the board
 *
 * @param {Object} piece The full piece object
 * @param {Array} board The board matrix
 * @returns {Boolean} True if the piece is within bounds of board, false if not
 */
function inBounds(piece, board) {
  const { matrix } = piece
  return matrix.every((row, dy) => {
    return row.every((value, dx) => {
      let x = piece.x + dx
      let y = piece.y + dy
      return value === 0 || (insideWalls(x) && aboveFloor(y) && notOccupied(x, y, board))
    })
  })
}

/**
 * Checks if a cell is located within the walls of the board
 *
 * @param {Number} x The location of the cell
 * @returns {Boolean} True if the cell is within the walls, false if not
 */
function insideWalls(x) {
  return x >= 0 && x < COLS
}

/**
 * Checks if a cell is located above the floor of the board
 *
 * @param {Number} y The row location of the cell
 * @returns {Boolean} True if the cell is above the floor, false if not
 */
function aboveFloor(y) {
  return y <= ROWS
}

/**
 * Checks if the space on the board is occupied by a piece represented by a non-zero number
 *
 * @param {Number} x The column location
 * @param {Number} y The row location
 * @param {Array} board The 2 dimensional board array
 * @returns {Boolean} True if there is nothing (0) in that spot, false if it is occupied
 */
function notOccupied(x, y, board) {
  return board[y] && board[y][x] === 0
}

export { createEmptyMatrix, createEmptyArray, detectMatrixCollision }
```

Up top we add our `COLS` and `ROWS` constants. The main function that handles detecting collisions is `detectMatrixCollision`. This uses four internal helpers to determine whether the piece is colliding with anything:

- **inBounds** - Checks that the piece is inside the bounds of the board using the next three functions
- **insideWalls** - Checks to see if an individual cell of the piece is between the board's walls
- **aboveFloor** - Checks to see if an individual cell of the piece is above the board's floor
- **notOccupied** - Checks to see if an individual cell of the board is already occupied

Let's move on with our lateral collision detection.

### Sideways Collision Detection

Inside `currentPiece.js` we import `detectMatrixCollision`. We also create an internal helper function called `moveAndCheck`. This takes the current piece, the board, and the lateral direction to move and handles the logic to check collision as well as whether to return the piece in its new position (the movement of the piece didn't result in a collision) or its original location (the movement resulted in a collision with a wall or another piece). Finally we update our `movePieceLeft` and `movePieceRight` methods with the `moveAndCheck` helper function.

`src/stores/currentPiece.js`

```js
import { writable } from 'svelte/store'
import klona from 'klona'

import { detectMatrixCollision } from '../matrixHelpers'

const initialState = null

function moveAndCheck(piece, board, direction) {
  const newPiece = klona(piece)
  newPiece.x += direction
  if (detectMatrixCollision(newPiece, board)) {
    return piece
  }
  return newPiece
}

function createCurrentPiece(initialPiece) {
  const { set, update, subscribe } = writable()
  return {
    subscribe,
    setCurrentPiece: piece => set(piece),
    movePieceLeft(board) {
      update(prevPiece => moveAndCheck(prevPiece, board, -1))
    },
    movePieceRight(board) {
      update(prevPiece => moveAndCheck(prevPiece, board, 1))
    },
    movePieceDown(board) {
      ...
    }
  }
}

export default createCurrentPiece(initialState)
```

At this point, if you check the game you can move left and right without going throught the walls!

### Falling Collision Detection

Time for checking collision when we move our piece down. As mentioned above, this check will happen in our animation loop since eventually the piece will be automatically moving down.

First we need some new matrix helpers - `getMatrixWidth`, `getMatrixHeight`, and `combineMatrices`. They all do what their names imply.

Let's add them to the `matrixHelpers.js` file:

`src/matrixHelpers.js`

```js
import { inRange, times, constant, partial, lessThan } from './utils'
import { COLS, ROWS } from './constants'

const getMatrixHeight = matrix => matrix.length
const getMatrixWidth = matrix => matrix[0].length

...

/**
 * Combines two matrixes (a board and a piece) and returns the new matrix
 *
 * @param {Array} destinationMatrix The board matrix
 * @param {Array} sourceMatrix The piece matrix
 * @param {number} [offsetX=0] The x location of the piece
 * @param {number} [offsetY=0] The y location of the piece
 * @param {boolean} [overwrite=true] Whether to overwrite the board matrix
 * @returns {Array} The new board matrix with merged piece
 */
function combineMatrices(
  destinationMatrix,
  sourceMatrix,
  offsetX = 0,
  offsetY = 0,
  overwrite = true
) {
  const lastXIndex = getMatrixWidth(sourceMatrix) + offsetX - 1
  const lastYIndex = getMatrixHeight(sourceMatrix) + offsetY - 1

  const newMatrix = destinationMatrix.map((rows, y) => {
    return rows.map((value, x) => {
      if (inRange(x, offsetX, lastXIndex + 1) && inRange(y, offsetY, lastYIndex + 1)) {
        if (overwrite || !value) {
          return sourceMatrix[y - offsetY][x - offsetX]
        }
      }
      return value
    })
  })

  return newMatrix
}

export {
  getMatrixHeight,
  getMatrixWidth,
  createEmptyMatrix,
  createEmptyArray,
  detectMatrixCollision,
  combineMatrices,
}
```

Below is what the board matrix will look like after some pieces have merged with it.

{% figure 'svelte-tetrix-merged-log.png', 'A board matrix merged with three piece matrixes.', 'The new merged board has our pieces represented by their number IDs.' %}

The numbers represet the blocks of the merged pieces. So when the board gets redrawn those get colored in and when the board is used to compare matrices those numbers indicate filled spaces.

Let's put this in action.

The combining of piece and board happens in our `board` store. So let's update that first with a new `mergePieceIntoBoard` method. Don't forget to import `combineMatrices` up top as well.

`src/stores/board.js`

```js
import { writable } from 'svelte/store'

import { createEmptyMatrix, combineMatrices } from '../matrixHelpers'
import { COLS, ROWS } from '../constants'

const initialState = createEmptyMatrix(COLS, ROWS)

function createBoard(initialBoard) {
  const { subscribe, set, update } = writable(initialBoard)
  return {
    subscribe,
    resetBoard() {
      set(createEmptyMatrix(COLS, ROWS))
    },
    mergePieceIntoBoard(piece) {
      update(prevBoard => {
        const { matrix: pieceMatrix, x, y } = piece
        const mergedBoard = combineMatrices(prevBoard, pieceMatrix, x, y, false)
        return mergedBoard
      })
    },
  }
}

export default createBoard(initialState)
```

We will call this new method from inside our `Tetris` component as part of our animation loop. Inside `animate` we will check for collisions. If there is a collision we will merge the piece into the board and then spawn a new random tetromino as our new current piece. After that we perform another collision detection in case the spawned piece immediately collides with the current board (as would be the case when we reach the top). If that is the case we kill our loop by returning out of the function. Don't forget to import `klona` and our `detectMatrixCollision` helper up top as well.

`src/containers/Tetris.svelte`

```js
import { onMount, setContext } from 'svelte'
import pressed from 'pressed'
import klona from 'klona'

// helpers
import { detectMatrixCollision } from '../matrixHelpers'

// components
...

/**
 * Affixes the current piece to the board.
 */
function mergeCurrentPieceIntoBoard() {
  // First moves the piece up one space.
  // This allows you to shift the piece around a bit and
  // only detects collisions at the end of the step
  // instead of at the beginning.
  const previousPositionPiece = klona($currentPiece)
  previousPositionPiece.y -= 1
  board.mergePieceIntoBoard(previousPositionPiece)
}

function animate(currentTime) {
  handlePlayerMovement(currentTime)

  // check collision on each paint
  if (detectMatrixCollision($currentPiece, $board)) {
    mergeCurrentPieceIntoBoard()
    currentPiece.setCurrentPiece(getRandomPiece())

    // If there is still a collision right after a new piece is spawned, the game ends.
    if (detectMatrixCollision($currentPiece, $board)) {
      console.error('Game over!')
      return
    }
  }

  animationID = requestAnimationFrame(animate)
}
```

With that - the tetromino won't go through the walls, it won't fall through the floor, and it locks in place and spawns a new one when we hit the bottom. If we reach the top, the game ends.

## Wrapping Up

We've come a long way but there's still a ways to go. Up next, we look at the official implementatino of three details - where pieces spawn, how they rotate, and wall kicks.

[Part One - The Basic Set Up](/writing/svelte-tetris-part-one)
[Part Two - The Board and Pieces](/writing/svelte-tetris-part-two)
Part Three -
Player Movement ([github](https://github.com/babycourageous/svelte-tetris/tree/03-player-movement) | [preview](https://03-player-movement--svelte-tetris.netlify.app/))
Collision Detection ([github](https://github.com/babycourageous/svelte-tetris/tree/03-collision-detection) | [preview](https://03-collision-detection--svelte-tetris.netlify.app/))
[Part Four - SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks](/writing/svelte-tetris-part-four)
[Part Five - Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
Part 6 - Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)
