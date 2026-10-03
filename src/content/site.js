// Everything the site says and shows lives here. Edit freely.
//
// Each scene is a 12-unit wide stage with fixed depth slots (see DESIGN.md):
//   wall  - pinned flat on the paper (sky things, signs, big backdrops)
//   back  - landmarks and characters on the back strip, in front of the wall
//   mid   - LOW props only (they stand in front of my lane and would hide me)
//   front - small framing props near the camera
// plus groove A (me on my vehicle, see `rides`) and groove B (`traffic`).
// Keep the left ~3.6 units of each wall free for the sticky note + handwriting.
//
// Item fields:
//   art     drawing key: public/art/<art>.webp (see src/content/art-manifest.json).
//           Without a drawing a coloured placeholder card is shown.
//   x       0 (left edge of the scene) .. 12 (right edge)
//   y       height above the ground (wall items: above the ground line)
//   z       "wall" | "back" | "mid" | "front"
//   h       height in world units (width follows the drawing)
//   tilt    rotation in radians; flip: mirror horizontally; stick: on a wooden stick
//   anim    "bob" | "sway" | "grass" | "float" | "pop" (pops forward on hover)

export const site = {
  title: "Cấn Thế Thôi",
  tagline: "four worlds that made me, drawn on notebook paper",
  hint: "scroll / drag to flip through",
};

export const sillyLines = [
  "WE'RE GONNA MAKE IT!",
  "It's actually over bro. For real this time.",
  "gm",
  "wen moon?",
  "I bought the top. Again.",
  "Not financial advice. Not any advice.",
  "Ward your jungle, please.",
  "One more game, then sleep.",
  "Teemo is not a war crime. Probably.",
  "Trà đá is a personality.",
  "Ramen > responsibilities",
  "Portfolio is down, vibes are up.",
  "Doraemon, lend me the time machine.",
  "Diamond hands, paper body.",
  "This notebook is my whole personality.",
];

// Me, riding something different in every world (groove A). `seat` is where I
// sit relative to the vehicle's bottom centre. heroInFront: I sit on top with my
// legs over the vehicle; otherwise the vehicle (my bike) is in front of my legs.
export const rides = {
  childhood: { hero: "hero/hero_childhood", vehicle: "vehicles/time_machine", vehicleFlip: true, vehicleH: 1.7, seat: [-0.4, 0.3], heroH: 1.35, motion: "hover", heroInFront: true },
  // on Skaarl (a rig that runs: vehicleRig, seat from the rig) with the Infinity
  // Edge raised (props: drawings I hold, see HeldProp in Hero.jsx)
  games: {
    hero: "hero/hero_games", vehicleRig: "skaarl", vehicleH: 1.6, stride: 10.5, dust: true, heroH: 1.35, motion: "run", heroInFront: true,
    props: [{ art: "games/infinity_edge", hand: [0.81, 0.29], grip: [0.12, 0.5], h: 0.36, flip: true, rot: 1.0 }],
  },
  // my school jacket (after the photo of the real one) and the red scarf
  street: { hero: "hero/hero_street", vehicle: "bike", vehicleH: 1.1, seat: [-0.14, 0.58], heroH: 1.45, motion: "pedal", heroInFront: true },
  // surfing the crypto sea; at the very end my one black wing unfolds (wing.grow,
  // scene x) and lifts me off the board (wing.lift)
  adult: {
    hero: "hero/hero_adult", vehicle: "vehicles/surfboard", vehicleH: 0.3, seat: [0, 0.17], heroH: 1.35, motion: "surf", heroInFront: true, dust: "foam", stride: 6,
    wing: { art: "crypto/one_wing", root: [0.96, 0.48], at: [0.25, 0.5], h: 1.8, grow: { scene: "adult", from: 49.6, to: 51.8 }, lift: 0.55 },
  },
  // the One Winged Angel: up through the sky on my own wing, and back to the start
  seam: { hero: "hero/hero_adult", vehicle: null, vehicleH: 0.6, seat: [0, 0.72], heroH: 1.35, motion: "fly", heroInFront: true, wing: { art: "crypto/one_wing", root: [0.96, 0.48], at: [0.25, 0.5], h: 1.8, flap: 0.32, speed: 4.6 } },
};

export const scenes = [
  {
    id: "childhood",
    title: "Saturday morning cartoons",
    greeting: "Doraemon, lend me the time machine.",
    width: 36, // three pages long
    ground: 0.6,
    strips: { back: "#D4E6C3", mid: "#C6DEB3", front: "#BCD8A8" },
    wall: {
      text: { body: "Welcome to my notebook!!\n        – Cấn Thế Thôi\n\np.s. raised by Doraemon,\nNaruto, Ghibli & Disney", x: 0.25, y: 1.5, size: 0.26 },
    },
    items: [
      // sky
      { art: "childhood/cloud", x: 5.2, y: 3.9, z: "sky", h: 0.7, anim: "sway" },
      { art: "childhood/cloud_b", x: 12.6, y: 4.3, z: "sky", h: 0.6, flip: true, anim: "sway" },
      { art: "childhood/cloud", x: 18.2, y: 3.6, z: "sky", h: 0.8, anim: "sway" },
      { art: "childhood/cloud_b", x: 24.4, y: 4.2, z: "sky", h: 0.65, flip: true, anim: "sway" },
      { art: "childhood/cloud", x: 30.0, y: 3.8, z: "sky", h: 0.75, anim: "sway" },
      { art: "childhood/cloud_b", x: 34.0, y: 4.3, z: "sky", h: 0.55, flip: true, anim: "sway" },
      // the Robo Trái Cây tree, its robot fruits hanging on threads
      { art: "childhood/fruit_tree", x: 7.0, z: "back", h: 3.9 },
      { art: "childhood/robo_apple", x: 5.45, y: 2.3, hang: 0.25, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      { art: "childhood/robo_strawberry", x: 6.1, y: 2.05, hang: 0.45, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      { art: "childhood/robo_orange", x: 6.75, y: 2.35, hang: 0.22, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      { art: "childhood/robo_grape", x: 7.4, y: 2.1, hang: 0.42, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      { art: "childhood/robo_pineapple", x: 8.05, y: 2.3, hang: 0.25, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      { art: "childhood/robo_peach", x: 8.65, y: 2.05, hang: 0.38, z: "back", dz: 0.14, h: 0.6, anim: "dangle" },
      // Carl's house from Up drifting over the scene
      { art: "childhood/up_house", x: 15.6, y: 0.1, z: "back", dz: 0.2, h: 4.7, anim: "rise", rise: 1.5, riseSpan: 8 },
      // Shaun the Sheep and baby Timmy watching the house float away (front row)
      { art: "childhood/shaun", x: 15.0, z: "front", h: 1.0, anim: "bob" },
      { art: "childhood/timmy", x: 16.2, z: "front", h: 0.72, anim: "bob" },
      // Oggy's house and Phineas & Ferb's house
      { art: "childhood/oggy_house", x: 25.2, z: "back", h: 2.4 },

      // Mr. Bean's Teddy, slumped against the Anywhere Door's frame (its near
      // post stands at x ≈ 35.34, z ≈ -0.80; Teddy sits just in front of it)
      { art: "childhood/teddy", x: 35.08, z: -0.74, h: 0.52, tilt: -0.08 },
      { art: "childhood/pf_house", x: 31.6, z: "back", h: 2.7 },
      // flowers along the road
      { art: "childhood/flower_tulip", x: 1.30, z: "mid", h: 0.52, anim: "grass" },
      { art: "childhood/flower_daisy", x: 2.55, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_tulip", x: 5.80, z: "mid", h: 0.52, anim: "grass" },
      { art: "childhood/flower_tulip", x: 8.20, z: "mid", h: 0.52, anim: "grass", flip: true },
      { art: "childhood/flower_daisy", x: 10.70, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_daisy", x: 13.30, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_tulip", x: 16.00, z: "mid", h: 0.52, anim: "grass" },
      { art: "childhood/flower_daisy", x: 18.80, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_tulip", x: 21.70, z: "mid", h: 0.52, anim: "grass" },
      { art: "childhood/flower_tulip", x: 23.80, z: "mid", h: 0.52, anim: "grass", flip: true },
      { art: "childhood/flower_daisy", x: 26.00, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_tulip", x: 30.70, z: "mid", h: 0.52, anim: "grass" },
      { art: "childhood/flower_daisy", x: 33.20, z: "mid", h: 0.6, anim: "grass" },
      { art: "childhood/flower_daisy", x: 0.60, z: "front", h: 0.66, anim: "grass" },
      { art: "childhood/flower_daisy", x: 4.10, z: "front", h: 0.66, anim: "grass" },
      { art: "childhood/flower_tulip", x: 7.40, z: "front", h: 0.62, anim: "grass", flip: true },
      { art: "childhood/grass", x: 10.50, z: "front", h: 0.44, anim: "grass" },
      { art: "childhood/flower_tulip", x: 13.40, z: "front", h: 0.62, anim: "grass", flip: true },
      { art: "childhood/flower_daisy", x: 19.70, z: "front", h: 0.66, anim: "grass" },
      { art: "childhood/flower_tulip", x: 26.30, z: "front", h: 0.62, anim: "grass", flip: true },
      { art: "childhood/flower_daisy", x: 29.30, z: "front", h: 0.66, anim: "grass" },
      { art: "childhood/flower_daisy", x: 32.10, z: "front", h: 0.66, anim: "grass" },
    ],
    structures: [
      // the family's Panasonic CRT at the very start, showing snow
      { type: "crtTv", x: 4.1, h: 0.95 },
      // Totoro waiting at the bus stop, rigged from separate parts
      { type: "totoro", x: 11.6, height: 2.9 },
      // Probe pops its lid, shoots a Bakugan ball up and it turns into Drago
      { type: "probeBakugan", x: 20.0, probeH: 1.2, drago: { dx: 1.7, y: 2.9, h: 2.2 } },
      // Phineas & Ferb's rocket blasts off from behind their house
      { type: "pfRocket", x: 32.6 },
      // Perry, a plain pet until I come close, then Agent P
      { type: "perryAgent", x: 28.4, agentH: 1.2 },
      // the Anywhere Door at the end: it opens and I ride through into the Rift
      { type: "anywhereDoor", x: 35.0 },
    ],
  },
  {
    id: "games",
    title: "Summoner's Rift, Gunny & the Mole Kingdom",
    greeting: "One more game, then sleep.",
    width: 30, // two and a half pages
    ground: 1.0,
    // Summoner's Rift: grass, a dirt lane down the middle, and groove B is the river
    strips: { back: "#A8CC92", mid: "#D3BC92", front: "#A8CC92", grooveB: "#8FC3DE" },
    wall: {
      text: { body: "After school = LoL.\nBefore school = Moly.\nWeekends = Gunny.\nSleep = optional.\n\nmain: Teemo (sorry not sorry)", x: 0.2, y: 1.0, size: 0.26 },
    },
    items: [
      // Poros: one on the road, one in the front row
      { art: "games/poro", x: 2.4, z: "mid", h: 0.55, anim: "bob" },
      { art: "games/poro", x: 9.0, z: "front", h: 0.62, anim: "bob", flip: true },
      // bushes (the Rift's brush), bigger
      { art: "childhood/grass", x: 1.0, z: "front", h: 0.8, anim: "grass" },
      { art: "childhood/grass", x: 6.4, z: "front", h: 0.9, anim: "grass" },
      { art: "childhood/grass", x: 12.0, z: "front", h: 0.8, anim: "grass" },
      { art: "childhood/grass", x: 17.8, z: "front", h: 0.95, anim: "grass" },
      { art: "childhood/grass", x: 25.0, z: "front", h: 0.85, anim: "grass" },
      { art: "childhood/grass", x: 28.8, z: "front", h: 0.9, anim: "grass" },
      { art: "childhood/grass", x: 3.0, z: "back", h: 1.0, anim: "grass" },
      { art: "childhood/grass", x: 13.4, z: "back", h: 1.1, anim: "grass" },
    ],
    structures: [
      // a wave of blue minions pushing a red turret, both sides shooting
      { type: "minionTurret", x: 10.6 },
      // the Elder Dragon gliding high over the Rift, wings beating
      { type: "elderDragon", x: 14.5, y: 3.9, h: 1.9, glide: 5 },
      // Moly sitting in the front row, waving hello
      { type: "molyWave", x: 14.6 },
      // big Teemo mushrooms along my lane: they go off when I run into them
      { type: "teemoShroom", x: 4.6 },
      { type: "teemoShroom", x: 12.8 },
      { type: "teemoShroom", x: 16.8 },
      { type: "teemoShroom", x: 19.6 },
      // the Gunny chick up a tree, lobbing its lu gạch at a Scuttler in the river
      { type: "gunnyTree", x: 20.4 },
      // Blitzcrank in the bush: Rocket Grab, Power Fist, and I fly into the next world
      { type: "blitzHook", x: 27.4 },
    ],
    traffic: [
      // a Rift Scuttler scuttling along the river, sideways both ways
      { art: "games/scuttle", h: 0.55, speed: 0.55, phase: 0.15, noTurn: true, range: [0, 18] },
    ],
  },
  {
    id: "street",
    title: "Vietnamese streets & school",
    greeting: "Trà đá is a personality.",
    width: 30, // two and a half pages
    ground: 1.4,
    // pavements either side of the road
    strips: { back: "#EBC6B2", mid: "#BEBBB4", front: "#EBC6B2", grooveB: "#8F8C86" },
    roadDashes: true,
    wall: {
      text: { body: "Red scarf, white shirt,\nbike rides home,\ntrà đá on red stools.", x: 0.2, y: 1.15, size: 0.26 },
    },
    items: [
      // a row of tube houses (nhà ống), shoulder to shoulder
      { art: "street/house_a", x: 5.0, z: -2.42, h: 4.2 },
      { art: "street/house_b", x: 6.69, z: -2.45, h: 4.4 },
      { art: "street/house_c", x: 8.32, z: -2.42, h: 4.1 },
      { art: "street/house_d", x: 9.99, z: -2.45, h: 4.2 },
      // a Suzuki Viva parked outside the repair shop (sửa xe)
      { art: "street/suzuki_viva", x: 11.0, z: "back", dz: 0.38, h: 0.85, flip: true },
      { art: "street/apple_tree", x: 13.3, z: "back", h: 2.8, anim: "sway" },
      { art: "street/street_sign", x: 14.8, z: "back", h: 2.3 },
      // the yellow wall plastered with ads, and the sun
      { art: "street/yellow_wall", x: 17.4, y: 0, z: "wall", h: 2.5 },
      { art: "street/ad_khoan", x: 16.55, y: 1.4, z: "wall", dz: 0.03, h: 0.64, tilt: -0.06 },
      { art: "street/ad_phong", x: 17.55, y: 0.4, z: "wall", dz: 0.03, h: 0.68, tilt: 0.05 },
      { art: "street/ad_daykem", x: 18.45, y: 1.3, z: "wall", dz: 0.03, h: 0.64, tilt: -0.03 },
      { art: "street/sun", x: 15.9, y: 3.3, z: "wall", h: 1.0, anim: "sway" },
      // two more houses near the school: the coffee shop and the photocopy shop
      { art: "street/house_e", x: 21.0, z: -2.42, h: 4.1 },
      { art: "street/house_f", x: 22.69, z: -2.45, h: 4.5 },
      // street life on the pavement: the bánh mì cart and trà đá on red stools
      { art: "street/banh_mi_cart", x: 7.3, z: "front", h: 1.4 },
      { art: "street/plastic_stools", x: 14.3, z: "front", h: 0.55 },
      // ...and the điếu cày (bamboo water pipe) leaning on the trà đá stools
      { art: "street/dieu_cay", x: 15.0, z: "front", dz: 0.04, h: 0.6, tilt: 0.55 },
      { art: "street/piggy_bank", x: 3.0, z: "mid", h: 0.42 },
    ],
    structures: [
      // power poles with the famous tangle of wires, sparrows that fly off,
      // and the ward loudspeaker (loa phường) on the second pole
      { type: "powerLines", x: 3.4, poles: [0, 8.4, 16.2, 21.2], loaAt: 1, birdsOn: 1, houseDrops: [[0, 1.5, 3.1], [1, -1.3, 3.3], [3, -1.4, 3.0]] },
      // bia vỉa hè: a sidewalk beer table, the glasses clink "DZÔ!" as I pass
      { type: "beerTable", x: 19.4 },
      // boy phố: Phineas and Ferb tearing past on one wheel, a spear sparking on the road
      { type: "boyPho", x: 12.5 },
      // graduation: the school gate opens and hands me over to adult life
      { type: "schoolGate", x: 27.6 },
    ],
    traffic: [
      // motorbikes on the road, tooting their horns
      { art: "street/suzuki_viva", h: 0.85, speed: 0.8, phase: 0.1, honk: true },
      { art: "street/honda_cub", h: 0.8, speed: 0.55, phase: 0.45 },
      { art: "street/suzuki_viva", h: 0.82, speed: 0.62, phase: 0.75, honk: true },
    ],
  },
  {
    id: "adult",
    title: "The crypto sea",
    greeting: "WE'RE GONNA MAKE IT!",
    width: 54, // four and a half pages: the high, the dark, and the way up
    ground: 1.1,
    strips: { back: "#7DB4DA", mid: "#6AA3CF", front: "#5E97C6", grooveB: "#4C84B6" },
    wall: {
      text: { body: "Crypto degen by day,\nmusic by night.\n\nWE'RE GONNA MAKE IT!!\n(not financial advice)", x: 0.2, y: 1.15, size: 0.26 },
      // the wall darkens as the sea does, deepest under the tangle of thoughts,
      // and clears as my wing grows and I fly up into the sky
      gloom: [[0, 0], [10, 0.04], [20, 0.12], [28, 0.24], [36, 0.34], [44, 0.42], [48.6, 0.45], [51.5, 0.12], [54, 0]],
      // the dark half: what goes round in my head, scribbled on the wall
      extra: [
        { body: "-87%", x: 29.5, y: 3.1, size: 0.44, color: "#B8322A", tilt: -0.08 },
        { body: "...let it go.", x: 48.2, y: 1.15, size: 0.32, color: "#7C5CFA", tilt: -0.03 },
      ],
    },
    items: [
      // a bright sky at first, storm clouds over the dark half
      { art: "childhood/cloud", x: 5.0, y: 3.7, z: "sky", h: 0.7, anim: "sway" },
      { art: "childhood/cloud_b", x: 13.5, y: 4.1, z: "sky", h: 0.6, flip: true, anim: "sway" },
      { art: "childhood/cloud", x: 21.0, y: 3.9, z: "sky", h: 0.65, anim: "sway" },
      // euphoria: the pump.fun pill bobbing on the water, and a buoy of wisdom
      { art: "crypto/pill", x: 3.6, z: "front", h: 0.75, anim: "float" },
      { art: "crypto/buoy_nfa", x: 21.5, z: "front", h: 0.95, anim: "float" },
      // grown-up life: the work tools I live in, little things bobbing half sunk like the pill, right at the start
      { art: "crypto/logo_vscode", x: 2.4, y: 0.12, z: "back", dz: 0.25, h: 0.62, anim: "float", tilt: -0.12 },
      { art: "crypto/logo_figma", x: 5.4, y: 0.05, z: "front", h: 0.62, anim: "float", tilt: 0.16 },
      { art: "crypto/logo_after_effects", x: 8.6, y: 0.05, z: "front", h: 0.55, anim: "float", tilt: 0.2 },
      { art: "crypto/logo_blender", x: 10.4, y: 0.12, z: "back", dz: 0.25, h: 0.55, anim: "float", tilt: 0.1 },
      { art: "crypto/logo_claude", x: 12.2, y: 0.05, z: "front", h: 0.58, anim: "float", tilt: -0.14 },
      // the end of the sea: a lotus in bloom where the sunbeams land
      { art: "crypto/lotus", x: 52.2, y: 0.12, z: "front", h: 1.25, anim: "float" },
      // the hangover: the NFT that sinks as I pass, a buoy of hope
      { art: "crypto/nft_ape", x: 27.0, z: "back", dz: 0.2, h: 1.25, anim: "rise", rise: -1.0, riseSpan: 2.5 },
      { art: "crypto/buoy_wagmi", x: 44.5, z: "back", dz: 0.3, h: 1.0, anim: "float" },
    ],
    structures: [
      // the sea: rows of paper waves, darkening in the second half
      {
        type: "seaWaves", x: 0, width: 54,
        rows: [
          { art: ["crypto/waves_back_1", "crypto/waves_back_2", "crypto/waves_back_3"], darkArt: ["crypto/waves_dark_1", "crypto/waves_dark_2", "crypto/waves_dark_3"], dark: 27, z: -2.62, h: 0.78, speed: 0.45, amp: 0.25 },
          { art: ["crypto/waves_mid_1", "crypto/waves_mid_2", "crypto/waves_mid_3"], darkArt: ["crypto/waves_dark_1", "crypto/waves_dark_2", "crypto/waves_dark_3"], dark: 25.5, z: -1.74, h: 0.56, speed: 0.7, amp: 0.3 },
          { art: ["crypto/waves_front_1", "crypto/waves_front_2", "crypto/waves_front_3"], darkArt: ["crypto/waves_dark_1", "crypto/waves_dark_2", "crypto/waves_dark_3"], dark: 25, z: -1.13, h: 0.36, y: -0.06, speed: 0.95, amp: 0.25 },
          { art: ["crypto/waves_front_1", "crypto/waves_front_2", "crypto/waves_front_3"], darkArt: ["crypto/waves_dark_1", "crypto/waves_dark_2", "crypto/waves_dark_3"], dark: 26, z: 0.0, h: 0.55, speed: 0.6, amp: 0.3 },
          { art: ["crypto/waves_front_1", "crypto/waves_front_2", "crypto/waves_front_3"], darkArt: ["crypto/waves_dark_1", "crypto/waves_dark_2", "crypto/waves_dark_3"], dark: 28, z: 0.85, h: 0.66, speed: 0.5, amp: 0.35 },
        ],
      },
      // the high: a whale spouting coins, the cabal, the puppeteer, the rug pull
      { type: "whaleSpout", x: 7.0 },
      { type: "cabalBoat", x: 14.5 },
      { type: "puppetMaster", x: 19.0 },
      { type: "anglerfish", x: 24.0 },
      // storm clouds over the dark half: drifting, raining, lightning
      { type: "stormCloud", x: 28.0, y: 2.8, h: 1.25, phase: 0 },
      { type: "stormCloud", x: 34.5, y: 3.2, h: 1.45, flip: true, phase: 1 },
      { type: "stormCloud", x: 41.0, y: 2.9, h: 1.35, phase: 2 },
      { type: "stormCloud", x: 46.5, y: 3.3, h: 1.2, flip: true, phase: 3 },
      // this is fine (flames, rocking boat, sipping dog) and the sad frog sobbing
      { type: "thisIsFine", x: 30.5 },
      { type: "sadPepe", x: 33.5 },
      // the liquidation whirlpool
      { type: "whirlpool", x: 37.0 },
      // the tangle of thoughts that follows me, and bursts into my one wing
      { type: "thoughtTangle", x: 0, from: 25, peak: 45, burst: 49.4, rays: { x: 51.2, top: 7.2, h: 5.8 } },
    ],
    traffic: [
      // shark fins circling in the water
      { art: "crypto/shark_fin", h: 0.42, speed: 0.6, phase: 0.2, range: [6, 46] },
      { art: "crypto/shark_fin", h: 0.36, speed: 0.45, phase: 0.7, range: [26, 52] },
    ],
  },
];

// The sky after the last scene: my one wing takes me up and back to the start,
// past the Dharma wheel, with the dove of peace flying beside me.
export const seam = {
  structures: [
    { type: "dharmaWheel", x: 10.0, y: 4.4, h: 3.6 },
    // the dove comes out of one cloud and flies into another (its own two clouds)
    { type: "dove", x: -2.5, w: 1.15, offset: [2.6, 2.9] },
  ],
  wall: { text: { body: "up, up and away ↑\n\n...and back to the start.\nCấn. Thế thôi. ↺", x: 0.4, y: 2.6, size: 0.3 } },
  items: [
    { art: "childhood/cloud", x: 2.4, y: 0.4, z: "back", h: 1.0, anim: "sway" },
    { art: "childhood/cloud", x: 6.5, y: 0.2, z: "front", h: 0.7, anim: "sway" },
  ],
};
