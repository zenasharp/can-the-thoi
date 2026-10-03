# Design notes: what makes the reference sites work

These notes come from rendering both reference sites from their own camera paths and measuring their geometry.

## Mr. Panda (andrewwoan/mr-pandas-psychologically-safe-portfolio)

**Ground cross-section** (three.js units; wall at z = -2.75, ground 4 units deep):

```
 wall  back strip     groove A       front strip              lip
  |   z -2.75..-1.61  -1.61..-1.18   -1.18..0.61               0.61..1.26
  |________________   ____________________________________
  |  top y = 0.6   | |  stick slot |  top y = 0.6            \  (bevel down to y -1)
  |                | |  floor -0.17|                          \
```

- **Groove A:** every vehicle and the panda ride on a wooden stick that slides in this slot (z ≈ -1.4).
- **Steps:** scenes sit at different heights (0.6, then 2.18), so the boundaries show paper step faces.
- **Water:** the sea is three wave strips (-1.46) that step up in height; the ship sails between them.

**Depth layers:**
- **On the wall (z -2.75):** handwritten text, a sticky-note header ("ABOUT ME"), clouds, sun, a dragon in the sky.
- **Back strip (z -2.3):** the landmark set pieces (tree, waterfall, temple, torii, pyramid, haunted house), plus small props such as lanterns and urns.
- **Groove A (z -1.4):** the panda and its scene's vehicle: bike, then ship, then camel, then skull. Each vehicle travels across its own scene as you scroll. Wheels spin and legs swing.
- **Front strip (z -0.2..-0.8):** small things (grass, flowers) that frame the stage.

**Everything casts a soft shadow** (Cycles bake) on the wall and the ground, offset down-right from a top-left light. That shadow is what turns flat drawings into a diorama.

**Each scene tells one beat** and hands over to the next:
- **Temple:** arrive and say hello.
- **Torii gate:** the gate at the shore. You board the ship.
- **Sea:** the island with treasure.
- **Desert:** "work experience".
- **Haunted house:** "contact me".

**Camera:**
- **Opening:** close up and low (z 5, about 1.2 above the ground), looking straight at the intro.
- **Zoom-out:** pulls back over the first ~8 units.
- **Settled view:** about 4.2 above the ground, about 11.7 from the wall, fov 35, tilted down about 0.2 rad. The wall fills the top two-thirds of the frame, the stage the bottom third, and the frame bottom lands on the front lip.

## Aimee's Papercraft World

- **A cylinder world**, one season per quarter. The camera stands inside the ring and looks outward.
- **The ground is 3 to 4 rolling hill strips** with wavy front edges, each strip a step higher towards the wall. Props are tagged by the strip they stand on (L1..L4). The character moves on its own track.
- **Thick paper:** extruded card with visible edges. Coloured construction paper, ambient-occlusion shadows.
- **Wall text is handwritten straight on the paper**, under a small tag header ("About Me", "My Work").
- **Each season's character costume has its own vehicle:** bicycle in spring, a wave in summer, a crane in autumn.

## What changes in Cấn Thế Thôi

1. **Ground:** the Mr. Panda profile with **two grooves**:
   - groove A for me and my vehicle;
   - groove B for the "traffic" of each world (soot sprites, lane minions, Honda Cubs, the bear market).
   - Strips have their own colour per scene. The street scene has a sidewalk, a road and another sidewalk.
2. **Five depth slots per scene:** wall, back strip (landmarks), groove A (me), mid strip (characters), groove B (traffic), front strip (framing).
3. **Real-time soft shadows** from one top-left light, received by the wall, the ground and the cut-outs.
4. **Cut-outs are extruded card:** the silhouette is traced from the drawing's alpha, with a visible paper edge. Sticks stand in the grooves.
5. **A vehicle per life stage:**
   - Catbus in childhood;
   - Skaarl in the games scene (Teemo hat);
   - my bike in the street scene (the wheels spin);
   - the bull market in the adult scene;
   - a rocket "to the moon" for the loop back.
6. **Story beats and hand-overs:**
   - Doraemon's Anywhere Door leads into the Rift.
   - The Moly mole digs through to the Vietnamese street.
   - The school gate is graduation, into adult life.
   - The rocket goes to the moon and through the clouds back to the start.
7. **Wall content:** handwriting written straight on the paper, instead of floating note cards. The sticky-note headers at the start of each world were taken out too (`wall.sticky` is still supported).

## Gates (src/Experience/components/Structures.jsx)

They follow Mr. Panda's torii. The gate is **not** a solid 3D object: it is a set of thin hand-cut cards.
- **The cards:** each has wobbly edges, an ink outline drawn on a canvas, a flat fill, and notebook rules.
- **Placement:** the cards stand in one plane across groove A, turned 61° from the wall, so the opening faces along the lane.
- **Layering:** cards are offset by a few millimetres in depth (lintel and caps in front, sign posts behind).
- **Grille:** the school gate's grille is one card with the gaps cut out, so it casts a grille-shaped shadow.
- **Opening:** the leaves swing open with gsap when I come within 3.4 units, then lie parallel to the wall.

The two gates:
- **Anywhere Door:** end of the childhood scene.
- **School gate:** end of the street scene. Graduation.

## Paper

- **Wall:** one continuous sheet of Vietnamese ô ly school-notebook paper (Hồng Hà style, `gridPaper()` in `textures.js`). It has a fine light-blue grid with a purple-blue line every 4 squares, and a red margin line at the start of every scene (page).
- **Grid alignment:** the grid tile (`GRID_TILE` in `layout.js`) divides the loop shift exactly, so the grid stays aligned across the loop.
- **Ground strips:** the same paper, tinted per scene with weaker lines.

## Camera (layout.js `CAMERA`)

It follows the reference:
- **Opening:** a close-up of the hello note and me (1.55 above the ground, 8.4 from the wall).
- **Zoom-out:** eased with smoothstep over the first 8 units.
- **Settled view:** 4.5 above the ground, ~13.5 from the wall, tilt -0.2, with a ±0.6 in/out breathing.

## Childhood scene (v2, 36 units wide, three pages)

Kept from v1: Anywhere Door, Totoro, grass. Everything else was redrawn after `Moodboard/child1.excalidraw.md`.

Left to right:
1. **The welcome handwriting on the wall.** I ride in on **Doraemon's time machine**. I wear the bamboo-copter and the Naruto Leaf headband. The copter blades are cut off the costume (`scripts/split_copter.mjs`, `src/content/copter.json`) and turn on the stick with my travel, not on their own (`CopterBlades` in `Hero.jsx`, driven by the distance ridden, like the bike wheels).
   - **The family TV** (`CrtTv` in `Events.jsx`): the Panasonic TX-21FG50T at a three-quarter angle, standing on the back strip (0.95 tall). It is a rig in `draw_rigs.mjs` (`crt_tv`), drawn after the user's photos.
     - The front is designed flat, then narrowed as if turned: a silver front with a dotted speaker grille down each side, a wide black bezel round the flat screen, the white logo, the square power button, the flip-down panel with its buttons and yellow / white / red AV jacks, and the curved base.
     - Behind it the dark grey back goes straight back to the right (kept short). Its top curves down to the back.
     - Its side has the big S-shaped chamfer of the real set: the underside runs along the ground just behind the front, then sweeps up to the narrower tube, with a lighter bevel band along both curves.
     - Under the cut-away, a darker recessed stand carries the back, so the whole TV sits flat on the ground. It has handle recesses and vent slits.
     - The screen shows snow as a flip-book of four scribbled static frames (hand-drawn dashes in white and greys, faint scan lines, a brighter roll band), about 10 a second. They are drawn through the same slant on the same canvas, so they fit the screen exactly.
2. **Robo Trái Cây tree.**
   - The robot fruits hang on threads and swing (`hang` + `anim: "dangle"` in `site.js`).
   - The apple is my own Krita drawing (`E:/Krita/robo fruity apple.kra`). The strawberry, orange, grape, pineapple and peach were generated from it.
3. **Totoro at the bus stop**, a rig of separate paper parts (`TotoroRig` in `Events.jsx`).
   - Parts: body, two ears, eyes, free arm, leaf-umbrella arm, bus stop.
   - Idle: he breathes, flicks one ear at a time, blinks, sways the leaf and wiggles the free arm.
   - When I ride up, he hops twice and lifts the leaf.
4. **The house from Up**, 4.7 tall, with **Shaun** and baby **Timmy** in the front row below it watching it go, lifting off as I ride past (`anim: "rise"`: up to 1.5 units over ±8 units of travel). It was redrawn after the film: yellow scalloped gable, lime bay window, peach porch, blue side, brick chimney, and a huge cluster of balloons.
5. **Probe**, a rig (`ProbeBakugan` in `Events.jsx`).
   - Parts: two claw arms, saucer body, dome with eyes and teeth, lid with antenna.
   - Idle: it hovers, swings its claws, chatters its teeth in bursts and wobbles its antenna.
   - When I come within 10 units, the lid flips open on its hinge. A "BAKUGAN BRAWL!" title in bubble letters flashes up for about half a second.
   - A Bakugan ball shoots up out of the dome and spins.
   - A POW burst appears and the ball turns into **Drago** (`DragoFlap`). He keeps the AI drawing the artist chose and is animated by bending its mesh: a finely subdivided plane whose wing vertices turn around each wing root by an amount that grows towards the tip. The wings flap with no seams, and the tail and head sway the same way. The head is excluded from the wing weights and sits slightly in front, so a flapping wing never covers it.
   - It reverses if I scroll back.
6. **Oggy's house.**
7. **Perry** (`PerryAgent`).
   - He is a plain pet on four legs until I am 6.5 units away.
   - Then he hops, flips like a paper puppet and lands as Agent P in his fedora.
   - Both Perry drawings are hand-coded SVG (`scripts/draw_doodles.mjs`), because the image model refuses to draw him.
   - Agent P stands in a karate stance: fedora tipped low, narrowed eyes, chopping hand forward, fist cocked back.
8. **Phineas & Ferb's house.** Their rocket is parked behind it (`PFRocket`).
   - The brothers ride on the outside, dressed as in the show (`scripts/doodles_pf_shaun.mjs`).
   - Phineas is on the left booster, waving: orange shirt with pale-yellow stripes, blue shorts.
   - Ferb is on the right booster, thumb up: pale-yellow short-sleeve shirt with a white collar, under high-waisted purple trousers with belt loops and cuffs that show his ankles.
   - The exhaust is a flip-book of four hand-drawn flame frames (`rocket_flame_1..4`), not a rig.
   - When I come within 7 units it shakes, fires and puffs smoke. Then it climbs, loops the loop over the house with its nose following the path (`rocketPath` in `Events.jsx`), and finally blasts off out of the sky.
   - It comes back down if I scroll back.
9. **The Anywhere Door**, with **Mr. Bean's Teddy** (SVG, after the cartoon) small, slumped with his back against the door's near post.

Flowers line the mid strip and the front strip: tulips and the daisy (wide petals; the lower-left petal is missing, after PEACEMINUSONE, `draw_doodles.mjs`). Daisies are never mirrored, so the gap always stays lower-left.

Clouds are a floating layer (`z: "sky"`, 0.5 in front of the wall), so they cast a soft shadow on the paper behind them.

The time machine is mirrored (`vehicleFlip`), so the seat is at the back and the lamp leads the way.

Every cut-out gets a tiny depth offset derived from its x position, so two cards in the same slot never z-fight. This was the Perry glitch: a flower bunch was flickering through him.

The seam is now 17 units wide, and the loop triggers are computed from geometry (`TRIGGERS` in `layout.js`). This keeps the world jump out of view however long the world gets. Scroll speed is normalised to the world length.

## Games scene (v2, 30 units wide, two and a half pages)

Kept from v1: only the bushes, now bigger (front and back strips). Everything else was redone after `Moodboard/Game .excalidraw.md`. Groove B is the river.

I ride **Skaarl** (Kled's lizard), wearing Teemo's hat and holding up the **Infinity Edge**.
- **Skaarl** is an AI drawing in strict side view, after the official art and the 3D model the user sent (Baohao Yap): big frog-like head with a huge toothy grin, one bulging yellow eye, a bat-ear frill, teal fins along the back, orange body, dark maroon legs, saddle.
  - An earlier hand-drawn SVG Skaarl was rejected as unrecognisable.
- **How it runs:** `scripts/split_rig.mjs` cuts the two hind legs and the frill off the drawing.
  - `RigVehicle` in `Hero.jsx` (a ride with `vehicleRig`) scissors the legs at the hips, swapping them once per stride, and lifts the leg that swings forward. Ride motion `run` bobs the body at every footfall.
  - The gait advances by `stride` (10.5) per unit of distance. That value is worked out from the leg length and swing, so the foot on the ground moves back exactly as fast as the ground goes by, with no skating.
  - My seat comes from the rig's `seat` point.
  - **Dust:** the puffs are scribbled SVG (`hero/dust_1..3`, and `hero/foam_1..3` for the sea spray behind my surfboard). A ride with `dust` (Skaarl) kicks up a light dust puff at every footfall (`DustTrail` in `Hero.jsx`). Each puff is left behind where it was kicked up, then drifts back and up as it swells and fades.
- **The sword** is a held prop (`ride.props`, `HeldProp` in `Hero.jsx`). Its grip point sits on my hand and it turns about that point.

Left to right:
1. **The handwriting on the wall.** Poros bob on the road and in the front row.
2. **Minions vs. turret** (`MinionTurret` in `GameEvents.jsx`), on the back strip.
   - Four blue caster minions walk up to their spots and keep throwing blue bolts at a red turret, which shakes when hit.
   - The turret fires a red bolt every second at the minion in front. After three hits that minion falls over and comes back in with the next wave. Each minion has a little health bar.
   - The health bars and the bolts are scribbled SVG (`doodles_games.mjs`): a dark wobbly frame with a blue fill that shrinks from its left end; star-shaped blue or red bolts with a streak, flickering between two frames and pointing the way they fly.
3. **The Elder Dragon** (`ElderDragon`) glides to and fro high over the Rift and turns round like a paper puppet at each end.
   - Its two wings are separate parts, cut off the AI drawing by `scripts/split_rig.mjs`, and they beat around their roots.
   - The far wing keeps a bit of body around its root, behind the body. The body keeps a bit of wing under the near wing. So a flap never opens a gap.
4. **Moly** (`MolyWave`) sits in the front row with his legs out and waves hello, harder as I come by.
   - He is an AI drawing after the official mascot (no buck teeth).
   - His raised arm is cut off by `split_rig.mjs` along the drawing's own outlines (head, scarf) and drawn behind the body. Its root stays tucked under the scarf when it turns, so there is no ghost underlay.
5. **The Gunny chick** (`GunnyTree`) stands on the branch of a tree (SVG rig with a `perch` point).
   - It keeps lobbing its **lu gạch** down at a Rift Scuttler in the river below, aimed where the crab will be when the jar lands.
   - The lu gạch is SVG, after the in-game icon: a dark olive sack with a red brick belly, a cream braided rope with a hanging knot and tassel, and an orange heart brick and a brown brick on top.
   - On a hit: POW, the crab is squashed flat, then it hops.
6. **Blitzcrank** (`BlitzHook`), hiding in a bush near the end. He is a rig: far arm, body with the lightning core, head, near arm, and a fist that comes off.
   - **Timing:** he is fast, because people scroll fast. He goes when I am still 5.5 units away, and the whole sequence takes under 2 seconds.
   - **Sequence:**
     1. He jumps out.
     2. **Rocket Grab:** the fist flies at me on a chain of paper links.
     3. He hooks me off Skaarl and yanks me over to his side.
     4. He turns and Power Fists me (POW).
     5. I spin through the air in two flips into the Vietnamese street and crash into the ground.
     6. I pop back up out of it riding my bike, now in my school jacket with the red scarf (`hero/hero_street`, AI-traced from my base chibi and a photo of the real jacket).
        - The jacket: the white upper part covers the chest, shoulders and upper sleeves. A blue-and-white double stripe makes a V across the chest and sleeves. The lower body and lower sleeves are royal blue, with a badge on the sleeve.
        - On the bike I sit in front of the frame.
   - **Underground:** `heroState.sink` pushes me and my ride below the ground (`SINK_DEPTH` in `Hero.jsx`). It is set as I am launched, so the bike waits underground. It is tweened back to 0 with an overshoot for the pop-up.
   - **Skaarl** is scared stiff: it jumps, turns round and runs back the way we came. While that happens my ride is hidden (`heroState.hideRide`) and BlitzHook draws a copy of Skaarl (`VehicleOnly`).
   - **The fist** goes back on his arm after the punch, so the chain never follows me into the next world.
   - **The camera follows me.** `scrollPilot.js` takes the scroll for the moment: a gsap tween of the scroll target, with wheel, drag, touch and keys ignored. It first runs up to Blitz, then on to just inside the next world.
   - **My rider while I fly:** it is hidden (`heroState.rider.hidden`), and BlitzHook draws a copy of me (`RiderCard`) flying from the punch to my live seat (`heroState.rider.rest`), whatever I ride by then.
   - **Going back:** if I scroll back past him, he ducks into the bush again and I am back on Skaarl.

**Teemo mushrooms** (`TeemoShroom`, 0.8 tall) stand along the edge of my lane.
- When I run into one, it squashes and pops, and I jump (`heroState.jolt`).
- A poison cloud billows up high while smaller puffs burst out in a fan.
- It all comes from one progress value, so nothing shows before it goes off. It grows back if I go back.

**A Rift Scuttler** also scuttles along the first part of the river. It is traffic with `noTurn` (sideways both ways, no turning round) and `range` (part of the groove only).

Art:
- **AI drawings, with the reference images attached** (`gen_art.mjs`, `subjectRef` or a full `prompt`): Skaarl, Moly, Infinity Edge, Scuttler, turret, Elder Dragon, Poro and the Gunny chick.
- **Hand-coded SVG:**
  - `scripts/doodles_games.mjs`: the mushroom, the poison cloud, the minion and the lu gạch.
  - `draw_rigs.mjs`: Blitzcrank and the tree.
- **Fixes:**
  - The AI left a grey smudge on the Poro's fur, which was painted out.
  - The chick's white eyes were keyed out with the background. They are refilled with `fillHoles: "#FFFFFF"`, a forced fill colour that is new in `prep_art.mjs`.
- **Cutting an AI drawing into rig parts:** `scripts/split_rig.mjs` cuts along hand-placed polygons from the processed card, so every part keeps the same colours and paper texture. The parts are prepped with `flatten` and `paper` off.

## Street scene (v2, 30 units wide, two and a half pages)

Kept from v1: the yellow wall, the sun, the apple tree, the street-name sign, the piggy bank, the red plastic stools, the Honda Cub and the school gate. The gate moved to the end of the street. The moodboard (`Moodboard/Street.excalidraw.md`) is the Suzuki Viva.

Left to right:
1. **The handwriting on the wall.** I land here on my bike from the games world.
2. **A row of tube houses (nhà ống)**, shoulder to shoulder: TẠP HOÁ, PHỞ, CẮT TÓC and SỬA XE. They are AI drawings in flat front elevation, with the shop signs lettered by the model.
   - A **Suzuki Viva** is parked outside the repair shop.
   - The **bánh mì cart** stands on the pavement in front.
3. **Trà đá** on red stools in the front row, with a **điếu cày** (bamboo water pipe, SVG) leaning on them. Then the apple tree and the street-name sign.
4. **The yellow wall plastered with ads**, under the sun. The ads are SVG slips (`doodles_street.mjs`): "KHOAN CẮT BÊ TÔNG", "CHO THUÊ PHÒNG", "DẠY KÈM TOÁN LÝ HOÁ", with fake phone numbers.
5. **Bia vỉa hè** (`BeerTable` in `StreetEvents.jsx`): a low blue plastic table with red and blue stools, peanuts, an ice bucket, beer bottles and a beer crate (AI drawing).
   - The drawing is seen a little from above. It stands at the very front of the pavement (1.05 tall), so only the tops of the bottles reach a little over the road behind it. At the back of the pavement its back stools seemed to float over the road.
   - Three glasses of bia hơi stand on its front edge. They are SVG, so they can move.
   - As I ride past, they lift, swing in and clink twice with a "DZÔ!" and a splash of foam, then settle back on the table. It plays again every time I come by.
6. Two more houses near the school: **CÀ PHÊ** and the **PHOTO** copy shop.
7. **The school gate** opens and hands me over to adult life.

**Power lines** (`PowerLines` in `StreetEvents.jsx`):
- **Poles:** an SVG rig (`power_pole`, and `power_pole_loa` with the ward loudspeakers): concrete post, crossarms with insulators (the `wires` points), a transformer, a coil of spare cable and ad slips.
- **Wires:** between every pair of poles, one sagging wire per insulator plus two stray ones crossing over, the famous tangle. Drop wires run back to the houses. They are thin ink ribbons, and they cast shadows on the wall.
- **Sparrows** (SVG, sitting and flapping frames) sit on one span and fly off in a flip-book flutter as I come by. They come back if I go back.
- **The loa phường** keeps sending ♪ ♫ notes floating out of its two horns.

**Traffic:** two Suzuki Vivas (AI, after the moodboard photos) and the Honda Cub. The Suzukis toot a "BÍP BÍP!" (`honk`).
- **Depth:** every mover in a groove gets its own depth (`dz`, 0.08 apart). Two motorbikes passing each other used to share one depth and z-fight (flicker).

The Blitz cinematic now skips itself if I am already well past him (a jump, not a scroll). He just stands there.

## Crypto sea (v2, 54 units wide, four and a half pages: the high, the dark, and the way up)

It was widened from 36 so that each set piece has room of its own.

The last world is a sea. It replaces the old adult scene; only the handwriting on the wall is kept. The BoldLeonidas moodboard (`Moodboard/Crypto.md`) was used for the mood only.

**The sea itself** (`SeaWaves` in `CryptoEvents.jsx`):
- Five rows of wave tiles at different depths, from the horizon to the front of the stage. Each row rocks side to side and bobs, like the wave flats of a toy theatre.
- **The tiles** (SVG in `doodles_crypto.mjs`, four colours with three variants each, mixed pseudo-randomly):
  - two scribbled waves per tile;
  - the crest is a shaky hand line (finely sampled, with a slow random wander), traced twice as a bold pass and a thin offset pass;
  - a little hooked curl under each lip, a lighter band under the crest, pencil hatching and a few ripples. No foam: it looked silly.
- **Seamless rows:**
  - Tiles start and end flat in a trough at the same height.
  - The jitter fades out at both ends, and the tiles skip the wobble filter (`wobble: false`), since it would shift the edges.
  - They are prepped as tiles (override `tile: true`: no trim, no pad) and drawn as flat planes edge to edge, so there is no seam.
- Past a given x each row switches to the dark tiles, so the sea darkens as the story does.

**I surf** (ride `motion: "surf"`) on a WAGMI surfboard (SVG), leaving white sea spray behind me (`dust: "foam"`).
- I wear my white and teal windbreaker here (`hero/hero_adult`). It was AI-traced from my base chibi, a photo of the real jacket and the old costume's headphones: a white jacket, one teal chevron across the chest, teal collar, cuffs and waistband.
- No guitar and no red scarf any more.

Left to right:
1. **The high.** The pump.fun pill floating (SVG: just the green and white capsule, no face, hat or limbs), a NOT FINANCIAL ADVICE buoy, and white clouds.
2. **The whale** (`WhaleSpout`, AI) surfaces as I come by and spouts a fountain of spinning ₿ coins.
   - **The cabal** (`CabalBoat`, AI): a black speedboat of hooded insiders with glowing eyes, a laptop and a pile of coins. As I come by they whisper "psst... we're early." and speed off over the horizon with a wake. They're back if I go back.
3. **Manipulation** (`PuppetMaster`): a giant hand in a suit sleeve (AI) works five green candles on strings like a marionette.
   - As I come by, it yanks them up: **PUMP!**
   - Then the strings snap, the candles turn red and drop into the sea: **DUMP**.
4. **The rug pull** (`Anglerfish`, AI): its glowing lure carries a "100x GEM" sign. Come close and it lunges and snaps: **RUG PULL!**
5. **The hangover:**
   - the NFT ape in its gold frame (-99%) sinks as I pass (`anim: "rise"` with a negative rise);
   - *This is fine* in a burning boat (`ThisIsFine`, wobbled at prep with `wobble: 4` so it is scribblier). It is one bent mesh, like Drago: cut parts tore apart at their edges when they moved.
     - Region weights (flames, dog, bubble) are painted on a fine vertex grid and blurred, so the regions fade into each other.
     - The flames lick up and sway, most at their tips and not at all at the gunwale. The dog tilts back to sip his coffee every few seconds. The bubble puffs about its tail as he talks. The boat rocks.
   - the sad frog in a life ring (`SadPepe`): AI-redrawn with no tears and no phone, hands resting on the ring. It is cut into head and body (`split_rig.mjs`); he bobs and his head heaves with sobs.
6. **The dark half:**
   - storm clouds (`StormCloud`) drift and swell over a darkening sea. Rain keeps falling from them (some of it red), and lightning flickers out of them every few seconds (no glow). Shark fins circle (traffic);
   - the **liquidation whirlpool** (`Whirlpool`) leans towards the camera on the back strip and swallows red candles. Laid flat, it hid behind the waves;
   - a red "-87%" on the wall and a WAGMI? buoy. The dark handwriting on the wall was taken out; the thoughts only circle the tangle now.
7. **The tangle of thoughts** (`ThoughtTangle`): from x 16 a scribbled knot hangs over my head and follows me.
   - It is a flip-book of four SVG scribbles with no background (`thought_tangle_1..4`). They are drawn with `{ transparent: true }` in `draw_doodles.mjs`, so the gaps inside the loops stay see-through. It flips faster as the knot grows.
   - It grows heavier and trembles, with more and more thoughts circling it: "sell?", "rekt", "can't sleep", "ngmi"...
   - At x 32.4 it bursts in a white flash into black feathers that drift down, and sunbeams unroll from above the clouds ("...let it go.").
8. **The One Winged Angel:** my black wing (AI, after the user's reference) unfolds on my back as it grows (`ride.wing.grow`, x 32.6 to 34.8) and lifts me off the board (`wing.lift`).
   - The seam ride is now me on my own wing (`vehicle: null`, `motion: "fly"`, a stronger and faster flap), flying up through the sky and back to the start. It used to be the rocket.
   - **In the sky** (`seam.structures`, rendered by `Scene.jsx`):
     - the **Dharma wheel** of the Noble Eightfold Path (`DharmaWheel`, SVG after the classic emblem): eight knobbed handles, eight spokes with diamonds, a three-swirl hub. It turns slowly high above my path, like a halo as I rise beneath it;
     - the **dove of peace** with its red spiral ribbon (`Dove`, AI, traced from the three reference poses: wings up, level, down). It is a flip-book of those wingbeats and flies beside me, a little ahead and above my head.
       - It comes out from behind a little cloud as I enter the sky, growing as if flying in from far away. Near the top it flies off into another little cloud, well clear of the wheel, shrinking away into it.
       - It brings its own two small clouds and flies just behind their layer (both are behind me).
       - Its path is worked out from my position, so scrolling back plays it backwards.
   - `Wing` in `Hero.jsx` places the wing's root on my back, behind me, and beats it around that root.

## Rigs (`scripts/draw_rigs.mjs`)

- **What it builds:** Totoro, Probe, Blitzcrank and the Gunny tree are hand-coded SVG, one shape per part, on a shared canvas per rig.
- **What it writes:** each part becomes `raw_art/<group>/<rig>_<part>.png` (group `childhood` unless the rig sets `group`). The part boxes, joint pivots, the rig anchor and named points (`seat`, `perch`, `socket`, `hole`) go to `src/content/rigs.json`. `offset` shifts a drawing on its canvas.
- **How the site uses it:** `rigPart()` in `Events.jsx` places each part card around its pivot, so rotating the part group turns it at the joint (shoulder, hinge, wing root).
- **Editing:** change a shape, then run `node scripts/draw_rigs.mjs` and `npm run prep:art`.

## Blender export (`npm run export:blender`)

The world can be opened in Blender as a frozen snapshot, for viewing, rearranging or rendering stills. With the dev server running:
1. `scripts/export_blender.mjs` loads the site in headless Chrome and calls `window.__exportGLB({ download: false })` (`src/Experience/devExport.js`, dev only), which runs three.js's GLTFExporter on the whole scene. `window.__exportGLB()` in the browser console downloads the same file.
2. It saves `blender/can-the-thoi.glb` and `blender/scenes.json` (where each world is).
3. It runs Blender 5.1 (`E:/Program/blender.exe`, override with the `BLENDER` env var) on `scripts/blender_import.py`, which builds `blender/can-the-thoi.blend` and renders previews into `blender/preview/` (`--no-preview` skips them).

What the .blend has:
- Every card exactly as on the site: its traced silhouette extruded, the drawing on both faces, bare paper on the sides. Meshes are named after their drawing (`childhood/totoro_body`, `street/house_a`...).
- The ground, the wall, the wall writing, wires, waves and the hero on the first ride.
- Everything is parented to the `CanTheThoi_world` empty. The images are packed into the file.
- The **Standard** view transform: the cards are unlit, so colours look as drawn.
- A paper-coloured world, plus cameras: `Cam_site_view` (the site's zoomed-out view at the start) and one front orthographic camera per world (`Cam_childhood`, `Cam_games`, `Cam_street`, `Cam_adult`).

What it doesn't have:
- Any animation: it is all code driven by the scroll and the hero's position.
- The shadow-catcher overlays and the lights.
- Anything hidden at rest: flip-book frames that aren't showing, and set pieces not yet triggered (Drago, Agent P, Blitzcrank, the dove, the tangle...).
- The sky seam sits before the childhood world, where it waits at the start of a loop.

## Speech bubbles

My speech bubble (`src/components/ScribbleBubble.jsx`) is drawn like everything else:
- a lumpy hand-drawn outline (a jittered rounded box with a tail), traced twice with two different jitters so it looks sketched;
- wobbled by an SVG displacement filter, slightly tilted, and fitted to the text once it has been laid out;
- it pops in with an overshoot.

## Keeping it scribbly

Every drawing must stay scribbly and still be recognisable.
- **Hand-coded SVG:** Perry, the daisy, the clouds and the rigs go through `scripts/wobble.mjs`. It applies two SVG displacement passes, a slow wobble and a fine jitter, so the outlines bend like the artist's mouse-drawn Krita lines.
- **Clean raster art:** a drawing that comes back too clean (the Up house) gets the same treatment in `prep_art.mjs` (override `wobble: <px>`).
- **Two-tone fills:** a canopy that came back with two greens is repainted with one flat colour (override `unify`).

- **Colour flattening:** flat SVG doodles skip the colour-flattening step (override `flatten: false`). Small colour areas can be kept with `keepColors` (the copter stick).
- **Thin lines on empty paper:** balloon strings and similar lines are thickened outward with `inkGrowOut`, so they survive mipmapping and the alpha test.
- **Balloon strings:** the Up house strings are no longer part of the texture: thin lines there always break up when shown small.
  - `prep_art.mjs` (override `restring` with `geometry: true`) finds them, erases them and exports them as uv segments.
  - The site draws them as thin wobbly ink ribbons just behind the card (`Strings` in `PaperCutout.jsx`), so the balloons and the chimney hide their ends.
