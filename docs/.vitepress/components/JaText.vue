<script setup lang="ts">
import { computed } from 'vue'

// Renders a Korean line with Japanese runs inside it — 「かわいいだけじゃだめですか？」, 楽天ブックス, アクセスサッポロ —
// with each Japanese run wrapped in <span lang="ja"> (#202), so a screen reader switches voice for just that
// part and Japanese line breaking applies there. Plain text in, inline text out (no wrapper element).
const props = defineProps<{ t?: string | null }>()
// a run: Japanese letters (kana/kanji) plus the Japanese punctuation, brackets and full-width signs around them;
// a single space may join two Japanese words (アクセス サッポロ) but never a Korean one
const RUN = /((?:[　-〿ぁ-ヿ一-鿿！-｠]+(?:[ 　](?=[ぁ-ヿ一-鿿「『]))?)+)/
const LETTER = /[ぁ-ヿ一-鿿]/
const parts = computed(() => (props.t ?? '').split(RUN).filter((s) => s !== '').map((s) => ({ s, ja: LETTER.test(s) && RUN.test(s) && !/[가-힣]/.test(s) })))
</script>

<template><template v-for="(p, i) in parts" :key="i"><span v-if="p.ja" lang="ja">{{ p.s }}</span><template v-else>{{ p.s }}</template></template></template>
