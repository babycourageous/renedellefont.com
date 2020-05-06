---
title: 'MERN stack application using Svelte and Polka, Part 1: the backend'
date: 2020-02-20
featuredimage:
excerpt: In this two-part series we will use MongoDB, Svelte, Polka, and NodeJS to build an app..
category: svelte
alternative:
  - mern
type: tutorial
tags:
  - mongodb
  - mongoose
  - express
  - polka
  - react
  - svelte
  - nodejs
toc: true
draft: true
---

The MERN stack is incredibly popular. The phrase “MERN stack” refers to the following technologies:

- **MongoDB:** [MongoDB](https://www.mongodb.com/) is a document-based database.
- **Express.js:** [Express.js](https://expressjs.com/) is a web application framework for Node.js on the backend.
- **React:** [React](https://reactjs.org/) is a JavaScript library for building user interfaces on the frontend.
- **Node.js:** [Node.js](https://nodejs.org/en/) is an open-source JavaScript run-time environment used to execute JavaScript code outside of a browser.

We will be replacing React and Express with a couple technologies I'm partial to. [Svelte](https://svelte.dev) as a React alternative on the frontend and [Polka](https://github.com/lukeed/polka) as an Express alternative for our backend. Unfortunately the acronym doesn't roll off the tongue as easily: **MPSN**. Yuck, hehe.

We'll make the classic starter project - The Todo app.

**Part 1:** The server-side work. We’ll use Node and Polka to connect with MongoDB. After that, we’ll create some APIs.
**Part 2**: The frontend part. We'll use Svelte to build our front-facing interfaces. After that, we will connect our frontend to our backend.

_Note: I will assume a basic understanding of Node.js and MongoDB. Since Polka is similar to Express a basic understanding of Express will be assumed. I'll try to go into some detail when we encounter Svelte._

## Server setup with Polka

Essentially, Polka is just a native HTTP server with added support for routing, middleware, and sub-applications. That's it! Created by Luke Edwards ([github](https://github.com/lukeed)), Polka is more minimal and performant than Express. And with a little tweaking I can usually accomplish the same tasks at a fraction of the size!

### Initialize a project

We'll put our backend and frontend code in separate folders within the same project folder. Let's call our project **svelte-polka-app**.

Create two folders inside that - **server** and **client**. Inside a terminal `cd` into the **server** folder and run the following command to initialize a Node project:

```bash
$ npm init
```

Now it will ask you some questions about package name, version, entry point, etc. Hit enter if you want to keep the default, otherwise fill in what you like. After that, you will get something like this:

{% figure svelte-polka-app-1-npm-init.png, 'Initializing npm app', 'The default initialization of a package.json.' %}

### Install dependencies

Now it's time to add our dependencies:

```bash
$ npm i polka@next mongoose body-parser bcryptjs config validation
```

- **polka** is our main framework
- **bcryptjs** is the bcrypt password hashing library optimized for javascript
- **body-parser** is a NodeJS body parsing middleware
- **mongoose** is a NodeJS framework for interacting with MongoDB
- **validation** is a declarative way of validating javascript objects
- **config** is an alternative to `dotenv` that will help us use and manage configuration options

```bash
npm i config
```

Now add `nodemon` as a development dependency. `nodemon` is a utility that will watch our app and automatically restart the server whenever we make changes. This way we don't have to manually start and stop it every we monkey around with our code.

```bash
$ npm i nodemon -D
```

Here's the current state of our `package.json`:

{% figure svelte-polka-app-1-npm-package.png, 'Current state of package.json', 'Our current package.json with the installed dependencies.' %}

### Firing up a quick server

We're gonna get a quick polka server going now. Create a file named `server.js` that will be our entry point. Then paste the following code:

`server.js`

```javascript
const polka = require('polka')

const PORT = process.env.PORT || 8082

polka()
  .get('/', (req, res) => res.end('Hello world!'))
  .listen(PORT, () => console.log(`Server running on PORT ${PORT} at http://localhost:${PORT}`))
```

We're simply requiring `polka` and setting a PORT variable (either from our `process.env` or if that doesn't exist we supply `8082` as a default). Then we instantiate `polka` and call the `GET` method for the index route(`'/'`). We boot our server with the `listen()` command telling it the port we defined earlier.

Using `node` to start our server means that if we change anything we need to restart the server manually. Let's get `nodemon` wired up so we don't have to. Let's update our "scripts" section of our `package.json`:

`package.json`

```json
{
  ...
  "scripts": {
    "start": "nodemon server.js"
  },
}
```

We've removed the default **"test"** script and added a **"start"** script that will fire up our server using `nodemon`. To run the script we use `npm start`.

You should see **"Server running on port 8082 at http://localhost:8082"** printed out. If you open a browser and point it to http://localhost:8082 **Hello World** should be printed on the screen.

{% figure svelte-polka-app-1-nodemon.png, 'nodemon output', 'nodemon is watching our files!' %}

## MongoDB Setup

Let's get our database all setup. MongoDB offers up a generous free cloud-based option called MongoDB Atlas. We are going to use that.

### Create a MongoDB Atlas Account

Before we can do anything else we need to set up a MongoDB Atlas account. Create one and follow the procedure. Head to https://www.mongodb.com/cloud/atlas/register to register your account.

{% figure svelte-polka-app-1-mongodb-signup.png, 'MongoDB sign up page', 'Registering an account with MongoDB' %}

Once you've registered you should see a page like this:

{% figure svelte-polka-app-1-mongodb-atlas.png, 'MongoDB Atlas landing', 'The MogoDB Atlas landing page.' %}

### Initializing the Project

Click on the **Project 0** section dropdown (top left) and you will see a green button to create a new project. Create a project, call it svelte-polka-mern and select it.

After that click the green button to build a new cluster.

{% figure svelte-polka-app-1-mongodb-create-cluster.png, 'MongoDB Atlas New Cluster', 'Build a Cluster after creating a Project.' %}

When presented with the choice, select the Free Tier option. There are different providers and regions so choose the one closest to you. The rest of the settings can be left alone (if you want to give your cluster a name there's an option to do that here). Click **Create Cluster** to have the Cluster created and provisioned.

Once that is done it's time to get our connection info. Click **CONNECT** to be presented with the connection screen.

{% figure svelte-polka-app-1-mongodb-connect.png, 'MongoDB Atlas Connect', 'Connecting to the Cluster.' %}

We will first have to configure our security settings. The two things to setup are **IP Whitelist** addresses and a **database user**.

Add your IP by clicking the green **Add your current IP** button. This whitelists your environment to be able to connect.

Then create your MongoDB user below that.

Once those are set up click **Choose A Connection Method**. We'll be connecting using a connection string so select the **Connect Your Application** option to retrieve that. The connection string provided defaults to a database named **test**. If you wish to rename it you can replace **test** in the connection string with a different name. The first time you create a document it will initialize the database with that provided name.

{% figure svelte-polka-app-1-mongodb-connection-method.png, 'MongoDB Atlas Connection Method', 'Choosing the connection method with MongoDB.' %}

Our MongoDB database is ready to go! Now let's add it to the project.

Inside our server folder that we're working on create the following: Create a file called `default.json` inside a folder called `config` to hold some configuration settings. Also a file named `db.js` in the root of the app to hold our MongoDB connection function.

Inside `default.json` store your connection string in a key named `mongoURI`.

`default.json`

```json
{
  "mongoURI": "YOUR_CONNECT_STRING_REPLACE_<password>_WITH_YOUR_DB_PASSWORD"
}
```

Here's the code to connect to MongoDB. We will use using `config` to get our stored variable:

`db.js`

```javascript
const mongoose = require('mongoose')
const config = require('config')

const db = config.get('mongoURI')

async function connectDB() {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('MongoDB is Connected...')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

module.exports = connectDB
```

Update the `server.js` file to use our MongoDB connection function:

`server.js`

```javascript
const polka = require('polka')

const connectDB = require('./db')

const PORT = process.env.PORT || 8082

// Connect Database
connectDB()

polka()
  .get('/', (req, res) => res.end('Hello world!'))
  .listen(PORT, () => console.log(`Server running on PORT ${PORT} at http://localhost:${PORT}`))
```

{% figure svelte-polka-app-1-server-with-db-log.png, 'Logged message with MongoDB', 'Wiring up our server with a MongoDB connection.' %}

So far so good! We have connected our MongoDB database alongside our running Polka server.

## Setting up our Schema with Mongoose

Next we’ll create our MongoDB Todo model and schema with Mongoose. Models are defined using the Schema interface. The Schema maps to a MongoDB collection and defines the shape (fields, validation, default values, etc) of the documents witin that collection.

Inside the backend folder, create a new folder named `models`. Inside that folder create a file called `todo.js`.

`models/todo.js`

```js
const mongoose = require('mongoose')

const Schema = mongoose.Schema

//create schema for todo
const todoSchema = new Schema({
  item: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
})

//create model for todo
module.exports = mongoose.model('Todo', todoSchema)
```

We are importing `mongoose` and then creating the Schema of our Todo giving it two fields, `item` and `completed`. We set completed to `false` by default.

## Setting Up Our API Routes

Routes are used to define how an application responds to HTTP methods and endpoints. We will create our **api** routes at the `api/todos` endpoint of the app.

### Initial route setup

Create a folder named `routes` at the root of the project. Inside that create a file called `todos.js`. This is where we will defing our api routes for todos.

We will install an HTTP response helper for `polka` that detects Content-Types & handles them accordingly (similar to how Express does it) called `send` [(github)](https://github.com/lukeed/polka/tree/next/packages/send).

```bash
npm i @polka/send@next
```

Polka's maintainer recommends defining a custom router file and then importing that where needed to handle routes. This way we can define specific error handling for the app and keep everything centralized.

Create a file called `router.js` in the root of the app and add the following code:

`router.js`

```js
const polka = require('polka')
const send = require('@polka/send')

function onError(err, req, res, next) {
  console.log('onerror')
  if (res.headersSent) {
    console.log('headers already sent')
    return next(err)
  }

  send(res, err.code || 500, {
    message: err.message || 'Unknown Error Occured',
  })
}

function onNoMatch(req, res) {
  console.log('router onNoMatch')
  send(res, 404, { message: 'Could not ... find this route.' })
}

module.exports = function() {
  return polka({ onNoMatch, onError })
}
```

Now let's make some routes!

`routes/api/todo.js`

```js
const send = require('@polka/send')

const router = require('../router')

const routes = router()
  // @route GET api/todos
  // @description Get all todos
  // @access Public
  .get('/', (req, res) => send(res, 200, 'GET all todos'))

  // @route GET api/todos/:id
  // @description Get single todos by id
  // @access Public
  .get('/:id', (req, res) => send(res, 200, 'GET single todo by :id'))

  // @route POST api/todos
  // @description add/save todo
  // @access Public
  .post('/', (req, res) => send(res, 200, 'POST todo'))

  // @route PUT api/todos/:id
  // @description Update todos
  // @access Public
  .put('/:id', (req, res) => send(res, 200, 'PUT todo by :id'))

  // @route DELETE api/todos/:id
  // @description Delete todos by id
  // @access Public
  .delete('/:id', (req, res) => send(res, 200, 'DELETE todo by :id'))

module.exports = routes
```

Create an `index.js` file inside the `routes` folder. While it might not be necessary in this case, in a larger app we might have many more route files so this would serve as a central location to organize all of them.

`routes/index.js`

```js
const router = require('../router')
const todos = require('./todos')

const routes = router().use('/api/todos', todos)

module.exports = routes
```

Now that all our routes have some initial functionality the easiest way to test the HTTP endpoints is with a tool like Postman (https://www.getpostman.com/) or Insomnia (https://insomnia.rest/). I won't go into how to use them. They both have great documentation and are very straightforward to use.

If you open one of them up and test each route (GET '/', GET '/:id', POST '/', PUT '/:id', DELETE '/:id') you should see the respective messages returned.

### Connecting the model to our routes

Another best practice is to put all our route logic inside of `controllers`. We can then call those from our individual route handlers instead of placing all that logic in the route file. This keeps our code clean and organized!

Create a folder called `contrellers` and inside that a file called `todo.js`.

Let's start with our POST request so we can create some test todos:

`controllers/todo.js`

```js
async function createTodo(req, res, next) {
  const { item } = req.body

  const createdTodo = new Todo({
    item,
    completed: false,
  })

  try {
    await createdTodo.save()
    send(res, 201, { todo: createdTodo })
  } catch (e) {
    return next(e)
  }
}
```

Update the `todos.js` routes file as follows:

`routes/todos.js`

```js
const send = require('@polka/send')

const router = require('../router')
const { getTodos } = require('../controllers/todos')

const routes = router()
  // @route POST api/todos
  // @description add/save todo
  // @access Public
  .post('/', createTodo)
```

We simply import our controller and use that as our route handler. The rest can remain the same for now. Easy.

Before we can test the route we need to add our `body-parser` middleware to our pipeline. Since we are receiving JSON in our POST request, this will parse the incoming JSON `body` on the `request` object. A new `body` object containing the parsed data is populated on the `request` object after the middleware.

Update the `server.js` file as follows:

`server.js`

```js
const { json } = require('body-parser')

const router = require('./router')

const connectDB = require('./db')
const routes = require('./routes')

const PORT = process.env.PORT || 8082

// Connect Database
connectDB()

router()
  .use(json())
  .use(routes)
  .get('/', (req, res) => res.end('Hello world!'))
  .listen(PORT, () => console.log(`Server running on PORT ${PORT} at http://localhost:${PORT}`))
```

We can now add some initial todos with Postman by sending a POST request to our `api/todos` endpoint. The JSON `body` should be a single item with the key "item" and the value is the todo text. For example:

```json
{
  "item": "todo item 1"
}
```

It will return the inserted todo with the following shape:

```json
{
  "todo": {
    "completed": false,
    "_id": "UNIQUE MONGODB ID",
    "item": "todo item 1",
    "__v": 0
  }
}
```

Now lets work on updating the GET endpoint for all todos.

`controllers/todos.js`

```js
async function getTodos(req, res, next) {
  let todos
  try {
    todos = await Todo.find()
    send(res, 200, todos)
  } catch (e) {
    return next(e)
  }
}
```

If you test that endpoint, you should see your list of test todos printed out as the return result.

- **cors** is a node.js package for providing a middleware to enable CORS with various options
