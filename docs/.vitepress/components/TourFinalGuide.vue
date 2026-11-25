<script setup lang="ts">
import { computed } from 'vue'
import { useClock } from '../theme/today'

// Tour FINAL weekend memo (#275) — shown until the last show's day ends.
// Sources (checked 2026-11-25): official tour page /feature/autumntour (OPEN/START, goods pre-sale, FC booth,
// CD lottery, rules) · IG Arena /access/ and /faq/ (stations, address, parking, lockers, construction notice).
const TOUR = 'https://cutiestreet.asobisystem.com/feature/autumntour'
const LOTTERY = 'https://cutiestreet.asobisystem.com/news/detail/96912'
const ACCESS = 'https://www.ig-arena.jp/access/'
const FAQ = 'https://www.ig-arena.jp/faq/'
const MAP = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('IGアリーナ 名古屋市北区名城1丁目2-22')
const DAYS = [
  { day: '2026-11-28', label: '11.28 (土)', tag: 'DAY 1', steps: [['12:00', '굿즈 선행 판매'], ['16:00', 'OPEN 개장'], ['18:00', 'START 개연']] },
  { day: '2026-11-29', label: '11.29 (日)', tag: 'DAY 2 · FINAL', steps: [['11:30', '굿즈 선행 판매'], ['14:30', 'OPEN 개장'], ['16:30', 'START 개연']] },
]
const END = Date.parse('2026-11-30T00:00+09:00')
const now = useClock()
const show = computed(() => now.value === null || now.value < END)
const todayJst = computed(() => (now.value ? new Date(now.value + 9 * 3600e3).toISOString().slice(0, 10) : ''))
const at = (day: string, hm: string) => Date.parse(`${day}T${hm}+09:00`)
const stepState = (day: string, i: number, steps: string[][]) => {
  if (!now.value || todayJst.value !== day) return ''
  const s = at(day, steps[i][0]), next = steps[i + 1] ? at(day, steps[i + 1][0]) : Infinity
  return now.value >= next ? 'done' : now.value >= s ? 'now' : ''
}
</script>

<template>
  <section v-if="show" class="fg" aria-labelledby="fg-h">
    <header>
      <p class="eb">FINAL WEEKEND MEMO</p>
      <h3 id="fg-h">투어 FINAL 아이치 원정 메모 <Ico n="suitcase" duo /></h3>
      <p class="lead"><span lang="ja">IGアリーナ</span> 이틀 공연의 시간표와 가는 길을 공식 안내 기준으로 모았어요.</p>
    </header>

    <div class="days">
      <article v-for="d in DAYS" :key="d.day" class="day" :class="{ today: todayJst === d.day }">
        <p class="dh"><b>{{ d.label }}</b><em>{{ d.tag }}</em><span v-if="todayJst === d.day" class="tb">TODAY</span></p>
        <ol>
          <li v-for="(s, i) in d.steps" :key="s[0]" :class="stepState(d.day, i, d.steps)"><time>{{ s[0] }}</time><span>{{ s[1] }}</span><small v-if="stepState(d.day, i, d.steps) === 'now'">지금</small></li>
        </ol>
      </article>
    </div>

    <div class="cols">
      <div class="col">
        <p class="ch"><Ico n="gift" duo /> 현장에서</p>
        <ul>
          <li><b>굿즈</b> 선행 판매 시간엔 공연 티켓이 없어도 살 수 있어요. 개장 중·종연 후에도 판매 예정 (당일 상황에 따라 시간 변동)</li>
          <li><b>CD 예약 추첨회</b> 「<span lang="ja">CUTIE LAND</span>」 1장 예약마다 참가상 포스트카드 + 스크래치 3장 (1회 계산 최대 60장) · <a :href="LOTTERY" target="_blank" rel="noopener">경품 보기</a></li>
          <li><b>FC 부스</b> 굿즈 판매 시작부터 종연 후 약 30분까지 (예정, 공연 중엔 잠시 닫아요)</li>
          <li><b>매너</b> 객석 녹음·촬영 금지 · 영리 목적 양도·전매 금지</li>
        </ul>
      </div>
      <div class="col">
        <p class="ch"><Ico n="bus" duo /> 가는 길</p>
        <ul>
          <li><b lang="ja">名城公園駅</b> 지하철 메이조선, 나오면 바로 · <span lang="ja">名古屋駅</span>에서 지하철 약 15분</li>
          <li>그 밖에 <span lang="ja">名古屋城駅</span> 도보 10분 · <span lang="ja">浄心駅</span>(쓰루마이선)·<span lang="ja">名鉄 清水駅</span> 도보 약 18분</li>
          <li><b>주차장 없음</b>: 대중교통으로 오세요. 역 주변이 공사 중이라 종연 후 혼잡하면 다른 역으로 안내될 수 있어요</li>
          <li><b>코인로커</b> 장외 3곳·장내 3곳 (공연일만 · 현장 결제는 교통계 IC카드만)</li>
        </ul>
        <a class="map" :href="MAP" target="_blank" rel="noopener"><Ico n="pin" duo /> <span lang="ja">愛知県名古屋市北区名城1丁目2-22</span> · 지도</a>
      </div>
    </div>

    <p class="src"><Ico n="book" /> 출처: <a :href="TOUR" target="_blank" rel="noopener">공식 투어 페이지</a> · <a :href="ACCESS" target="_blank" rel="noopener"><span lang="ja">IGアリーナ</span> 액세스</a> · <a :href="FAQ" target="_blank" rel="noopener">FAQ</a> (2026.11.25 확인 · 당일 변경은 공식 X를 확인하세요)</p>
  </section>
</template>

<style scoped>
.fg { --ink: #2f1a35; margin: 22px 0 26px; padding: 22px; border-radius: 26px; color: var(--ink); background: #fff; box-shadow: inset 0 0 0 1.5px #ead7f3, 0 24px 44px -38px #4a2050; }
.eb { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #6d3fb0; }
h3 { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(21px, 2.6vw, 26px) !important; }
h3 .ico { color: #6d3fb0; }
.lead { margin: 6px 0 16px !important; font-size: 14px; color: #5a4060; }
.days { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.day { padding: 14px 16px; border-radius: 20px; background: linear-gradient(110deg, #f4ecff, #fff0f6); box-shadow: inset 0 0 0 1.5px #e2d0f2; }
.day.today { box-shadow: inset 0 0 0 2px #c2185b, 0 16px 30px -24px #c2185b; }
.dh { margin: 0 0 8px !important; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dh b { font-size: 16px; }
.dh em { font-style: normal; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; color: #6d3fb0; }
.tb { padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 900; color: #fff; background: #c2185b; }
.day ol { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; gap: 4px; }
.day li { margin: 0 !important; display: flex; align-items: baseline; gap: 10px; font-size: 14px; }
.day li time { flex: none; width: 3.2em; font-weight: 900; font-variant-numeric: tabular-nums; color: #4a2a6e; }
.day li.done { opacity: 0.5; }
.day li.now span { font-weight: 800; }
.day li small { padding: 0 7px; border-radius: 999px; font-size: 11px; font-weight: 900; color: #fff; background: #c2185b; }
.cols { margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 22px; }
.ch { margin: 4px 0 6px !important; font-size: 14px; font-weight: 900; color: #4a2a6e; }
.ch .ico { color: #6d3fb0; }
.col ul { margin: 0 !important; padding-left: 18px !important; font-size: 13.5px; line-height: 1.6; }
.col li { margin: 3px 0 !important; }
.col li b { color: #2f1a35; margin-right: 2px; }
.col a { color: #a33366 !important; }
.map { margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 800; text-decoration: none !important; background: #f4ecff; }
.src { margin: 14px 0 0 !important; font-size: 12.5px; color: #6a4f70; }
.src a { color: #a33366 !important; }
@media (max-width: 760px) { .days, .cols { grid-template-columns: minmax(0, 1fr); } .fg { padding: 18px 16px; } }
</style>
