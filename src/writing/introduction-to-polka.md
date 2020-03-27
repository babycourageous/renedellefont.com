---
title: Introduction to Polka (an alternative to Express.js)
date: 2019-12-17
featuredimage: /images/writing/polka-screenshot.png
excerpt: Polka is an alternative to Express.js that is more minimal and performant. It's simply a native HTTP server with added support for routing, middleware, and sub-applications. That's it!
alternative:
  - express
category: polka
type: article
tags:
  - express
  - polka
  - nodejs
  - http
toc: true
---

## Introduction

Polka is an alternative to Express.js that is more minimal and performant. According to its [github page](https://github.com/lukeed/polka), it's a micro web server that's so fast... it'll make you dance! (I have found myself shaking a tail feather using it 👯).

Essentially, Polka is just a native HTTP server with added support for routing, middleware, and sub-applications. That's it!

It's created by Luke Edwards ([github](https://github.com/lukeed)) who has created a handful of cool, minimal alternatives to some of the bigger, bulkier players.

Polka is up to 50% faster than Express for simple applications, has middleware support (including Express middleware), has a nearly identical application API & route pattern definitions to Express, and is only 120 lines of code (which includes the [Trouter](https://github.com/lukeed/trouter) router).

## Installation

You can install Polka into your project with npm or yarn (remember to run `npm init` or `yarn init` if you’re starting a new project from scratch):

```
npm install --save polka
```

or

```
yarn add polka
```

## Polka Hello World

With that we are ready to create our first Polka Web Server.

Create a `server.js` file in your project root, and add the following code:

```js
const polka = require('polka')

polka()
  .get('/', (req, res) => res.end('Hello World!'))
  .listen(3000, err => {
    if (err) throw err
    console.log(`> Running on localhost:3000`)
  })
```

You can now start the server using by navigating to your project in the terminal and running the following:

```
node server.js
```

Open the browser to `http://localhost:3000` and you should see the **Hello World!** message displayed.

### Hello World - Dissecting The Code

First, we import the polka package and store it in a constant.

```js
const polka = require('polka')
```

Once we have the application object, we can either call polka methods on it or chain polka methods to it. The snippet below is identical to the chaining version above:

```js
polka.get('/', (req, res) => res.end('Hello World!'))

polka.listen(3000, err => {
  if (err) throw err
  console.log(`> Running on localhost:3000`)
})
```

First we define how our application will respond to a GET HTTP method at the `/` endpoint. We call the `get()` method on our polka instance to tell polka to listen for GET requests on the `/` path and then call the handler method provided.

> Every route definition must contain a valid handler function or else an error will be thrown at runtime.

In our _Hello World_ example we pass an anonymous arrow function as our handler:

```
(req, res) => res.end('Hello World!')
```

This simply sends the ‘Hello World!’ string to the client and ends the response using the `Response.end()` method. This method sets that string as the body, and it closes the connection.

> Important: You must always terminate a ServerResponse!

It's a very good practice to always terminate your response (`res.end`) inside a handler, even if you expect a middleware to do it for you. In the event a response is/was not terminated, the server will hang & eventually exit with a TIMEOUT error.

**Note:** This is a native http behavior.

The last line of the example is what actually boots (or creates) the `http.Server`. All arguments are passed to `server.listen` directly with no changes. The current Polka instance is returned directly which allows for chained operations.

We specifially tell it to listen on port **3000**. A callback is passed in that checks for errors and if there are no errors we log a message to the console when the server is ready.

## Routing

At the core of any app are routes. Routes are used to define how an application responds to varying HTTP methods and endpoints - basically what you want to happen when you visit a URL.

A route request in polka looks like this:

```js
app.METHOD(pattern, handler)
```

- `app` is a stored instance of `polka` (you can also use the direct `polka()` reference as we did in the _Hello World_ example)
- `METHOD` is any valid HTTP/1.1 method, lowercased
- `pattern` is a routing pattern string
- `handler` is the function to execute when `pattern` is matched

A single pathname (or pattern) may be reused with multiple METHODs.

If you are familiar with Express, this shouldn't look too different. The polka github page has a great resource of differences from Express in its [Comparisons](https://github.com/lukeed/polka#comparisons) section.

In the _Hello World_ example our route request looked like this:

```js
polka().get('/', (req, res) => { ... })
```

|           |                         |
| --------- | ----------------------- |
| `app`     | : `polka()`             |
| `METHOD`  | : `get()`               |
| `pattern` | : `'\'`                 |
| `handler` | : `(req, res) => {...}` |

### Methods

Polka (by way of Trouter) supports any valid HTTP/1.1 method lowercased! The most common are `GET`, `PATCH`, `POST`, and `PUT` but `HEAD`, `OPTIONS`, `CONNECT`, `DELETE`, and `TRACE` are also valid HTTP/1.1 methods.

### Patterns

Polka uses string comparison to locate route matches. It's faster & more memory efficient but the downside is it prevents complex regex pattern matching. Chances are, you'll only ever use the most common patterns anyway.

The supported routing pattern types are:

- static (`/path1`)
- named parameters (`/path1/:param1`)
- nested parameters (`/path1/:param1/path2/:param2`)
- optional parameters (`/path1/:param1?/path2/:param2?`)
- any match / wildcards (`/path1/*`)

The following complex routing patterns are not supported:

- `'/ab?cd'`
- `'/ab+cd'`
- `'/ab*cd'`
- `'/ab(cd)?e'`
- `/a/`
- `/.*fly$/`

### Parameters

Any named parameters within your route patterns are automatically added to the incoming `req` object under the `params` key as an object with keys with the same name they were given.

> Important: Your parameter names should be unique, as shared names will overwrite each other!

So if the route pattern is `'/users/:id/books/:title'` when you hit the `'/users/123/books/HarryPotter'` endpoint then `req.params` will look like this:

```js
req.params: {
  id: 123,
  title: 'HarryPotter'
}
```

### Handlers

Request handlers accept two parameters - the incoming [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) (the Request) and the formulating [ServerResponse](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse) (the Response). These are often represented in code by `req`(Request) and `res`(Response).

Request is the HTTP request. It contains all the request information - including the request parameters, the headers, the body of the request, and more. Response is the HTTP response object that gets sent to the client.

Every route definition must contain a valid handler function, or else an error will be thrown at runtime.

#### Async Handlers

The native async/await syntax is supported if you are using Node 7.4 or later. You don't have to set up polka any different!

## Middleware

Middleware are functions that hook into the routing process (usually in between receiving the request & executing the route handler's response).

Common use cases for middleware are editing/mutating the request or response objects as well as terminating the request early before it reaches the rest of the route handler code. In addition, mutations in Polka (unlike Express) also have access to `req.params`(the route's named parameters), `req.path`(the URL path without any query string), `req.search`(the full query string), and `req.query`(the query parameters and respective values as an object)!

If you are familiar with (or coming from) Express, all of its middlewares are supported and you can use them alongside Polka with little to no changes at all!

This is how middleware is added to a Polka app:

```js
app.use((req, res, next) => {
  ...
})
```

The middleware signature receives the request (`req`), the response (`res`), and a callback (`next`).

Middleware functions must either call `next()` or terminate the response with `res.end()`. Forgetting to do either of these will result in an infinite response loop which will crash the `http.Server`. If a middleware terminates the response early (regardless of the `statusCode`) then the loop will be exited and the route handler will not run.

### Middleware Sequence

In Polka, middleware functions are organized into tiers. These tiers can be thought of as "global", "filtered", and "route-specific" groups.

#### Global Middlewares

You can define global middlewares in one of two synonymous ways:

```js
polka().use('/', (req, res, next) => {...})
```

or

```js
polka().use((req, res, next) => {...})
```

This tier is always triggered since every request's pathname begins with a `'/'`.

#### Filtered Middlewares

Sub-group or "filtered" middleware run after "global" middleware but before the route-specific handler and are defined by passing in a base pathname that's more specific than `'/'`. For example:

```js
polka().use('/books', (req, res, next) => {...})
```

This middleware will run on any request made to `/books` as well as any `/books/**/*` subpaths.

#### Route-specific Middlewares

Route handlers run last in the chain. They match specific paths and must also match the method action.

### How it differs from Express

Express does not tier middleware. It iterates through the entire application in the sequence that you composed it.

Polka will compose the chain of middleware according to the above tiers and then sequentially iterate through them until one of the following:

- all functions have run
- the response was terminated early
- an error was thrown

### Middleware Errors

If a middleware function throws an error then the loop will be exited and no other middleware will execute nor will the route-specific handler.

There are three ways to "throw" an error from within a middleware function.

> **Note:** middleware functions don't use `throw()`

1. **Pass a string to next()**

   This will exit the loop & send a 500 status code, with your error string as the response body.

   ```js
   polka()
     .use((req, res, next) => next('any string'))
     .get('*', (req, res) => res.end('wont run'))
   ```

2. **Pass an Error to next()**

   This is similar to the above option with the difference being that you can change the `statusCode` to something other than the default of **500**.

   ```js
   function errorThrow(req, res, next) {
     let err = new Error('Error message')
     err.code = 421
     next(err)
   }
   ```

3. **Terminate the response early**

   Once the response has been ended there's no reason to continue the loop!

   This is the most versatile as it allows you to control every aspect of the outgoing `res`.

   ```js
   function terminateEarly(req, res, next) {
     if (true) {
       // something bad happened
       res.writeHead(400, {
         'Content-Type': 'application/json',
         'X-Error-Code': 'Please dont do this In Real App',
       })
       let json = JSON.stringify({ error: 'Error message.' })
       res.end(json)
     } else {
       next() // This is never called in this example.
     }
   }
   ```

## Templating

Currently there is no native support for templating in Polka like there is in Express. There is currently an issue that outlines a possible way to accomplish this - [Using ejs with polka?](https://github.com/lukeed/polka/issues/73).

## Comparisons

Polka's API is _very_ similar to Express' API. So if you already know Express, then Polka is very similar!

There are, however, a few main differences. Below are the comparisons that are highlighted on the [github](https://github.com/lukeed/polka) page:

1. **Polka uses a tiered middleware system.** ([Middleware Sequence](#middleware-sequence))

   Express maintains the sequence of your route & middleware declarations during its runtime which can pose a problem when composing sub-applications. Typically, this forces you to duplicate groups of logic.

2. **Polka doesn't offer any built-in view/rendering engines.** ([Using ejs with polka?](https://github.com/lukeed/polka/issues/73))

   Most templating engines can be incorporated into middleware functions or used directly within a route handler.

3. **Polka doesn't offer the ability to `throw` from within middleware.** ([Middleware Errors](#middleware-errors))

   However, all other forms of middleware-errors are supported.

   ```js
   function middleware(res, res, next) {
     // pass an error message to next()
     next('uh oh')

     // pass an Error to next()
     next(new Error('🙀'))

     // send an early, customized error response
     res.statusCode = 401
     res.end('Who are you?')
   }
   ```

4. **Polka doesn't have a set of Express-like response helpers... yet! ([#14](https://github.com/lukeed/polka/issues/14))**

   Express has a nice set of [response helpers](http://expressjs.com/en/4x/api.html#res.append). While Polka relies on the [native Node.js response methods](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse), it would be very easy/possible to attach a global middleware that contained a similar set of helpers. (_TODO_)

5. **Polka doesn't support `RegExp`-based route patterns.**

   Polka's router uses string comparison to match paths against patterns. It's a lot quicker & more efficient.

   The following routing patterns **are not** supported:

   ```js
   app.get('/ab?cd', _ => {})
   app.get('/ab+cd', _ => {})
   app.get('/ab*cd', _ => {})
   app.get('/ab(cd)?e', _ => {})
   app.get(/a/, _ => {})
   app.get(/.*fly$/, _ => {})
   ```

   The following routing patterns **are** supported:

   ```js
   app.get('/path1', _ => {})
   app.get('/path1/:param1', _ => {})
   app.get('/path1/:param1?', _ => {})
   app.get('/path1/:param1/path2/:param2', _ => {})
   app.get('/path1/*', _ => {})
   ```

6. **Polka instances are not (directly) the request handler.**

   Most packages in the Express ecosystem expect you to pass your `app` directly into the package. This is because `express()` returns a middleware signature directly.

   In the Polka-sphere, this functionality lives in your application's [`handler`](#handlers) instead.

   Here's an example with [`supertest`](https://github.com/visionmedia/supertest), a popular testing utility for Express apps.

   ```js
   const request = require('supertest')
   const send = require('@polka/send-type')

   const express = require('express')()
   const polka = require('polka')()

   express.get('/user', (req, res) => {
     res.status(200).json({ name: 'john' })
   })

   polka.get('/user', (req, res) => {
     send(res, 200, { name: 'john' })
   })

   function isExpected(app) {
     request(app)
       .get('/user')
       .expect('Content-Type', /json/)
       .expect('Content-Length', '15')
       .expect(200)
   }

   // Express: Pass in the entire application directly
   isExpected(express)

   // Polka: Pass in the application `handler` instead
   isExpected(polka.handler)
   ```
