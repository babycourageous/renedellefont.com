---
title: 'Animated Drop Down Menu Using Svelte'
date: 2020-04-17
featuredimage: ''
excerpt: 'A tutorial on making an animated drop down menu component using Svelte'
category: svelte
alternative: react
type: tutorial
tags:
  - svelte
  - css
  - animation
toc: true
draft: true
---

## Initial Set Up

### npx degit Svelte

The first thing we need is a Svelte app

main.js is entry point and App.svelte is our initial app.
Remove boilerplate from App.svelte

### Define CSS Theme

Tailwind ?

global variables ?
Override some defaults

## Building The Top Navbar

We will use component composition to create small reusiable components that we will compose into our larger app

### Navbar

Stub our skeleton
nav>ul
add styles

Let's take a look at what we have so far

> > Figure

Nothing too impressive yet. Just a bar at the top of the screen. Let's add some items to that now.

### Adding Nav Items

Use slot to add our items - children of the NavBar.
Use props to pass icon to NavItem
Props allow data to be passed from the parent to the child.
Pass in some emoji placeholders and update CSS to see how things look
NavItem is slightly smaller than NavBar - use calc
Flexbox to center the elements inside NavIcon
Scope new css variable to NavItem to calculate the icon size to be half the NavBar
Again use Flexbox to align the icon elements to center

> > FIGURE

### Nav Item Bells and Whistles

Add transitions to hover state to transition colors on hover
Replace emojis with SVG icons
style svg width and height

> > FIGURE

## The Dropdown

Now we see why the svg icons aren't direct children of NavItems. It's so that some of the NavItems can contain a drop down menu.

### Adding State to NavItem

in svelte state is just a variable declared in our script tag. We can then use and manipulate it when we interact wiht the drop down. We'll add state to our NavItem to control whether the drop down is open or closed

let isOpen = false
handleClick
on:click on a tag

Show dropdown when isOpen is true
{#if} wrapped slot

### DropDown Component

Create component
Add as child of NavItem
Pass props

### Style DropDown

overflow:hidden to hide other children menus that may overlap
menuitem styles

> > FIGURE

SO far it's single level. Let's kick it up!

## Taking the DropDown to the Next Level

We'll turn this plain old single level drop down menu into a bad ass multi level animated drop down. We'll get some help from Svelte's animation/tween/transition ? directives

This will handle the logic to animate our menus in and out when they are added or removed from the DOM

### Add State to DropDown

Which menu is currently visible?

let activeMenu = 'main'

### Add Svelte Transitions

### Activating DropDown from NavItem

### Adding multiple drop down children

### Animating height

- add menuHeight state (DD)
- calculate height with offset height
