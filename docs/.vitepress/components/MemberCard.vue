<template>
  <div class="member-card" :style="{ '--member-color': color }">
    <div class="member-header">
      <div class="member-avatar" :style="{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }">
        <img v-if="image" :src="image" :alt="nameJa" class="avatar-img" />
        <span v-else class="avatar-initial">{{ nameJa.charAt(0) }}</span>
      </div>
      <div class="member-names">
        <h3 class="name-ja">{{ nameJa }}</h3>
        <p class="name-sub">{{ name }}</p>
      </div>
    </div>

    <div class="member-meta">
      <div v-if="birthday" class="meta-row">
        <span class="meta-label" :style="{ background: color }">생일</span>
        <span class="meta-value">{{ birthday }}</span>
      </div>
      <div v-if="position" class="meta-row">
        <span class="meta-label" :style="{ background: color }">포지션</span>
        <span class="meta-value">{{ position }}</span>
      </div>
    </div>

    <div v-if="sns && (sns.x || sns.instagram)" class="member-sns">
      <a
        v-if="sns.x"
        :href="`https://x.com/${sns.x}`"
        target="_blank"
        rel="noopener noreferrer"
        class="sns-link"
        :style="{ borderColor: color, color: color }"
      >
        𝕏 @{{ sns.x }}
      </a>
      <a
        v-if="sns.instagram"
        :href="`https://instagram.com/${sns.instagram}`"
        target="_blank"
        rel="noopener noreferrer"
        class="sns-link"
        :style="{ borderColor: color, color: color }"
      >
        IG @{{ sns.instagram }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SnsLinks {
  x?: string
  instagram?: string
}

defineProps<{
  name: string
  nameJa: string
  color: string
  birthday?: string
  position?: string
  image?: string
  sns?: SnsLinks
}>()
</script>

<style scoped>
.member-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 16px rgba(196, 156, 255, 0.12), 0 1px 4px rgba(255, 107, 157, 0.08);
  padding: 1.25rem 1.5rem;
  border-left: 5px solid var(--member-color, #FF6B9D);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 1rem;
}

.member-card:hover {
  box-shadow: 0 6px 28px rgba(196, 156, 255, 0.2), 0 2px 8px rgba(255, 107, 157, 0.12);
  transform: translateY(-2px);
}

.member-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.member-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-initial {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.name-ja {
  font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  color: #2c2c2c;
}

.name-sub {
  font-size: 0.82rem;
  color: #888;
  margin: 0;
  margin-top: 0.1rem;
  font-family: 'Noto Sans KR', sans-serif;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
  white-space: nowrap;
  font-family: 'Noto Sans KR', sans-serif;
}

.meta-value {
  font-size: 0.88rem;
  color: #444;
  font-family: 'Noto Sans KR', sans-serif;
}

.member-sns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.sns-link {
  font-size: 0.78rem;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  border: 1.5px solid;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s, background 0.2s;
  font-family: 'Noto Sans KR', sans-serif;
}

.sns-link:hover {
  opacity: 0.75;
}
</style>
