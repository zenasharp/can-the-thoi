# Cấn Thế Thôi

A scrolling notebook-paper portfolio: four worlds that made me (childhood cartoons, online games, Vietnamese streets & school, the crypto sea), drawn as paper cut-outs in three.js, looping forever.

**Live:** https://zenasharp.github.io/can-the-thoi/ (deployed to GitHub Pages on every push to `main`, see `.github/workflows/deploy.yml`).

The source art (`raw_art/`: originals, references, moodboard photos) is kept out of the repo; the processed drawings the site uses are in `public/art/`.

## Run

```bash
npm install
npm run dev        # http://localhost:5175
npm run build
```

## How the world is built

See `DESIGN.md`: the ground profile with two grooves, the depth slots, the rides and the shadows, measured from the reference sites.

## Change things

- **Text, scenes, objects, positions:** `src/content/site.js` (one file).
- **Drawings:** `public/art/<scene>/<id>.webp`, listed in `src/content/art-manifest.json`. An item without a drawing shows a coloured placeholder card.

### Art pipeline

1. `node scripts/import_krita.mjs`: copies my Krita drawings (`E:/Krita`, mapping at the top of the script) into `raw_art/`, and splits my bike into frame + wheels (`src/content/bike-rig.json`) so the wheels can turn.
2. `node scripts/gen_art.mjs`: generates the remaining objects (`scripts/art-prompts.json`) with gpt-image through the local `imagegen-lb` skill, using my drawings as the style reference (`scripts/style.txt`). Existing files are skipped.
3. `node scripts/prep_art.mjs`:
   - cuts out the background;
   - flattens the colours;
   - multiplies faint notebook lines into the fills;
   - trims;
   - traces the silhouette (used to extrude each drawing into card);
   - writes the webp files and the manifest.

   Per-file options go in `scripts/prep-overrides.json` (`skip`, `paper`, `cleanup`, `colors`).

## Credits

- Scroll / camera / looping engine adapted from [Mr. Panda's Psychologically Safe Portfolio](https://github.com/andrewwoan/mr-pandas-psychologically-safe-portfolio) by Andrew Woan (MIT). See `src/Experience/Scene.jsx`, `Experience.jsx`, `hooks/useScrollCurve.js`, `layout.js`.
- Font: [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) (SIL Open Font License, `public/fonts/PatrickHand-OFL.txt`).
- Drawings:
  - Mine, made in Krita: the character, Teemo hat, bike, wall, street sign, sun and apple tree.
  - AI-generated in my style: everything else.
- Fan art of characters owned by their creators, made for fun and not for profit: Doraemon, Naruto, Studio Ghibli, Disney, Pixar's Up, Phineas and Ferb (Perry), Oggy, Shaun the Sheep, Mr. Bean, Bakugan, Robo Trái Cây, League of Legends (Riot Games), Gunny, Moly, and internet memes (Pepe, This is fine).
