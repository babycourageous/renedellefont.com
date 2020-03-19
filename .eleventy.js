const pluginRss = require("@11ty/eleventy-plugin-rss");
const dateFormat = require('./11ty/filters/date')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

module.exports = function(eleventyConfig) {
  eleventyConfig.setBrowserSyncConfig({
    files: [
      '_site/css/**/*',
      '_site/javascript/**/*'
    ]
  });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(syntaxHighlight)

  // Add a friendly date filter to nunjucks.
  // Defaults to format of LLL d, y unless an alternate is passed as a parameter.
  // {{ date | dateDisplay('OPTIONAL FORMAT STRING') }}
  eleventyConfig.addFilter('dateDisplay', dateFormat)
  eleventyConfig.addFilter('htmlDateString', dateObject => dateFormat(dateObject, 'yyyy-LL-dd'))


  // Unsorted items (in whatever order they were added)
  eleventyConfig.addCollection("all", function(collection) {
    return collection.getAll();
  });

  // Posts collection using glob
  eleventyConfig.addCollection('posts', function(collection) {
    return collection.getFilteredByGlob('./src/posts/**')
  })

  eleventyConfig.addPassthroughCopy({ "src/_assets/images": "assets/images" });

  return {
    dir: {
      input: 'src',
      layouts: '_layouts',
    },
    htmlTemplateEngine: 'njk',
    templateFormats: ['html', 'njk', 'md'],
  }
}
