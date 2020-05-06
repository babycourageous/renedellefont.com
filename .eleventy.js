const pluginRss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const pluginTOC = require('eleventy-plugin-nesting-toc')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const dateFormat = require('./11ty/filters/date')
const sc = require('./11ty/shortcodes')

const mdOptions = {
  html: true,
  breaks: true,
  linkify: true,
}

// Anchor Rollover for Headings
const mdAnchorOptions = {
  permalink: true,
  permalinkSymbol:
    '<svg viewBox="0 0 20 21"><path d="M10 1.658L7.73 4.04c1.316-.275 2.994-.068 3.865.364l.494-.518c1.06-1.123 3.15-1.106 4.21 0 1.05 1.105 1.03 3.333 0 4.42l-3.16 3.317c-1.04 1.088-3.16 1.105-4.21 0-.38-.398-.63-.898-.76-1.417l-2.25 2.366c.26.45.56.864.92 1.244 2.1 2.21 6.3 2.228 8.4.017l3.18-3.333c2.1-2.21 2.1-6.632 0-8.842-2.11-2.21-6.32-2.21-8.42 0zM8.405 16.596l-.494.518c-1.06 1.123-3.15 1.106-4.21 0-1.05-1.105-1.03-3.333 0-4.42l3.16-3.317c1.04-1.088 3.16-1.105 4.21 0 .38.398.63.898.76 1.417l2.26-2.366c-.26-.45-.56-.864-.92-1.244-2.1-2.21-6.3-2.228-8.4-.017L1.58 10.5c-2.106 2.21-2.106 6.632 0 8.842 2.104 2.21 6.315 2.21 8.42 0l2.27-2.383c-1.316.27-2.994.06-3.865-.37z"></path></svg>',
}

module.exports = function(eleventyConfig) {
  eleventyConfig.setBrowserSyncConfig({
    files: ['_site/css/**/*', '_site/javascript/**/*'],
  })
  eleventyConfig.setLibrary('md', markdownIt(mdOptions).use(markdownItAnchor, mdAnchorOptions))

  /*
   * PLUGINS *
   */
  eleventyConfig.addPlugin(pluginRss)

  eleventyConfig.addPlugin(syntaxHighlight, {
    // init callback lets you customize Prism
    init: function({ Prism }) {
      require('prism-svelte')
    },
  })

  eleventyConfig.addPlugin(pluginTOC)

  /*
   * FILTERS *
   */
  eleventyConfig.addFilter('dateDisplay', dateFormat)
  eleventyConfig.addFilter('htmlDateString', dateObject => dateFormat(dateObject, 'yyyy-LL-dd'))

  /*
   * SHORTCODES *
   */
  eleventyConfig.addShortcode('figure', sc.figure)

  /*
   * COLLECTIONS
   */
  // Posts collection using glob
  eleventyConfig.addCollection('posts', function(collection) {
    return collection.getFilteredByGlob('./src/writing/**.md').filter(p => !p.data.draft)
  })

  eleventyConfig.addCollection('tagList', collection => {
    let tagSet = new Set()
    collection.getAll().forEach(function(item) {
      if ('tags' in item.data) {
        let tags = item.data.tags

        tags = tags.filter(function(item) {
          switch (item) {
            // this list should match the `filter` list in tags.njk
            case 'all':
            case 'nav':
            case 'post':
            case 'posts':
              return false
          }

          return true
        })

        for (const tag of tags) {
          tagSet.add(tag)
        }
      }
    })

    // returning an array in addCollection works in Eleventy 0.5.3
    return [...tagSet]
  })

  eleventyConfig.addCollection('categoryList', collection => {
    let categorySet = new Set()
    const writing = collection.getFilteredByGlob('./src/writing/**.md')

    writing.forEach(post => {
      if ('category' in post.data) {
        let categories = post.data.category
        if (typeof categories === 'string') {
          categories = [categories]
        }

        categories = categories.filter(function(item) {
          switch (item) {
            // this list should match the `filter` list in tags.njk
            case 'all':
            case 'nav':
            case 'post':
            case 'posts':
              return false
          }

          return true
        })

        for (const category of categories) {
          categorySet.add(category)
        }
      }
    })

    console.log(categorySet)
    return [...categorySet].filter(p => !p.data.draft).sort()

    /*
    posts.forEach(post => {
      categories = [...new Set([...categories, ...post.data.categories])];
    });
    categories.forEach(category => {
      let filteredPosts = posts.filter(post => post.data.categories.includes(category));
      let categoryDetails =  { 
        'title': category,
        'posts': [ ...filteredPosts ]
      };
      sortedPosts.push(categoryDetails);      
    });
    return sortedPosts;
    */
  })

  eleventyConfig.addPassthroughCopy({ 'src/_assets/images': 'images' })
  eleventyConfig.addPassthroughCopy('src/writing/**/*.(jpg|png)')
  eleventyConfig.addPassthroughCopy({ 'src/_assets/favicomatic/**/*': '/' })

  return {
    dir: {
      input: 'src',
      layouts: '_layouts',
    },
    htmlTemplateEngine: 'njk',
    templateFormats: ['html', 'njk', 'md'],
    markdownTemplateEngine: 'liquid',
  }
}
