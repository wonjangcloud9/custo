// Renders the static mini globe for the home 'world map' tile → docs/public/art/world-mini.svg
// (land + graticule only; pins/arcs are drawn live on top by WorldMini.vue with the same projection).
// Projection must match WorldMini.vue: orthographic, centre [168E, 26N], scale 115 seen through a 51.5° lens (rim r = 90) in a 200×200 box.
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import { createRequire } from 'module'
import { writeFileSync } from 'fs'
const require = createRequire(import.meta.url)
const land = require('world-atlas/land-110m.json')
const p = geoOrthographic().scale(115).translate([100, 100]).rotate([-168, -26]).clipAngle(51.5)
const path = geoPath(p).digits(1)
const g = path(geoGraticule10())
const l = path(feature(land, land.objects.land))
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="o" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fbeef6"/><stop offset="1" stop-color="#ecd9f3"/></radialGradient></defs><circle cx="100" cy="100" r="90" fill="url(#o)"/><path d="${g}" fill="none" stroke="#e8c9dc" stroke-width=".4"/><path d="${l}" fill="#f6d3e4" stroke="#fff" stroke-width=".5" stroke-linejoin="round"/><circle cx="100" cy="100" r="90" fill="none" stroke="#f0c2d8" stroke-width="1"/></svg>`
writeFileSync(new URL('../docs/public/art/world-mini.svg', import.meta.url), svg)
console.log('world-mini.svg', svg.length, 'bytes')
