# Sofra

![Sofra](og-image.png)

A recipe box of home cooking from Turkish, Persian, Italian, Greek and Russian & Ukrainian kitchens, plus a few bakes from further afield. 77 recipes, from soups and meze to mains and desserts.

**Open it:** https://furkanork.github.io/Sofra/

## What it does

- **Browse** by cuisine and course, or search by dish or ingredient ("feta", "saffron", "tvorog").
- **Scale** any recipe with − and +. Every amount recalculates.
- **Swap** an ingredient you don't have and get a substitute with the right amount, such as baking powder for soda or milk and butter for double cream.
- **Tick off** ingredients and steps as you cook, **save** favourites and **copy a shopping list**.
- **Add your own recipes.** They're saved on your device.
- **Works offline** once it has been opened, and installs on your phone's home screen like an app.

## Put it on your phone

**iPhone (Safari)**
1. Open https://furkanork.github.io/Sofra/ in Safari.
2. Tap the Share button, then **Add to Home Screen**.
3. Tap **Add**. Sofra opens full screen from its icon.

**Android (Chrome)**
1. Open https://furkanork.github.io/Sofra/ in Chrome.
2. Tap **Install app** when it's offered, or the ⋮ menu → **Add to Home screen** → **Install**.

Your saved recipes, favourites and own recipes stay in that browser on that phone. They don't sync between devices.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: layout, drawings, filters, scaling and swaps |
| `recipes.js` | All the recipe data |
| `manifest.webmanifest` | App name, colours and icons for installing on a phone |
| `sw.js` | Service worker that keeps the app working offline |
| `icons/` | Home-screen icons and favicon |
| `og-image.png` | Preview image shown when the link is shared |

## Adding a recipe to the collection

Add an entry to `recipes.js`:

```js
{id:'my-dish', name:'My dish', local:'Also called…', origin:'Turkish', course:'mains',
 time:60, active:20, serves:4, unit:'servings', level:'Easy', tint:'#f6cfa2',
 art:{t:'bowl', b:'#ffffff', c:'#d9752e'},
 ing:['#Sauce', [2,'tbsp','olive oil'], [400,'g','chopped tomatoes'], [0,'','salt, to taste']],
 steps:['First step.', 'Second step.'],
 tip:'Optional tip.'},
```

- `course` is one of `soups`, `meze`, `mains`, `pasta`, `bakes` or `desserts`.
- Each ingredient is `[amount, unit, name]`. Use an amount of `0` for "to taste". Units: `g`, `kg`, `ml`, `l`, `tsp`, `tbsp`, or `''` for a count.
- A string starting with `#` is a section heading.
- `art.t` picks the drawing: `slice`, `bowl`, `heap`, `pan`, `flat`, `dumpl`, `skewer`, `veg`, `stack`, `pastry`, `cookie`, `tray`, `dome`, `toast` or `loaf`. Copy the `art` of a similar dish to start.

After changing files, bump `VERSION` in `sw.js` so installed copies pick up the update.

## Run it locally

It's plain static files with no build step. Serve the folder with any static server, for example:

```
npx serve .
```

Then open the address it prints.
