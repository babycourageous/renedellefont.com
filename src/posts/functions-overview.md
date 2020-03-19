---
title: An Overview Of Incorporating Netlify Functions
date: 2019-10-29
---

Netlify Functions live in the `_functions` directory inside `src`. The folder is ignored by 11ty via the `.eleventyignore` file in the root of the project.

A default Netlify skeleton for `node-fetch` is included that pings the [I Can Haz Dad Joke](https://icanhazdadjoke.com) API and simply returns a random joke as the message body.

You can see it in action here using the included Redirect (if you're looking at this locally, remember to run the development environment with `netlify dev` to see the redirect in action): [/api/node-fetch](/api/node-fetch)
