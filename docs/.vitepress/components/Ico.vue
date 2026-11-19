<script setup lang="ts">
// Custo line-icon set — replaces raw emoji site-wide (user, 2026-11-20: "생 이모지 쓰지 말고").
// 24×24 grid, 1.8 round stroke, currentColor; `duo` paints a soft member-colour fill behind the line
// (uses --ico-fill, defaults to 22% of currentColor). Decorative by default (aria-hidden); pass `label` to expose it.
const props = withDefaults(defineProps<{ n: string; size?: number | string; label?: string; duo?: boolean }>(), { size: '1.15em' })

// each icon: [fill-path (duo layer, optional), line paths…]
const P: Record<string, string[]> = {
  mountain: ['M2.5 20 9 8.5l3 4.5 2.4-3.4L21.5 20Z', 'M2.5 20 9 8.5l3 4.5 2.4-3.4L21.5 20Z', 'M7.3 11.5 9 12.6l1.6-1.1'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M3.5 9h17M3.5 15h17', 'M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z'],
  drag: ['', 'M8 13V5.8a1.6 1.6 0 1 1 3.2 0V11', 'M11.2 10.5V4.6a1.6 1.6 0 1 1 3.2 0v6', 'M14.4 10.8V6.2a1.6 1.6 0 1 1 3.2 0v7.3c0 4-2.6 7-6.2 7-2.6 0-4-1.1-5.4-3.2L3.6 13.4a1.6 1.6 0 0 1 2.6-1.9L8 14', 'M20.5 4.5l1-1M20 8h1.5'],
  link: ['', 'M10 14a4 4 0 0 0 5.7 0l3.1-3.1a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3.1 3.1a4 4 0 0 0 5.7 5.7l1-1'],
  check: ['', 'M5 12.5 10 17.5 19.5 7'],
  play: ['M8 5.5v13l10.5-6.5Z', 'M8 5.5v13l10.5-6.5Z'],
  pin: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z', 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z', 'M12 7.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z'],
  flag: ['M6 4h11.5l-2.4 4 2.4 4H6Z', 'M6 21V4h11.5l-2.4 4 2.4 4H6'],
  plane: ['', 'M10.2 13.8 4 11.5l1.4-1.4 7 .6 4.4-4.4a1.8 1.8 0 0 1 2.6 2.6L15 13.3l.6 7-1.4 1.4-2.3-6.2', 'M7.5 16.5 5 19'],
  sparkle: ['M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z', 'M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z', 'M19 16.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z'],
  tv: ['M3.5 7.5h17v11h-17Z', 'M3.5 7.5h17v11h-17Z', 'M8.5 3.5 12 7l3.5-3.5', 'M8 21h8'],
  disc: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z', 'M7 8.2A6 6 0 0 1 9.6 6.4'],
  calendar: ['M4 6.5h16V20H4Z', 'M4 6.5h16V20H4Z', 'M4 10.5h16', 'M8.5 4v4M15.5 4v4'],
  cake: ['M4.5 13h15v7.5h-15Z', 'M4.5 13h15v7.5h-15Z', 'M4.5 16c1.9 1.3 3.8 1.3 5 0 1.2 1.3 3.8 1.3 5 0 1.2 1.3 3.1 1.3 5 0', 'M8 13v-2.5M12 13v-2.5M16 13v-2.5', 'M12 5.5c.9.9.9 2-0 2.6-.9-.6-.9-1.7 0-2.6Z'],
  heart: ['M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z', 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z'],
  mic: ['M9 4.5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0Z', 'M9 4.5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0Z', 'M5.5 10.5a6.5 6.5 0 0 0 13 0', 'M12 17v4M8.5 21h7'],
  film: ['M3.5 5.5h17v13h-17Z', 'M3.5 5.5h17v13h-17Z', 'M7.5 5.5v13M16.5 5.5v13', 'M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4'],
  search: ['', 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z', 'M15.3 15.3 20 20'],
  trophy: ['M7 4h10v5a5 5 0 0 1-10 0Z', 'M7 4h10v5a5 5 0 0 1-10 0Z', 'M7 6H4.5a3 3 0 0 0 3 4M17 6h2.5a3 3 0 0 1-3 4', 'M12 14v3.5M8.5 20.5h7l-.8-3h-5.4Z'],
  music: ['M9 17.5a2.5 2.5 0 1 1-2.5-2.5H9V5.5l10-2v11.5', 'M9 17.5a2.5 2.5 0 1 1-2.5-2.5H9V5.5l10-2v11.5', 'M19 15a2.5 2.5 0 1 1-2.5-2.5H19', 'M9 9l10-2'],
  gift: ['M4.5 11h15v9.5h-15Z', 'M4.5 11h15v9.5h-15Z', 'M3.5 7.5h17V11h-17Z', 'M12 7.5v13', 'M12 7.5C10.6 4 7.5 4 7.5 6s2.6 1.5 4.5 1.5c1.9 0 4.5.5 4.5-1.5S13.4 4 12 7.5Z'],
  camera: ['M3.5 8h4l1.6-2.5h5.8L16.5 8h4v11.5h-17Z', 'M3.5 8h4l1.6-2.5h5.8L16.5 8h4v11.5h-17Z', 'M12 10.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z'],
  news: ['M4 5h12.5v14.5H6.5A2.5 2.5 0 0 1 4 17Z', 'M4 5h12.5v14.5H6.5A2.5 2.5 0 0 1 4 17Z', 'M16.5 9H20v8a2.5 2.5 0 0 1-2.5 2.5', 'M7.5 9h5.5M7.5 12.5h5.5M7.5 16h3.5'],
  penlight: ['M10 13.5h4l-.6 7.5h-2.8Z', 'M10 13.5h4l-.6 7.5h-2.8Z', 'M9 3.5h6v10H9Z', 'M5.5 5.5 4 4.5M18.5 5.5 20 4.5M5 9.5H3.5M19 9.5h1.5'],
  fan: ['M12 20 3.5 9.5a11 11 0 0 1 17 0Z', 'M12 20 3.5 9.5a11 11 0 0 1 17 0Z', 'M12 20 8.2 6.1M12 20l3.8-13.9M12 20V5.5'],
  target: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z'],
  close: ['', 'M6 6l12 12M18 6 6 18'],
  arrow: ['', 'M5 12h14M13.5 6.5 19 12l-5.5 5.5'],
}
</script>

<template>
  <svg class="ico" :class="{ duo: props.duo }" viewBox="0 0 24 24" :width="props.size" :height="props.size" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :role="props.label ? 'img' : undefined" :aria-label="props.label" :aria-hidden="props.label ? undefined : 'true'" focusable="false">
    <path v-if="props.duo && P[props.n]?.[0]" class="f" :d="P[props.n][0]" />
    <path v-for="(d, i) in (P[props.n] || []).slice(1)" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.ico { display: inline-block; vertical-align: -0.18em; flex: none; overflow: visible; }
.f { stroke: none; fill: var(--ico-fill, color-mix(in srgb, currentColor 22%, transparent)); }
</style>
