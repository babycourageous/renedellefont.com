---
title: 'Making Tetris with Svelte: part four - SRS Guidelines: Spawn Orientation, Basic Rotation, and Wall Kicks'
date: 2020-04-21
featuredimage: '/images/writing/svelte-tetris-featured.png'
excerpt: 'In this fourth part of the series the Super Rotation System is added to control how the pieces behave.'
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
**Part 4 -** SRS Guidelines: Spawn Orientation ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-spawn) | [preview](https://04-SRS-spawn--svelte-tetris.netlify.app/)), Basic Rotation ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-rotation) | [preview](https://04-SRS-rotation--svelte-tetris.netlify.app/)), and Wall Kicks ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-wall-kicks) | [preview](https://04-SRS-wall-kicks--svelte-tetris.netlify.app/))
**Part 5 -** [Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
**Part 6 -** Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)

In this fourth part of the series we will integrate some aspects of the Super Rotation System or **SRS** that is the current Tetris standard for how tetrominos behave. SRS represents where and how tetrominos spawn, how they rotate, and what wall kicks they may perform.

The [Tetris wiki](https://tetris.wiki/Super_Rotation_System) has tons of info about the Super Rotation System for reference.

## Spawn Orientation

Currently the way we have things set up our pieces spawn with the corner (0, 0) of their bounding box in the top left of the board. The official spawn orientations for Tetris however follow a few specific guidelines:

- All tetrominos spawn horizontally
- The J, L and T spawn flat-side first, while I, S and Z spawn in their upper horizontal orientation
- The I and O tetrominos spawn centrally, and the other, 3-cell wide tetrominos spawn rounded to the left
- The tetrominos spawn above playfield and immediately drop one space if no existing block is in its path

We've already taken care of the first two requirements with the way we designed the pieces (which is also based on the SRS guidelines). We'll position our pieces horizontally according to the SRS implementation. With regards to the y-position we will spawn according to the classic NES version due to the complexities that spawning outside the confines of the board introduces.

We'll leave our tetromino creation code as is and put our spawning logic inside `Tetris.svelte` where we initialize our pieces.

`src/containers/Tetris.svelte`

```svelte
<script>
...

  /**
   * Positions a piece in the center of the board.
   * @returns a copy of the input piece
   */
  function centerPiece(piece) {
    piece.x = Math.floor((COLS - piece.matrix[0].length) / 2)
    piece.y = piece.name === 'I' ? -1 : 0
    return piece
  }

  function resetGame() {
    // initialize stores
    const piece = centerPiece(getRandomPiece())
    currentPiece.setCurrentPiece(piece)
  }

  ...

  function animate(currentTime) {
    ...

    if (detectMatrixCollision($currentPiece, $board)) {
      mergeCurrentPieceIntoBoard()
      const piece = centerPiece(getRandomPiece(piece))
      currentPiece.setCurrentPiece(piece)

      ...

  }

  ...

</script>
```

You can see that now our "I" and "O" pieces spawn in the center of the board while the others spawn 1 space left of center. We also added a check for our "I" piece since it needs to be bumped up a space to make up for its empty first row.

Next let's get the basics of rotation down.

## Rotating Tetrominos

The basic rotation of all tetrominos should look like the following diagram:

{% figure 'svelte-tetris-SRS-pieces.png', 'The rotation states of all 7 tetrominos.', 'The rotation states of all 7 tetrominos. The circle is to illustrate the axis on which each tetromino rotates.' %}

Rotating matrices is something I dug around to find. There are a few options and methods out there. The one I settled on was to use a combination of matrix flipping, mirroring, and reversing to accomplish the new rotated matrix.

Let's start by stubbing out some pseudo code for the whole process in our `currentPiece` store. Inside our `createCurrentPiece` function add a `rotateCurrentPiece` method immediately following `movePieceDown`. Below is our pseudo code:

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
      ...
    },
    rotateCurrentPiece(board, direction = 1) {
      update(prevPiece => {
        // 0. if this is the "O" piece we can just return it

        // 1. clone the current piece in case we have to return original

        // 2. store a reference to the starting rotation position (0-3)
        // and advance rotation position

        // 3. rotate the cloned piece's matrix

        // 4. If the rotation results in a collision
          // 4a. Find the tests for this piece from the pre-defined object of kicks
          // 4b. Grab the tests for the current start rotation and direction
          // 4c. Store reference to current state
          // 4d. Run thru the tests - return the new piece adjusted for kick when first non-collision position found

          // 5. If test results in collision-free placement

          // 6. After checking our tests return new or previous piece

          // 7. Original rotation didn't result in collicion
      })
    },
  }
}
```

There's a new tetromino property referenced - the `rotation` position. All our tetrominos start at rotation position "0". Each rotation increases that index by "1" until we reach our starting position and the index resets (so 0-3). We will accomplish this using a formula that makes use of the `modulo` operator.

Let's start with just getting the piece to rotate without any wall kick tests. First, add our new tetromino `rotation` property and update the tetromino's `createPiece` function with said property initialized to "0":

`src/tetrominos.js`

```js
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
    rotation: 0,
  }
}
```

That's it. Now we can track our rotation index!

On to the rotation of the current piece.

We begin by adding more helpers to `matrixHelpers.js`. We'll make use of `klona` so we import that up top as well. Here's all the new stuff for our `matrixHelpers.js` file.

**note we are updating `detectMatrixCollision` in addition to adding the new helpers**

`src/matrixHelpers.js`

```js
import klona from 'klona'

...

/**
 * Detects collision between a piece and board
 * by checking if the piece is within the bounds of the board
 *
 * @param {*} piece The full piece object
 * @param {*} board The board matrix
 * @param {number} [xOffset=0] The offset in the x-direction
 * @param {number} [yOffset=0] The offset in the x-direction
 * @returns {Boolean} True if there is a collision, false if not
 */
function detectMatrixCollision(piece, board, xOffset = 0, yOffset = 0) {
  const temp = klona(piece)
  temp.x += xOffset
  temp.y += yOffset
  if (inBounds(temp, board)) {
    return false
  }
  return true
}
...

function flip(matrix) {
  const h = matrix.length
  const w = matrix[0].length

  let newMatrix = createEmptyMatrix(h, w)

  times(h, row => {
    times(w, column => {
      newMatrix[column][row] = matrix[row][column]
    })
  })
  return newMatrix
}

const mirror = matrix => matrix.map(row => row.reverse())

const rotateRight = matrix => {
  return mirror(flip(matrix))
}

const rotateLeft = matrix => {
  return flip(matrix).reverse()
}

function rotate(matrix, direction) {
  if (direction && direction <= 0) {
    return rotateLeft(matrix)
  }
  return rotateRight(matrix)
}

export {
  getMatrixHeight,
  getMatrixWidth,
  createEmptyMatrix,
  createEmptyArray,
  detectMatrixCollision,
  combineMatrices,
  rotate,
}
```

Few updates here. We import `klona` up top as well as make an update to `detectMatrixCollision`. We added two new arguments - `xOffset` and `yOffset`. These allow us to test later for our kicks by passing in potential places to move our piece. The default is set to "0" so that we don't have to make any changes to any of our existing code that uses this function.

Next (at the bottom above the exports) we define all our rotate functions.

- **flip** - flips our rows and columns so the first row becomes the first column, the second row becomes the second column... and so on
- **mirror** - creates a mirror image of the matrix by reversing each row array
- **rotateRight** - the mirror image of a flip
- **rotateLeft** - reverses the row order of flipped matrix
- **rotate** - calls rotateLeft or rotateRight depending on the direction passed in

Finally we add `rotate` to our exports.

Next up we update our `currentPiece` pseudo code to use our new matrix rotation helper.

`src/stores/currentPiece.js`

```js
import { writable } from 'svelte/store'
import klona from 'klona'

import { detectMatrixCollision, rotate } from '../matrixHelpers'
...

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
      ...
    },
    rotateCurrentPiece(board, direction = 1) {
      update(prevPiece => {
        // 0. if this is the "O" piece we can just return it

        // 1. clone the current piece in case we have to return unchanged
        let newPiece = klona(prevPiece)

        // 2. store a reference to the starting rotation position (0-3)
        // and advance rotation position
        const rotation = newPiece.rotation
        newPiece.rotation = (prevPiece.rotation + 1) % 4

        // 3. rotate the cloned piece's matrix
        newPiece.matrix = rotate(newPiece.matrix, direction)

        // 4. If the rotation results in a collision
          // 4a. Find the tests for this piece from the pre-defined object of kicks
          // 4b. Grab the tests for the current start rotation and direction
          // 4c. Store reference to current state
          // 4d. Run thru the tests - return the new piece adjusted for kick when first non-collision position found

        // 5. If test results in collision-free placement

        // 6. After checking our tests return new or previous piece
        return newPiece

        // 7. Original rotation didn't result in collicion
      })
    }
  }
}
```

Obviously there's a few things missing from this first iteration. Let's break down what we have so far. First thing we do is import the `rotate` helper function from our matrix helpers. Then, inside `rotateCurrentPiece` we clone the current piece and rotate it. The `rotate` function takes our piece matrix and rotates it either clockwise or counter-clockwise depending on the direction (`1` or `-1`). For now we return the new piece without any checks.

Before we tie everything together, we need to add a couple new key mapping constants to our constants file.

`src/constants.js`

```js
...

// Key mappings
...
export const ROTATE_LEFT_KEYS = ['ctl', 'z']
export const ROTATE_RIGHT_KEYS = ['up', 'x']
```

Our updates to `Tetris.svelte` should feel familiar. Our new key map constants are added to the imports. Then we define a variable to keep track of whether we can rotate or not (just like our sideways movement). in our `handlePlayerMovement` function we perform similar checks to our sideways movement checks to determine if rotation is allowed.

`src/containers/Tetris.svelte`

```svelte
<script>
...

  // constants and data
  import {
    ...
    DOWN_KEYS,
    LEFT_KEYS,
    RIGHT_KEYS,
    ROTATE_LEFT_KEYS,
    ROTATE_RIGHT_KEYS,
    ...
  } from '../constants.js'

  ...

  let animationID
  let lastRightMove = 0
  let lastLeftMove = 0
  let lastDownMove = 0
  let lastRotate = 0
  let timeSincePieceLastFell = 0 // time since the piece last moved down automatically

  ...

  function handlePlayerMovement(currentTime) {
    // Calculate whether movement is allowed
    ...
    const isRotateAllowed = currentTime - lastRotate > playerSidewaysThreshold

    if (pressed.some(...LEFT_KEYS)) {
      ...
    }

    if (pressed.some(...RIGHT_KEYS)) {
      ...
    }

    if (pressed.some(...DOWN_KEYS)) {
      ...
    }

    if (pressed.some(...ROTATE_LEFT_KEYS, ...ROTATE_RIGHT_KEYS)) {
      if (isRotateAllowed) {
        lastRotate = currentTime
        if (pressed.some(...ROTATE_LEFT_KEYS)) {
          currentPiece.rotateCurrentPiece($board, -1)
        }
        if (pressed.some(...ROTATE_RIGHT_KEYS)) {
          currentPiece.rotateCurrentPiece($board)
        }
      }
    } else {
      lastRotate = 0
    }
  }

  ...

</script>
```

OK. If you check out things so far... our tetromino rotates! Since we aren't performing any type of collision checks it does gum up if the rotation collides with a wall or piece. It just blindly merges into it. Sorta like what happened to Jeff Goldblum at the end of _The Fly_

{% figure 'https://monsterlegacy.files.wordpress.com/2016/08/brundlepod.jpg?w=1576', 'A metaphor for our piece merging into the wall.', 'Our piece merges with the wall just like BrundlePod' %}

This is because we are always returning a successfully rotated piece and then merging that into the board from within our main animation function. We need to add that wall kick logic to our rotation method.

We'll also need to account for rotations ending up above the board (as is the case with the "I" tetromino) as well as return the original piece if checks don't pass and a rotation isn't possible.

## Wall Kicks

When a player attempts to rotate a tetromino but the position it would occupy after basic rotation results in a collision (either by the wall, floor, or the current stack of tetrominos) we will attempt to **"kick"** the tetromino into an alternative position nearby.

These are the basic guidelines to performing our wall kick and associated tests according to the SRS model:

- 5 positions are sequentially tested and if none result in a valid placement the rotation fails resulting in no change to the piece.
- The positions tested are determined by the initial rotation state and direction.
- The positions are commonly described as a sequence of `x` and `y` values. These represent the change in location to test the rotation again.
- The `J`, `L`, `S`, `T` and `Z` tetrominos all share the same kick values, the `I` tetromino has its own set of kick values, and the `O` tetromino does not kick.

I translated the official wall kick tests into a JavaScript object to be used in our `rotateCurrentPiece` method. It's a bear of a file so instead of prinitng it out here, you can snag it from this gist: https://gist.github.com/babycourageous/ccd9fb96ec460168fcb836f07c4a0171. Copy it into a file called `wallKicks.js` in the `src` directory alongside our other helper files.

It's an object with two keys. One key holds an array for all the `J`, `L`, `S`, `T` and `Z` tetrominos; the other key is for the `I` tetromino. The data for each of these keys is an array of objects each representing the tests for a starting rotation and direction. We use this to determine which tests to run.

Update `rotateCurrentPiece` to include our new wall kick checks:

`src/stores/currentPiece.js`

```js
import { writable } from 'svelte/store'
import klona from 'klona'

import { detectMatrixCollision, rotate } from '../matrixHelpers'
import { kicks } from '../wallKicks'
/* *** */

function createCurrentPiece(initialPiece) {
  const { set, update, subscribe } = writable()
  return {
    /* *** */
    rotateCurrentPiece(board, direction = 1) {
      update(prevPiece => {
        // 0. if this is the "O" piece we can just return it
        if (prevPiece.name === 'O') {
          return prevPiece
        }

        // 1. clone the current piece in case we have to return original
        let newPiece = klona(prevPiece)

        // 2. store a reference to the starting rotation position (0-3)
        // and advance rotation position
        const rotation = newPiece.rotation
        newPiece.rotation = (prevPiece.rotation + 1) % 4

        // 3. rotate the cloned piece's matrix
        newPiece.matrix = rotate(newPiece.matrix, direction)

        // 4. If the rotation results in a collision
        if (detectMatrixCollision(newPiece, board)) {
          // 4a. Find the tests for this piece from the pre-defined object of kicks
          const pieceKicks = kicks[Object.keys(kicks).filter(kick => kick.includes(newPiece.name))]
          // 4b. Grab the tests for the current start rotation and direction
          const tests = pieceKicks.filter(
            k => k.rotation === rotation && k.direction === direction
          )[0].tests
          // 4c. Store reference to current state
          let validRotation = false
          // 4d. Run thru the tests - return the new piece adjusted for kick when first non-collision position found
          for (let test of tests) {
            // 5. If test results in collision-free placement
            if (!detectMatrixCollision(newPiece, board, test.dx, test.dy)) {
              validRotation = true

              newPiece.x += test.dx
              newPiece.y += test.dy

              break
            }
          }

          // 6. After checking our tests return new or previous piece
          if (validRotation) {
            return newPiece
          } else {
            return prevPiece
          }
          // 7. Original rotation didn't result in collicion
        } else {
          return newPiece
        }
      })
    },
  }
}
```

The comments should do a good job of explainign what's going on. Besides that we are doing some filtering of our wall kick object to get the right section for the tests. We keep track of whether the rotation is valid or not so we know if we need to return the new piece or the piece in its previous state and unrotated.

One last thing - the wall kicks will also kick our "I" piece off of the top of the board. What we would like to happen is for our detection to consider the area above the board as empty. We can do this in our `notOccupied` check.

Since our board matrix row indexes go from 0-20 any row index above the board is a negative number. We can consider a cell not occupied if the y-position is negative of the cell in question in our piece. This will allow the "I" piece to rotate freely if it intersects that area above the board.

> Had we spawned our pieces above the board instead of in the classic NES style this simple hack would result in a game never ending since spawning pieces would be considered valid even after all pieces reach the top.

`src/matrixHelpers.js`

```js
function notOccupied(x, y, board) {
  return y < 0 || (board[y] && board[y][x] === 0)
}
```

If you check out the game you can now see the pieces kick off against the walls, floor, and other tetrominos on the board and "I" pieces won't kick off the top when you rotate them as they spawn.

## Wrapping Up

We've almost got a game that's ready to be played. But our pieces still just sit up top until we interact with them. In the next part of the series we'll tackle the automated falling of our tetrominos as well as clearing completed rows.

[Part One - The Basic Set Up](/writing/svelte-tetris-part-one)
[Part Two - The Board and Pieces](/writing/svelte-tetris-part-two)
[Part Three - Player Movement and Collision Detection](/writing/svelte-tetris-part-three)
Part 4 - SRS Guidelines:
Spawn Orientation ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-spawn) | [preview](https://04-SRS-spawn--svelte-tetris.netlify.app/))
Basic Rotation ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-rotation) | [preview](https://04-SRS-rotation--svelte-tetris.netlify.app/))
Wall Kicks ([github](https://github.com/babycourageous/svelte-tetris/tree/04-SRS-wall-kicks) | [preview](https://04-SRS-wall-kicks--svelte-tetris.netlify.app/))
[Part Five - Automatic Falling and Clearing Lines](/writing/svelte-tetris-part-five)
Part Six - Next Piece, Levels, Lines, Score, and Statistics (Coming Soon)
