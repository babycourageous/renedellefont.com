module.exports = (filename, alt = '', caption = '', ratio = '16/9') => {
  return `<figure><div style="--aspect-ratio: ${ratio};">
  <img class="shadow" src="./${filename}" alt="${alt}" /></div>
  ${caption ? `<figcaption class="mt-1 text-gray-600 text-sm">${caption}</figcaption>` : ''}
  </figure>`
}

/*
module.exports = ({ filename, alt = '', caption = '', ratio = '16/9' }) => {
  return `<figure><div style="--aspect-ratio: ${ratio};">
  <img class="shadow" src="/images/${filename}" alt="${alt}" /></div>
  ${caption ? `<figcaption class="mt-1 text-gray-600 text-sm">${caption}</figcaption>` : ''}
  </figure>`
}
*/