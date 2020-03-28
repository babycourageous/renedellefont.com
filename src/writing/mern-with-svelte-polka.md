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
---

The MERN stack is incredibly popular. The phrase “MERN stack” refers to the following technologies:

- **MongoDB:** [MongoDB](https://www.mongodb.com/) is a document-based database.
- **Express.js:** [Express.js](https://expressjs.com/) is a web application framework for Node.js
- **React:** [React](https://reactjs.org/) is a JavaScript library for building user interfaces.
- **Node.js:** [Node.js](https://nodejs.org/en/) is an open-source JavaScript run-time environment used to execute JavaScript code outside of a browser.

We will be replacing React and Express with a couple technologies I'm partial to. [Svelte](https://svelte.dev) on the frontend and [Polka](https://github.com/lukeed/polka) as an Express alternative.

**Part 1:** The server-side work. We’ll use with Node and Polka to connect with MongoDB. After that, we’ll create some APIs.
**Part 2**: The frontend part. We'll use Svelte to build our front-facing interfaces. After that, we will connect our frontend to our backend.

_Note: I will assume a basic understanding of Node.js and MongoDB. Since Polka is similar to Express a basic understanding of Express will be assumed. I'll try to go into some detail when we encounter Svelte._

## Server setup with Polka

### Initialize a project

We'll put our backend and frontend code in separate folders within the same project folder. Let's call our project **svelte-polka-app**.

Create two folders inside that - **server** and **client**. Inside a terminal `cd` into the **server** folder and run the following command to initialize a Node project:

```bash
$ npm init -y
```

This will assume some sensible defaults for you.

Now it will ask you some questions about package name, version, entry point, etc. Hit enter if you want to keep the default. After that, you will get something like this:

{% figure svelte-polka-app-1-npm-init.png, 'Initializing npm app', 'The default initialization of a package.json.' %}

### Install dependencies

Now it's time to add our dependencies:

```bash
$ npm i polka/@next mongoose body-parser bcryptjs validation
```

- **polka** is our main framework
- **bcryptjs** is the bcrypt password hashing library optimized for javascript
- **body-parser** is a NodeJS body parsing middleware
- **mongoose** is a NodeJS framework for interacting with MongoDB
- **validation** is a declarative way of validating javascript objects

Finally we will add `nodemon` as a development dependency. nodemon is a utility that will watch our app and automatically restart the server whenever we make changes. This way we don't have to manually start and stop it.

```bash
$ npm i -D nodemon
```

Here's the current state of our `package.json`:

{% figure svelte-polka-app-1-npm-package.png, 'Current state of package.json', 'Our current package.json with the installed dependencies.' %}

### Firing up a quick server

We're gonna get a quick polka server going now. Create a file named `server.js` that will server as our entry point. Then paste the code below:

`server.js`

```javascript
const polka = require('polka')

const PORT = process.env.PORT || 8082

polka()
  .get('/', (req, res) => res.end('Hello world!'))
  .listen(PORT, () => console.log(`Server running on PORT ${PORT} at http://localhost:${PORT}`))
```

Run the following command in the terminal:

```bash
$ node server
```

You should see **"Server running on port 8082 at http://localhost:8082"** printed out. If you open a browser and point it to http://localhost:8082 **Hello World** should be printed on the screen.

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

We've removed the default "test" script and added a "start" script that will fire up our server using `nodemon`. To run the script we use `npm start`. The terminal display is a little different now:

{% figure svelte-polka-app-1-nodemon.png, 'nodemon output', 'nodemon is watching our files!' %}

## MongoDB Setup

Let's get our database all setup. MongoDB offers up a generous free cloud-based option called MongoDB Atlas. We are going to use that.

### Create a MongoDB Atlas Account

Before we can do anything else we need to set up a MongoDB Atlas account. Create one and follow the procedure. Head to https://www.mongodb.com/cloud/atlas/register to register your account.

{% figure svelte-polka-app-1-mongodb-signup.png, 'MongoDB sign up page', 'Registering an account with MongoDB' %}

Once you've registered you should see a page like this:

{% figure svelte-polka-app-1-mongodb-atlas.png, 'MongoDB Atlas landing', 'The MogoDB Atlas landing page.' %}

Click on the **Project 0** section dropdown (top left) and you will see a green button to create a new project. Create a project, call it svelte-polka-mern and select it.

{% figure svelte-polka-app-1-mongodb-create-cluster.png, 'MongoDB Atlas New Cluster', 'Build a Cluster after creating a Project.' %}

When presented with the choice, select the Free Tier option. There are different providers and regions so choose the one closest to you. The rest of the settings can be left alone (if you want to give your cluster a name there's an option to do that here). Click **Create Cluster** to have the Cluster created and provisioned.

Once that is done it's time to get our connection info. Click **CONNECT** to be presented with the connection screen.

{% figure svelte-polka-app-1-mongodb-connect.png, 'MongoDB Atlas COnnect', 'Connecting to the Cluster.' %}

First, add your IP by clicking the green button. This whitelists your environment to be able to connect. Then create your MongoDB user below that.

Once those are set up click **Choose A Connection Method**. We'll be connecting using a connection string so select the **Connect Your Application** option to retrieve that.

Our MongoDB database is ready to go! Now let's add it to the project.

Inside our server folder that we're working on create the following: Create a file called `default.json` inside a folder called `config` to hold some configuration settings. Also a file named `db.js` in the root of the app to hold our MongoDB connection function.

Inside `default.json` store your connection string in a key named `mongoURI`.

`default.json`

```json
{
  "mongoURI": "YOUR_CONNECT_STRING_REPLACE_<password>_WITH_YOUR_DB_PASSWORD"
}
```

Before we create our database connection code, we are going to install the `config` package as a dependency. This will help us use and manage our configuration options.

```bash
npm i config
```

Here's the code to connect to MongoDB:

`db.js`

```javascript
const mongoose = require('mongoose')
const config = require('config')

const db = config.get('mongoURI')

const connectDB = async () => {
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

Update our `server.js` file to connect to the MongoDB:

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

## Setting Up Our API Routes
