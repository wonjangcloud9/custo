<script setup lang="ts">
import { ref } from 'vue'
// Lightweight YouTube facade: shows the official thumbnail and only loads the player iframe on click.
const props = defineProps<{ id: string; title?: string }>()
const on = ref(false)
</script>

<template>
  <div class="yt">
    <iframe v-if="on" :src="`https://www.youtube-nocookie.com/embed/${props.id}?autoplay=1&rel=0`" :title="props.title || 'YouTube'"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen />
    <button v-else type="button" class="yt-poster" :aria-label="`${props.title || '영상'} 재생`" @click="on = true">
      <img :src="`https://i.ytimg.com/vi/${props.id}/hqdefault.jpg`" alt="" loading="lazy" />
      <span class="yt-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg></span>
      <span v-if="props.title" class="yt-title">{{ props.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.yt { position: relative; aspect-ratio: 16 / 9; margin: 1.25rem 0; border-radius: 18px; overflow: hidden; background: #12060f; box-shadow: 0 20px 40px -24px rgba(90, 30, 70, 0.6); }
.yt iframe { width: 100%; height: 100%; border: 0; display: block; }
.yt-poster { position: relative; width: 100%; height: 100%; padding: 0; display: block; cursor: pointer; }
.yt-poster img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(.2, .8, .2, 1), filter 0.3s; }
.yt-poster:hover img { transform: scale(1.04); filter: brightness(0.9); }
.yt-play { position: absolute; left: 50%; top: 50%; width: 72px; height: 72px; translate: -50% -50%; display: grid; place-items: center; color: #fff;
  background: rgba(255, 107, 157, 0.92); border-radius: 42% 58% 61% 39% / 45% 41% 59% 55%; box-shadow: 0 10px 30px rgba(255, 107, 157, 0.55);
  transition: scale 0.5s cubic-bezier(.34, 1.56, .64, 1); animation: yblob 4s ease-in-out infinite; }
.yt-play svg { width: 32px; height: 32px; fill: currentColor; margin-left: 4px; }
.yt-poster:hover .yt-play { scale: 1.12; }
@keyframes yblob { 50% { border-radius: 58% 42% 38% 62% / 55% 60% 40% 45%; } }
.yt-title { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 16px 12px; text-align: left; color: #fff; font-weight: 700; font-size: 14px; background: linear-gradient(transparent, rgba(20, 5, 20, 0.75)); }
@media (prefers-reduced-motion: reduce) { .yt-play { animation: none; } .yt-poster img, .yt-play { transition: none; } }
</style>
