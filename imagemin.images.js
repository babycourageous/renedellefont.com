const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')

const output = '_site/images'

;(async () => {
  try {
    await imagemin(['src/_assets/images/*.{jpg,png}'], {
      destination: output,
      plugins: [
        imageminMozjpeg({
          quality: 75,
        }),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    })
  } catch (err) {
    console.log(err)
  }
})()
