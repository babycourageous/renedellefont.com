---
title: User Authentication with PassportJS and a Polka server
date: 2019-11-20
featuredimage:
excerpt: Passport is authentication middleware for Node.js that can be unobtrusively dropped in to almost any web application.
alternative:
  - express
category: authentication
type: tutorial
tags:
  - express
  - polka
  - nodejs
  - authentication
  - mongoDB
  - mongoose
  - passport
toc: true
---

Setting up user authentication is pretty much the worst. Passport.js alongside our Polka server will hopefully help make it a little easier.

Passport is authentication middleware for Node.js. Since it's a middleware it can be dropped into a web application relatively painlessly.

Passport uses an extensive set of plugins known in Passport world as _strategies_. The most common (and simplest of them) is the one we are exploring in this tutorial - the classic login with a username (email) and password. To accomplish this we will be implementing Passport's local strategy along with a MOngoDB backend connected by Mongoose.

Using Passport.js means that most of the user authentication hullabloo is already taken care off. The only things we will still have to handle are:

- Storing and authenticating any user information with Mongoose in our MongoDB database.
- Handling sessions and cookies so users don’t have to login every time they visit our app.

## Initial Server Setup

This tutorial relies on having a server up and running. Express is the usual choice but I'm partial to [Polka](https://github.com/lukeed/polka). If you aren't familiar with Polka, it's a lightweight and highly performant alternative to Express. Express is definitly the big player in the NodeJS ecosystem but I've been enjoying playing around with this option. Since it doesn't come with every bell and whistle you could ever want (remember it's more lightweight 😉) we will have to add a few of our own adjustments along the way.

Begin by creating a project folder, let's say **polka-passport-login** - but you can really name this whatever your heart desires. Pop open that Terminal (or iTerm or whatever Windows jam ya use) and `cd` on into that folder.

Initialize a node project with `npm` or `yarn`. From here on out it's gonna be `yarn` commands but how you roll your `node` projects is entirely up to you.

```bash
yarn init -y
```

Next it's time to install our initial dependencies:

```bash
yarn add polka nunjucks @polka/send-type
```

As well as the initial development dependencies:

```bash
yarn add --dev nodemon
```

With our initial project set up, lets create a simple polka server.

Create a file in the root of the project called `server.js` and add the following code:

`server.js`

```js
const polka = require('polka')

polka()
  .get('/', (req, res) => {
    console.log(`~> Hello from the polka app!`)
    res.end('Hello World')
  })
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

All we are doing here is importing Polka, handling GET requests on the index (`'/'`) route, and listening on port **3000**. The polka server will log a message to the console and send a message to the browser whenever `'/'` is visited.

If you type `node server.js` in the terminal you should see those two messages. Go ahead and stop the server (`CONTROL` + `C` on a Mac).

Obviously typing `node server.js` and manually stopping the server is a real pain. Let's throw a development script into that `package.json` file of ours by adding a `"scripts"` key with a script to run.

`package.json`

```json
"scripts": {
  "dev": "nodemon server.js"
},
"dependencies": {...}
```

Now we can simply run `yarn dev` and `nodemon` will handle to restarting of the server whenever we make changes to those files!

## Add Nunjucks

One area where Polka doesn't come to the table with any opinion is templating. Polka doesn't come with view/template engines out of the box but rolling our own middleware ain't so tough.

### Create Nunjucks Middleware

Start by creating a `middleware` folder at the root of our app. Here's where we will add this and any other middleware that we will need. Simply put, middleware are just functions that run in between ("middle", get it?) receiving the _request_ and executing the route's handler _response_.

We're gonna keep it pretty simple (for now) and just include the bare minimum we need. The template middleware will attach a `"render"` method to the response object that will in turn call nunjucks' native render method. Since this middleware will be called universally on each route, every response handler will have this render method. BOOM! Templates support!

`middleware/njk-engine.js`

```js
const { join } = require('path')
const send = require('@polka/send-type')
const nunjucks = require('nunjucks')

const views = join(__dirname, '../', 'views')

// configure nunjucks to use layouts in views folder
nunjucks.configure('views')

module.exports = (req, res, next) => {
  // Attach a "render" method to res
  res.render = (file, data) => {
    // compile the file with any data
    nunjucks.render(join(views, file), data, (err, html) => {
      // handle error, else return output
      if (err) return send(res, 500, err.message || err)
      send(res, 200, html, { 'content-type': 'text/html' })
    })
  }
  next()
}
```

### Add default layout for templates

With that done now it's time to create some simple templates and a default layout that all our views will inherit from. At the root level create a folder called `views`. This will be home to all our nunjucks-related templates, layouts, and partials/includes.

`views/default.njk`

{% raw %}

```twig

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Passport Login with Node.js and Polka!</title>
  </head>
  <body>
    <div>
      {% block content %} This is the default content {% endblock %}
    </div>
  </body>
</html>
```

{% endraw %}

The layout is pretty straightforward and mostly for testing. It some boilerplate HTML5 and a `content` block. This way, our child templates can override the block with its own content. In Nunjucks land this is called _Template Inheritance_ and it's pretty powerful stuff.

### Add basic views

Create the following views. They each will `extend` the default layout and define their own `content` block to override the definition in our layout.

`views/index.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

<h1>hi {{ name }}</h1>
<p>Click here to <a href="/users/register">Register</a> and here to <a href="/users/login">Login</a></p>
{% endblock %}
```

{% endraw %}

`views/login.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

<h1>Login</h1>
{% endblock %}
```

{% endraw %}

`views/register.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

<h1>Register</h1>
{% endblock %}
```

{% endraw %}

Yup, they basic.

![Ya Basic, templates](https://media.giphy.com/media/l1KdbHUPe27GQsJH2/giphy.gif)

The only thing special here is that we are testing passing variables with the `index.njk` view. The variable will come from our route handler polka-side. Speaking of...

### Add Nunjucks to Polka

Update the `server.js` file with the following. Up top we require our Nunjucks middleware that we created. Then we replace our original `get` handler with three new ones that will each render their own respective route and template using our new `render` method. Neat!

`server.js`

```js
const polka = require('polka')
const njkEngine = require('./middleware/njk-engine')

const app = polka()

app
  .use(njkEngine)
  .get('/', (req, res) => {
    res.render('index.njk', { name: 'babycourageous' })
  })
  .get('/users/login', (req, res) => {
    res.render('login.njk')
  })
  .get('/users/register', (req, res) => {
    res.render('register.njk')
  })
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

Now that you see how the `render` method works hopefully it all start to make sense.

## Add some style

What's a demo app without some style? We could focus solely on the functionality but let's spread our wings and bring in something to help make it nice to look at. I'm a big fan of [TailwindCSS](https://tailwindcss.com/) and so we are gonna use that.

If you aren't familiar, Tailwind is a "utility-first" CSS framework that kicks all the ass.

### Initial Tailwind Setup

Tailwind is traditionally used as a PostCSS plugin. There IS a CDN of the entire thing we could just link to and call it a day... but hey, let's challenge ourselves to integrate it into our app.

First add it to the project.

```bash
yarn add tailwindcss
```

We will need to customize Tailwind a little bit down the road so let's add a Tailwind config as well.

```bash
npx tailwind init
```

This will create an empty `tailwind.config.js` file in our root. We can leave it be for now.

Originally I tried to be all slick by adding PostCSS as a middleware to our server but just couldn't get it working right... Challenge fail? Not so fast... I ditched that method and went the classic route of adding a styles build script to the `package.json`. Sometimes you just gotta stick to what ya know.

To keep with the theme of keeping things style-related simple I'll use tailwind directly to build our CSS instead of going with the whole PostCSS, config, plugin route (though that's my usual flavor). Simplicity for the win!

`package.json`

```json
"scripts": {
  "predev": "yarn tw",
  "dev": "nodemon server.js",
  "tw": "npx tailwind build app.css -o public/tailwind.css"
},
```

Now when we run our dev command it will first run `predev`. The `predev` script simply calls another custom script called `tw` that compiles our css outputting it to a `tailwind.css` file in the `public` folder, which we will add momentarily. There's no watching or reloading of CSS files nor is there any purging of unused classes with PurgeCSS. Lazy? Yes. But it's a demo so cut me some slack.

The last step in the initial setup is to add an `app.css` file to the root of our project with the tailwind directives. Tailwind will swap these directives out at build time with all of its generated CSS.

`app.css`

```css
@tailwind base;

@tailwind components;

@tailwind utilities;
```

### Serve up static files with Sirv

We need to serve our css as a static file. [Sirv](https://github.com/lukeed/sirv) is another project by the author of Polka, [lukeed](https://github.com/lukeed). It's an optimized middleware for serving static files, which is just what we need to serve up our css!

First up, add the package to the project.

```bash
yarn add sirv
```

Then add a folder called `public` to the root of the app. This is where the css gets built to and where any other static files will be served from.

Finally, require the package in our `server.js` file and add the middleware to the appropriate section.

`server.js`

```js
const polka = require('polka')
const serve = require('sirv')('public')
const njkEngine = require('./middleware/njk-engine')

const app = polka()

app
  .use(njkEngine)
  .use(serve)
  .get('/', (req, res) => {
    res.render('index.njk', { name: 'babycourageous' })
  })
  .get('/users/login', (req, res) => {
    res.render('login.njk')
  })
  .get('/users/register', (req, res) => {
    res.render('register.njk')
  })
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

### Add Tailwind to our layout

We have `tailwind` creating a css file and `sirv` serving it up from our static `public` folder. All that's left to do is add a link to the compiled tailwind styles to the Nunjucks layout. Update the head to look like this:

`views/layout.njk`

{% raw %}

````twig
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="ie=edge" />
  <title>Passport Login with Node.js and Polka!</title>
  <link rel="stylesheet" href="/tailwind.css" />
</head>
<body>
    <main class="container mx-auto pb-10">
      {% block content %}
      This is the default content
      {% endblock %}
    </main>
  </body>
</html>
```
{% endraw %}

We threw in some Tailwind classes for good measure. When you visit any of the routes now, the content shoul be centered in the viewport (`mx-auto`) with a `max-width` that adjusts to default browser width breakpoints Tailwind provides.

## Organize Our Routes

At this point I'm gonna do a little route refactoring. Sure we could have started here but I wasn't thinking ahead, heheh.

Since our project will have a few API routes with some cumbersome code we will organize all our routes in a separate `routes` folder to keep things in our main file nice and tidy(ish). What's super handy is that every router file can load other router files, which makes it easy to organizing the app as a hierarchy of routers if needed (though usually it tends to stay one level deep).

Create a `routes` folder in the root of the project and inside create two files: `index.js` and `users.js`.

### Users routes

The `users.js` file will handle defining the logic for routes that fall under the **"users"** path and then it exports the entire router so that it can be used elsewhere. This is often referred to as a _sub-app_.

Again for now we will just keep things simple for testing that our refactor actually works.

`routes/users.js`

```js
const polka = require('polka')

const router = polka()
  // login page
  .get('/login', (req, res) => res.render('login.njk'))
  // register page
  .get('/register', (req, res) => res.render('register.njk'))

module.exports = router
````

All that we're doing currently is defining the **login** and **register** routes. When we incorporate this into polka as middleware, the app will respond to **/users/login** and **/users/register** requests and render the relevant view.

### Index routes

The `index.js` file will import the **users** routes as well as define the routing for any routes without a prefix - like the **index** page and later on the **dashboard** page. For now let's just deal with the importing of `users.js` and the home page.

`routes/index.js`

```js
const polka = require('polka')
const users = require('./users') // import users "sub-app"

const router = polka()
  .use('/users', users)
  .get('/', (req, res) => res.render('index.njk', { name: 'babycourageous' }))

module.exports = router
```

The important part is the `.use` portion. This is a _filtered_ middleware that is only run when the _pathname_ matches. In this case the middleware is only run when the route begins with `/user`. So the routes `/login` and `/register` defined in the `users.js` file will be handled when `/users/login` or `users/register` are visited, respectively.

All that's left to do is tie it all together in `server.js`. Replace the entirity of the file with the following:

`server.js`

```js
const polka = require('polka')
const serve = require('sirv')('public')
const njkEngine = require('./middleware/njk-engine')
const routes = require('./routes')
const app = polka()

app
  .use(njkEngine)
  .use(serve)
  .use(routes)
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

Try navigating around to make sure everything is honky dory.

## Flesh out our design

Everything is functioning the way it should. We have a NodeJS app with a Polka server along with Nunjucks as a templating engine via Polka middleware. We've even refactored our routing in the process.

Now let's get this looking like an actual app!

### Add Tailwind Forms Plugin

By default form elements (input, select, checkbox, radio, etc) look downright in Tailwind. Usually the only way to make them look halfway decent is by adding Tailwind classes to all of them or creating custom Tailwind components. Recently though, Tailwind has provided a plugin that makes it easy to provide a better starting point for form elements.

```bash
yarn add @tailwindcss/custom-forms -D
```

Then we will update our Tailwind config with this plugin.

```js
module.exports = {
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require('@tailwindcss/custom-forms')],
}
```

### Update our views

The main page of the app is where a user can choose to register or login. Replace the current `views/index.njk` with the following:

`views/index.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-2/5 mx-auto">
      <div class="relative flex flex-col items-center p-5 bg-white border border-gray-300 rounded shadow-lg">
        <svg class="w-16 h-16 text-green-500 fill-current" viewBox="0 0 80 80">
          <path d="M40 9c-11.586 0-21 9.414-21 21s9.414 21 21 21 21-9.414 21-21S51.586 9 40 9zm-1 2.062V20h-7.688c.388-1.358.844-2.626 1.375-3.719 1.455-2.987 3.304-4.775 5.376-5.187h.061c.29-.028.583-.016.875-.031zm2 0c.313.016.628 0 .938.031 2.07.413 3.92 2.2 5.374 5.188.532 1.092.988 2.361 1.376 3.719H41v-8.938zm-8.281 1.375c-.697.867-1.305 1.861-1.844 2.97-.666 1.367-1.214 2.92-1.656 4.593h-5.344c2.085-3.357 5.152-6.035 8.844-7.563zm14.562 0c3.692 1.528 6.76 4.206 8.844 7.563h-5.344c-.442-1.673-.99-3.226-1.656-4.594-.54-1.108-1.147-2.102-1.844-2.969zM22.781 22h5.969c-.429 2.172-.665 4.542-.719 7h-6.969c.13-2.49.723-4.856 1.72-7zm8.031 0H39v7h-8.969c.06-2.493.325-4.853.781-7zM41 22h8.188c.456 2.147.722 4.507.78 7H41v-7zm10.25 0h5.969a18.93 18.93 0 011.719 7h-6.97c-.052-2.458-.29-4.828-.718-7zm-30.188 9h6.97c.053 2.468.285 4.826.718 7h-5.969a18.93 18.93 0 01-1.719-7zm8.97 0H39v7h-8.188c-.456-2.14-.722-4.508-.78-7zM41 31h8.969c-.06 2.492-.325 4.86-.781 7H41v-7zm10.969 0h6.969a18.931 18.931 0 01-1.72 7H51.25c.433-2.174.665-4.532.719-7zm-28.094 9h5.344c.442 1.666.99 3.196 1.656 4.563.54 1.108 1.147 2.127 1.844 3-3.692-1.528-6.76-4.206-8.844-7.563zm7.438 0H39v8.938c-.303-.016-.607 0-.906-.031-2.084-.408-3.946-2.218-5.406-5.22-.532-1.092-.988-2.333-1.376-3.687zM41 40h7.688c-.388 1.353-.844 2.595-1.376 3.688-1.467 3.016-3.341 4.823-5.437 5.218-.289.028-.583.016-.875.031V40zm9.781 0h5.344c-2.085 3.357-5.152 6.035-8.844 7.563.697-.873 1.305-1.892 1.844-3 .665-1.367 1.214-2.897 1.656-4.563zM20 59a1 1 0 100 2h40a1 1 0 100-2H20zm0 10a1 1 0 100 2h40a1 1 0 100-2H20z"/>
        </svg>
        <h1 class="font-bold text-2xl text-green-500">NodeJS Passport with Polka</h1>
        <p class="text-gray-700">Create an account or login</p>
        <a
          href="/users/register"
          class="block w-full py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600"
        >Register</a>
        <a
          href="users/login"
          class="block w-full py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600"
        >Login</a>
      </div>
    </div>
  </div>
{% endblock %}
```

{% endraw %}

Now we will add design to our register and login pages. Each will contain a form that will POST to a page on our `users` API route. We will define those handlers soon.

`views/register.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-1/2 mx-auto">
      <div class="relative flex flex-col p-5 bg-white border border-gray-300 rounded shadow-lg">
        <svg class="mr-2 w-12 h-12 text-green-500 fill-current" viewBox="0 0 100 100">
          <path d="M63.35 49.805c9.045 0 16.404-8.797 16.404-19.611 0-10.287-6.746-17.473-16.404-17.473-9.656 0-16.402 7.186-16.402 17.473-.001 10.814 7.359 19.611 16.402 19.611zm0-32.084c6.822 0 11.404 5.012 11.404 12.473 0 8.057-5.115 14.611-11.404 14.611-6.287 0-11.402-6.555-11.402-14.611-.001-7.462 4.581-12.473 11.402-12.473zm29.572 57.127c-.043-2.65-.059-3.326-.09-3.633C91.49 58.922 81.158 52.15 63.742 52.15c-.111 0-.221.004-.332.008l-.06.002-.061-.002a8.98 8.98 0 00-.334-.008c-17.416 0-27.746 6.771-29.086 19.064-.031.289-.047.848-.086 3.318l-.023 1.41c0 .059.012.113.014.172.006.088.01.176.023.264.012.082.033.158.055.238.02.078.039.154.066.23s.063.148.1.223c.035.072.068.146.111.215.043.07.09.133.139.197s.096.131.152.191c.059.064.125.121.191.18.043.039.08.084.127.119 8.047 6.176 17.67 9.307 28.607 9.307h.004c10.633 0 20.492-3.195 28.52-9.238l.008-.006c.023-.018.047-.033.07-.051.047-.035.084-.08.127-.117.068-.061.139-.119.201-.186.055-.061.102-.125.15-.189s.098-.129.141-.197c.043-.07.076-.143.113-.217.035-.072.07-.143.1-.219.027-.078.047-.156.068-.234.02-.078.043-.154.055-.234.016-.09.018-.18.023-.271.002-.057.016-.113.014-.172l-.017-1.099zM63.35 82.279h-.004c-9.359 0-17.613-2.539-24.564-7.539l.002-.129c.016-1.043.041-2.621.057-2.855 1.314-12.07 13.84-14.605 24.115-14.605l.34.01c.035.002.074.002.111 0l.336-.01c10.275 0 22.801 2.535 24.113 14.549.02.289.047 1.926.064 3.029-6.982 4.941-15.445 7.55-24.57 7.55zM40.061 47.305a2.5 2.5 0 00-2.5-2.5h-11.5v-11.5a2.5 2.5 0 10-5 0v11.5h-11.5a2.5 2.5 0 100 5h11.5v11.5a2.5 2.5 0 105 0v-11.5h11.5a2.5 2.5 0 002.5-2.5z"/>
        </svg>
        <h1 class="text-green-700 text-center">Register</h1>
        <form class="w-full mt-3" action="/users/register" method="POST">
          <div>
            <label class="block" for="name">
              <span class="text-gray-700">Name</span>
              <input
                type="name"
                id="name"
                name="name"
                class="form-input mt-1 block w-full"
                placeholder="Full Name"
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="email">
              <span class="text-gray-700">Email</span>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input mt-1 block w-full"
                placeholder="Email"
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="password">
              <span class="text-gray-700">Password</span>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input mt-1 block w-full"
                placeholder="Password"
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="password2">
              <span class="text-gray-700">Confirm Password</span>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                class="form-input mt-1 block w-full"
                placeholder="Confirm Password"
              />
            </label>
          </div>
          <button type="submit" class="block w-full py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600">Register</button>
        </form>
      </div>
      <p class="mt-4 text-sm text-gray-700 text-center">Already have an Account? <a class="text-blue-500" href="/users/login">Login</a>
      </p>
    </div>
  </div>
{% endblock %}
```

{% endraw %}

`views/login.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-1/2 mx-auto">
      <div class="relative flex flex-col items-center p-5 bg-white border border-gray-300 rounded shadow-lg">
        <svg class="w-10 h-10 text-green-500 fill-current" viewBox="0 0 16 16">
          <path d="M6 5.75H0v4.5h6V14l6-6-6-6v3.75z"/>
          <path d="M11.895 1.875H10.42A.43.43 0 0110 1.438.43.43 0 0110.421 1h1.474C13.055 1 14 1.981 14 3.188v9.624C14 14.02 13.056 15 11.895 15H10.42a.43.43 0 01-.421-.438.43.43 0 01.421-.437h1.474c.696 0 1.263-.589 1.263-1.313V3.188c0-.724-.567-1.313-1.263-1.313z"/>
        </svg>
        <h1 class="text-green-700 text-center">Login</h1>
        <form class="w-full mt-3" action="/users/login" method="POST">
          <div>
            <label class="block" for="email">
              <span class="text-gray-700">Email Address</span>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input mt-1 block w-full"
                placeholder="Email Address"/>
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="password">
              <span class="text-gray-700">Password</span>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input mt-1 block w-full"
                placeholder="Password"/>
            </label>
          </div>
          <button type="submit" class="block w-full py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600">Login</button>
        </form>
      </div>
      <p class="mt-4 text-sm text-gray-700 text-center">Don't have an Account? <a class="text-blue-500" href="/users/register">Register here</a>
      </div>
    </div>
  {% endblock %}
```

{% endraw %}

Check them pages. Looking pretty good.

## Integrate MongoDB (via Mongoose)

In case MongoDB is new to you here's a quick rundown: It's an all-purpose, document-based, NoSQL database that is very popular for NodeJS apps.

Setting up a database and a collection is fairly straightforward and MongoDB has [decent docs](https://docs.atlas.mongodb.com/getting-started/) walking you through the process. We're gonna use the MongoDB Atlas free tier.

### MongoDB Atlas setup

Create a MongoDB project called **passport-polka** with a database called **passport** containing a single collection, **users**. Feel free to mimic this structure, or not. What you name stuff here is entirely up to you. Then create a database user that has Read/Write access to this database as well as Whitelisting your local environment. This will be necessary for accessing the DB from the app.

### Add Mongoose

To make dealing with writing MongoDB validation, casting, and business logic boilerplate much less a pain in the ass, we'll use Mongoose as our go-between.

```bash
yarn add mongoose
```

Create a folder in the root of the app called `config`. This will be where we put any configuration or initialization files for this project. Inside add a flie called `mongo.js`. This will hold an object that defines our connect string, which is found in the MongoDB Atlas Connection tab, as well as our connection options. If you forget to add these options when connecting to MongoDB, Mongoose will warn you in the console with the proper instructions.

`config/mongo.js`

```js
module.exports = {
  mongo: {
    URI: 'MONGO_DB_CONNECTION_STRING',
  },
  mongoose: {
    options: { useNewUrlParser: true, useUnifiedTopology: true },
  },
}
```

### Polka + Mongoose

Now it's time to wire up our settings in our server.

Add mongoose and our mongoose config to the list of require statements up top, then replace the server code (everything under `const app = polka()`) with the following:

`server.js`

```js
const polka = require('polka')
const mongoose = require('mongoose')
const serve = require('sirv')('public')
const njkEngine = require('./middleware/njk-engine')
const routes = require('./routes')
const db = require('./config/db')

const app = polka()

// wrap everything in async IIFE to ensure order of operation
// MongoDB connects before we start our server
;(async () => {
  try {
    await mongoose.connect(db.mongo.URI, db.mongoose.options)
    console.log('MongoDB connected!')
  } catch (err) {
    console.log('error: ' + err)
  }

  app
    .use(njkEngine)
    .use(serve)
    .use(routes)
    .listen(3000, err => {
      if (err) throw err
      console.log(`> Running on localhost:3000`)
    })
})()
```

Another tiny refactor - the code now executes inside an IIFE to take advantage of async/await with Mongoose. Although, Mongoose queries are not promises; they are thenables. That means they have a `.then()` function, so you can use queries as promises with either promise chaining or `async/await`. Refactoring it this way means our app connects to MongoDB before we spin up the server. I don't know that this is necessary but it seems to make sense to have it sequentially spun up in that way.

Other options are creating an async function that initializes Mongoose that is called manually or the classic Promise `.then/.catch` syntax. Running Mongoose either of these ways would have the MongoDB connection and server connection happening concurrently. The github repo for this post has both these examples commented out to check out.

### Add the User model

Mongoose derives all its knowledge from a Schema. It then compiles this Schema into a Model. A Model is simply a class that allows us to construct documents. In the case of this app, each document will be a user with properties - name, email, password - that are declared in the schema.

Time to create a User schema and model. Create a new file `User.js` inside a new folder called `models` in the root of the app and paste the following code:

`models/User.js`

```js
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

const User = mongoose.model('User', UserSchema)

module.exports = User
```

## Wire up registration form

In order to handle the incoming request body from our forms another middleware will be used - [body-parser](https://github.com/expressjs/body-parser). The `body-parser` middleware parses incoming request bodies before any handlers and makes them available under the `req.body` property.

```bash
yarn add body-parser
```

The recommendation from `body-parser` is to add any body parsers specifically to the routes that need them. Since that's the recommendation, we'll opt to use route-specific middleware instead of the global middleware we've been implementing.

`routes/users.js`

```js
const polka = require('polka')
const bodyparser = require('body-parser')

var urlencodedParser = bodyparser.urlencoded({ extended: false })

const router = polka()
  // login page
  .get('/login', (req, res) => res.render('login.njk'))
  // register page
  .get('/register', (req, res) => res.render('register.njk'))
  .post('/register', urlencodedParser, (req, res) => {
    const { name, email, password, passwordConfirm } = req.body

    let errors = []

    // simple required fields check
    if (!name || !email || !password || !passwordConfirm) {
      errors.push({ msg: 'Please make sure to fill in all the fields.' })
    }

    // password match check
    if (password !== passwordConfirm) {
      errors.push({ msg: 'Passwords do not match.' })
    }

    // password length must be 6 characters or more
    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters.' })
    }

    if (errors.length > 0) {
      res.render('register.njk', { errors, name, email })
    } else {
      res.end('pass!')
    }
  })

module.exports = router
```

Up top we require body-parser and then store it's urlencoder to a constant. Then a POST handler is added to our register route that performs some simple checks and if there is an error simply renders the register view and passes the error along with the name and email. Name and email are used as the form values when rendering so the user doesn't have to start from scratch.

Replace register view with the following:

`views/register.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-1/2 mx-auto">
      <div class="relative flex flex-col p-5 bg-white border border-gray-300 rounded shadow-lg">
        <svg class="mr-2 w-12 h-12 text-green-500 fill-current" viewBox="0 0 100 100">
          <path d="M63.35 49.805c9.045 0 16.404-8.797 16.404-19.611 0-10.287-6.746-17.473-16.404-17.473-9.656 0-16.402 7.186-16.402 17.473-.001 10.814 7.359 19.611 16.402 19.611zm0-32.084c6.822 0 11.404 5.012 11.404 12.473 0 8.057-5.115 14.611-11.404 14.611-6.287 0-11.402-6.555-11.402-14.611-.001-7.462 4.581-12.473 11.402-12.473zm29.572 57.127c-.043-2.65-.059-3.326-.09-3.633C91.49 58.922 81.158 52.15 63.742 52.15c-.111 0-.221.004-.332.008l-.06.002-.061-.002a8.98 8.98 0 00-.334-.008c-17.416 0-27.746 6.771-29.086 19.064-.031.289-.047.848-.086 3.318l-.023 1.41c0 .059.012.113.014.172.006.088.01.176.023.264.012.082.033.158.055.238.02.078.039.154.066.23s.063.148.1.223c.035.072.068.146.111.215.043.07.09.133.139.197s.096.131.152.191c.059.064.125.121.191.18.043.039.08.084.127.119 8.047 6.176 17.67 9.307 28.607 9.307h.004c10.633 0 20.492-3.195 28.52-9.238l.008-.006c.023-.018.047-.033.07-.051.047-.035.084-.08.127-.117.068-.061.139-.119.201-.186.055-.061.102-.125.15-.189s.098-.129.141-.197c.043-.07.076-.143.113-.217.035-.072.07-.143.1-.219.027-.078.047-.156.068-.234.02-.078.043-.154.055-.234.016-.09.018-.18.023-.271.002-.057.016-.113.014-.172l-.017-1.099zM63.35 82.279h-.004c-9.359 0-17.613-2.539-24.564-7.539l.002-.129c.016-1.043.041-2.621.057-2.855 1.314-12.07 13.84-14.605 24.115-14.605l.34.01c.035.002.074.002.111 0l.336-.01c10.275 0 22.801 2.535 24.113 14.549.02.289.047 1.926.064 3.029-6.982 4.941-15.445 7.55-24.57 7.55zM40.061 47.305a2.5 2.5 0 00-2.5-2.5h-11.5v-11.5a2.5 2.5 0 10-5 0v11.5h-11.5a2.5 2.5 0 100 5h11.5v11.5a2.5 2.5 0 105 0v-11.5h11.5a2.5 2.5 0 002.5-2.5z"/>
        </svg>
        <h1 class="text-green-700 text-center">Register</h1>
        {%- include "partials/_messages.njk" -%}
        <form class="w-full mt-3" action="/users/register" method="POST">
          <div>
            <label class="block" for="name">
              <span class="text-gray-700">Name</span>
              <input
                type="name"
                id="name"
                name="name"
                class="form-input mt-1 block w-full"
                placeholder="Full Name"
                value="{{ name if name else '' }}"
                required
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="email">
              <span class="text-gray-700">Email</span>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input mt-1 block w-full"
                placeholder="Email"
                value="{{ email if email else '' }}"
                required
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="password">
              <span class="text-gray-700">Password</span>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input mt-1 block w-full"
                placeholder="Password"
                required
              />
            </label>
          </div>
          <div class="mt-4">
            <label class="block" for="password2">
              <span class="text-gray-700">Confirm Password</span>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                class="form-input mt-1 block w-full"
                placeholder="Confirm Password"
                required
              />
            </label>
          </div>
          <button type="submit" class="block w-full py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600">Register</button>
        </form>
      </div>
      <p class="mt-4 text-sm text-gray-700 text-center">Already have an Account? <a class="text-blue-500" href="/users/login">Login</a>
      </p>
    </div>
  </div>
{% endblock %}
```

{% endraw %}

Up top we added a Nunjucks include that will be used to display any error messages that come along for the ride from the route handler. Below that, the form fields are all made required. It's the least we can do to put a smidge of default validation using the native HTML5 Form Validation before it even hits the server. There is also an added `value` prop to the `name` and `email` fields that will check to see if any values have been passed in and if not default to empty.

### Add Nunjucks Messages Partial

To keep it simple there will be no interactivity. These will be simple alerts that will rely on re-submitting the form to close and reset. Create a folder called `partials` inside our `views` folder and inside create a file called `_messages`. It's common practice to name partials with a leading underscore.

Insert the following template code:

`views/partials/_messages.njk`

{% raw %}

```twig
{% if errors !== undefined %}
{%- for error in errors -%}

<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
<p>{{error.msg}}</p>
</div>
{%- endfor -%}
{% endif %}
```

{% endraw %}

Just a reminder that `errors` is passed into the `register.njk` template from the `users.js` route file. The `name` and `email` are passed in as well to keep those form fields from resetting.

`routes/users.js`

{% raw %}

```twig
res.render('register.njk', {errors, name, email})
```

{% endraw %}

## Wire up the database

Now we're ready to integrate the functionality of our register form!

### Password Hashing

We don't want to pass along the plain text version of the password. It's just not safe. One popular method is to use the [`bcrypt`](https://github.com/kelektiv/node.bcrypt.js) library to help out. It's a modern(-ish) password hashing tool.

```bash
yarn add bcryptjs
```

Polka doesn't come with response helpers out of the box. We need to handle some redirects so we'll also be using the `@polka/redirect` package to handle those upon successful user creation.

```bash
yarn add @polka/redirect
```

With those two packages installed we can move to making some updates to our register route.

`routes/users.js`

```js
const polka = require('polka');
const redirect = require('@polka/redirect')
const bodyparser = require('body-parser')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const router = polka()
  // ... OTHER ROUTE HANDLERS
  .post('/register', urlencodedParser, async (req, res) => {
  // ...
  // Error checking
  // ...
  if(errors.length > 0) {
    res.render('register.njk', {errors, name, email})
  } else {
    // Validation passed
    // See if user already exists
    const user = await User.findOne({ email })

    if(user) {
      errors.push({ msg: 'That email is already in use.' })
      res.render('register.njk', {errors, name, email})
    } else {
      const newUser = new User({
        name,
        email,
        password
      })

      // Hash tha password
      bcrypt.genSalt(10, (err, salt) =>
        bcrypt.hash(newUser.password, salt, async (err, hash) => {
          if(err) throw err

          // overwrite password with the new hash version
          newUser.password = hash

          // save user
          try {
            const savedUser = await newUser.save()
            req.flash('success_msg', 'You are now registered, feel free to login!')
            redirect(res, './login')
          } catch (error) {
            console.log(error)
          }
      }))
    }
  }
```

First thing's first - we add require declarations for the `@polka/redirect` and `bcrypt` packages. Below that we import our `User` model. Since Mongoose is queries are thenable update the handler to be async/await.

The bulk of the new code lives inside the `if/else` that follows our block of error checking. Since our rudimentary validation passed we check to see if there is already a User with the submitted email in the database. If so, we kick back to the register page with the error message; if not create a new User, hash our password, save the User to MongoDB, and redirect to the login page with a **flash** message.

### Adding Flash Messages

"Flash" middleware helps send information (an object, array, etc.) to a request you are redirecting to. Redirects are often combined with flash messages in order to display status information to the user. To make this easy we'll use the [**connect-flash**](https://github.com/jaredhanson/connect-flash) middleware.

```bash
yarn add connect-flash
```

Because we are redirecting the user we have to store any messages to display (success, error, etc) in a session. Since Polka is compatible with Express middleware out of the box, we will use the [**express-session**](https://github.com/expressjs/session) middleware. This is the package that the official [Svelte Real World](https://github.com/sveltejs/realworld/blob/master/src/server.js) example (which implements a Polka server) uses as well.

```bash
yarn add express-session
```

In order to detect the presence of these flash messages in our nunjucks messages partial we'll take a page out of the Express book and add a `locals` object to our server Response. This object will store store the flash message coming from the Request. These objects will be made available to our Nunjucks templates with a few extra lines of code in our Nunjucks Engine middleware (again following a pattern found in the Express library).

Add a file called `init.js` in the `middleware` folder. Add the following code, which is based on how Express initializes its Response helper.

`middleware/init.js`

```js
module.exports = (req, res, next) => {
  // create a locals namespace to pass request objects to
  res.locals = res.locals || Object.create(null)
  next()
}
```

The first time this middleware is run, it creates an empty object called locals on the Response. Anytime it runs after that it just copies over the existing `res.locals` object.

Time to update the Nunjucks template code to look for this `res.locals` object. Replace the middleware function with the following:

`middleware/njk-engine.js`

```js
module.exports = (req, res, next) => {
  // Attach a "render" method to res
  res.render = (file, data) => {
    // create object to store all data
    const renderOptions = {}

    // merge res.locals into renderOptions
    for (const key in res.locals) {
      renderOptions[key] = res.locals[key]
    }

    // merge local render data into renderOptions
    for (const key in data) {
      renderOptions[key] = data[key]
    }

    // compile the file along with any data
    nunjucks.render(join(views, file), renderOptions, (err, html) => {
      // handle error, else return output
      if (err) return send(res, 500, err.message || err)
      send(res, 200, html, { 'content-type': 'text/html' })
    })
  }
  next()
}
```

A check is added to see if any Response variables are declared before defaulting to variables being passed in to the template directly. These objects are all merged and used in our Nunjucks render function.

Update our messages partial to include any success or error flash messages from our app.

`views/partials/_message.njk`

{% raw %}

```twig
{% if errors !== undefined %}
{%- for error in errors -%}

<div class="w-full mt-2 p-2 bg-orange-100 border-l-4 border-orange-500 text-orange-700" role="alert">
<p>{{error.msg}}</p>
</div>
{%- endfor -%}
{% endif %}

{% if success_msg | length > 0 %}

  <div class="w-full mt-2 p-2 bg-green-100 border-l-4 border-green-500 text-green-700" role="alert">
    <p>{{success_msg}}</p>
  </div>
{% endif %}

{% if error_msg | length > 0  %}

  <div class="w-full mt-2 p-2 bg-orange-100 border-l-4 border-orange-500 text-orange-700" role="alert">
    <p>{{error_msg}}</p>
  </div>
{% endif %}
```

{% endraw %}

The basic templates for the messages are the same. The only difference is that each one checks to see if `success_msg` or `error_msg` is present before rendering them.

Add the flash middleware to our Polka server (some code omitted to save space):

`server.js`

```js
const polka = require('polka')
const mongoose = require('mongoose')
const serve = require('sirv')('public')
const flash = require('connect-flash')
const session = require('express-session')
const init = require('./middleware/init')
const njkEngine = require('./middleware/njk-engine')
const routes = require('./routes')
const db = require('./config/db')

const app = polka()

app
  .use(init)
  .use(njkEngine)
  .use(serve)
  .use(
    session({
      secret: 'SECRET_KEY',
      resave: true,
      saveUninitialized: true,
    })
  )
  .use(flash())
  .use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
  })
  .use(routes)
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

Here we require connect-flash, express-session, and our new init middleware. We add the init middleware as the first middleware in our chain and then our session, flash, and custom locals object definitaion middlewares.

## Login with PassportJS

The home stretch! Now it's time to get PassportJS hooked up to all of this. Remember, Passport is authentication middleware for NodeJS. It is designed to serve a singular purpose: authenticate requests. Exactly what we want.

```bash
yarn add passport passport-local
```

### Configure PassportJS

Passport authenticates requests through an extensible set of plugins known as _strategies_. The API is simple: you provide Passport a request to authenticate, and Passport provides hooks for controlling what occurs when authentication succeeds or fails. This project will use Passport's Local Strategy. Local Strategy authenticates by using a username and password.

We will create and configure the Local Strategy in a separate config file. Create a file named `passport.js` inside the `config` folder.

`config/passport.js`

```js
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const User = require('../models/User')

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email,
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' })
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err
          if (isMatch) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Password incorrect' })
          }
        })
      })
    })
  )

  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user)
    })
  })
}
```

Passport expects two things: a username and password. Since we are using email, we simply redifne the username field as `email` in an object before defining our _verify callback_. The purpose of a verify callback is to find the user that matches a set of credentials. If the credentials are valid, the verify callback invokes done to supply Passport with the user that authenticated:

```js
return done(null, user)
```

If the credentials are not valid (for example, if the email is not in the db), done is called with false instead of a user to indicate an authentication failure. An additional object with a message is supplied for displaying the flash message.

```js
return done(null, false, { message: 'That email is not registered' })
```

We match the User and check the password. In order to support login sessions, Passport will need to serialize and deserialize user instances to and from the session.

### Add Passport To Polka

Make the following updates to the `server.js` file:

Require passport up top with all the other packages:

`server.js`

```js
const passport = require('passport')
```

Somewhere before the Polka app is initialized, require and immediatly invoke the Passport config initialization function passing in our reference to Passport:

`server.js`

```js
require('./config/passport')(passport)
```

Add Passport middleware to Polka. Be sure to call this middleware **AFTER** the session middleware and **BEFORE** our routes.

```js
.use(session({
  'secret': 'SECRET_KEY',
  resave: true,
  saveUninitialized:true
}))
.use(passport.initialize())
.use(passport.session())
.use(flash())
.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  next()
})
```

In this project it's nestled between **session** and **flash** middlewares. In addition, a third `res.locals` variable was added (_`res.locals.error`_) to store any error messaging we set in `config/passport.js` to be passed along to our `login` route.

### Add Passport to LOGIN route

Add passport to the require statements. The **authenticate** method that Passport comes with is how we'll handle user authentication.

`routes/users.js`

```js
const passport = require('passport')
```

Under our `get` handler for `login` add a `post` handler to handle submission of the login form. We must also add our `urlencoded` middleware so that Passport can handle the user credentials being submitted. We are adding it directly to the route handler as recommended by the `bodyparser` utility. If we do not add the middleware, a **missing credentials error** will be thrown.

> Note: We can also add the middleware globally to our polka app and it will be applied to all routes. Applying it directly to routes is the recommended approach.

```js
.get('/login', (req, res) => res.render('login.njk'))
.post('/login', urlencodedParser, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if(err) return next(err)
    if (!user) {
      req.flash('error', info.message)
      return redirect(res, './login')
    }
    req.login(user, err => {
      if(err) return next(err)
      return redirect(res, '../dashboard')
    })
  })(req, res, next);
})
```

By defualt Passport uses `res.redirect` under the hood but a custom callback can be provided to allow the application to handle the success or failure. Since there is no `res.redirect` in Polka we use this custom callback approach with the `@polka/redirect` package we've already been using to handle our redirects.

If an exception occurred, `err` will be set.

```js
if (err) return next(err)
```

If authentication failed, `user` will be set to false. An optional info argument is also passed that contains additional details provided by the Local Strategy's verify callback.

```js
if (!user) {
  req.flash('error', info.message)
  return redirect(res, './login')
}
```

Finally, since a custom callback is being used, it becomes the application's responsibility to establish a session (by calling `req.login()`) and send a response.

```js
req.login(user, err => {
  if (err) return next(err)
  return redirect(res, '../dashboard')
})
```

Here we simply handle any errors and redirect the user to a dashboard page. Let's create that now. Inside our `views` folder create a file called `dashboard.js` and paste the following:

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-1/2 mx-auto">
      <h1 class="text-2xl text-green-700">Dashboard</h1>
      <p class="mb-3 text-gray-700">Welcome!!</p>
      <a href="/users/logout" class="inline-block py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600">Logout</a>
    </div>
  </div>
{% endblock %}
```

{% endraw %}

Update the `_messages.njk` partial with another section to handle any flash messaging from Passport.

`partials/_messages.njk`

{% raw %}

```twig
{% if error | length > 0 %}

  <div class="w-full mt-2 p-2 bg-orange-100 border-l-4 border-orange-500 text-orange-700" role="alert">
    <p>{{error}}</p>
  </div>
{% endif %}
```

{% endraw %}

### Add logout route and functionality

When the **logout** button is clicked on the dashboard page we would like to be logged out of the app and redirected to the login page with a success message. The **logout** link on our Dashboard page is already wired up to take us to `/users/logout` so we will add a GET handler for our `users/logout` route to pull this off. Add the following below our code for the `login` route:

`routes/users.js`

{% raw %}

```twig
//logout page
.get('/logout', (req, res) => {
req.logout()
req.flash('success_msg', 'You have been successfully logged out')
redirect(res, './login')
})
```

{% endraw %}

The function `req.logout()` is provided by the passport middleware. So we perform the logout, create our flash message, and redirect to the `users/login` route. Upon arrival we will be greeted with our success message since we already wired up the messaging earlier.

All that's left is to protect the Dashboard page. This page should only be visible if a registered user is logged in.

### Create the authorization function

Create a middleware to check user authentication.

`middleware/auth.js`

```js
const redirect = require('@polka/redirect')

module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    req.flash('error_msg', 'You must be logged in to view thiat page')
    redirect(res, '/users/login')
  },
}
```

In case we add to our authentication needs this is a named export. It uses the `req.isAuthenticated()` function supplied by Passport and moves along if it returns true. Otherwise an error message is set and the user is redirected to the `login` page.

### Update dashboard route

All we need to do is add the middleware to our dashboard route.

`routes/index.js`

```js
const polka = require('polka')
const users = require('./users') // import users "sub-app"
const { ensureAuthenticated } = require('../middleware/auth')

const router = polka()
  .use('/users', users)
  .get('/', (req, res) => res.render('index.njk'))
  .get('/dashboard', ensureAuthenticated, (req, res) =>
    res.render('dashboard.njk', { username: req.user.name })
  )

module.exports = router
```

The changes are the import of the `ensureAuthenticated` middleware and then calling it in our GET handler for `/dashboard`. The handler simply renders our dashboard and passes along a username that we get from our `request` object.

### Update dashboard view

This is a simple change - add a `username` variable to our Welcome message:

`views/dashboard.njk`

{% raw %}

```twig
{% extends "layout.njk" %}
{% block content %}

  <div class="flex mt-5">
    <div class="relative w-1/2 mx-auto">
      <h1 class="text-2xl text-green-700">Dashboard</h1>
      <p class="mb-3 text-gray-700">Welcome {{username}}!!</p>
      <a href="/users/logout" class="inline-block py-2 px-4 mt-4 text-white text-center leading-normal align-middle select-none rounded bg-green-500 hover:bg-green-600">Logout</a>
    </div>
  </div>
{% endblock %}
```

{% endraw %}

Pretty simple little dashboard.

That's it! It was a hell of a journey but we've made it. A working demo of Passport for a Polka app!
