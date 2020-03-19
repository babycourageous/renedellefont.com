---
title: An Overview Of The Posts Collection
date: 2019-10-28
---

This project scaffold includes support for post pages.

The common front-matter data for all of the files in the posts directory are abstracted into a `posts.json` file.

```js
{
  "layout" : "layouts/post.md",
}
```

This way they aren't repeated in every post file.

All post pages live in a collection that is created in the `.eleventy.js` config file with a glob pattern.

```js
// Posts collection using glob
eleventyConfig.addCollection('posts', function(collection) {
  return collection.getFilteredByGlob('./src/posts/**')
})
```

This way all posts can be iterated over. An example of this is the posts listing on the [Home](/) page.
