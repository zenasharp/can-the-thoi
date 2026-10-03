// The loading screen's desk: the AI wood photo (raw_art/intro/desk_wood.png) -> public/art/intro/desk_wood.webp
import sharp from "sharp";
const info = await sharp("raw_art/intro/desk_wood.png").resize({ width: 1800 }).webp({ quality: 78 }).toFile("public/art/intro/desk_wood.webp");
console.log(info.width, info.height, Math.round(info.size / 1024) + " KB");
