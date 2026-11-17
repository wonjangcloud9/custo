import { h, defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Quiz from '../components/Quiz.vue'
import GlobalFx from '../components/GlobalFx.vue'
import SearchPalette from '../components/SearchPalette.vue'
import YtLite from '../components/YtLite.vue'
import NotFound404 from '../components/NotFound404.vue'
import './style.css'

// Page-specific (and data-heavy) components are split into their own chunks so each page only
// downloads what it renders — the shared theme bundle stays small.
const lazy = {
  VideoArchive: () => import('../components/VideoArchive.vue'),
  MemberProfile: () => import('../components/MemberProfile.vue'),
  MemberGrid: () => import('../components/MemberGrid.vue'),
  HomeHub: () => import('../components/HomeHub.vue'),
  JourneyToTop: () => import('../components/JourneyToTop.vue'),
  ScheduleBoard: () => import('../components/ScheduleBoard.vue'),
  DiscoShelf: () => import('../components/DiscoShelf.vue'),
  BirthdayRing: () => import('../components/BirthdayRing.vue'),
  LikesAlbum: () => import('../components/LikesAlbum.vue'),
  UnitLab: () => import('../components/UnitLab.vue'),
  PenlightOcean: () => import('../components/PenlightOcean.vue'),
  MemberMatch: () => import('../components/MemberMatch.vue'),
  NewsFeed: () => import('../components/NewsFeed.vue'),
  CutieLand: () => import('../components/CutieLand.vue'),
  StarterQuest: () => import('../components/StarterQuest.vue'),
  KohakuSpecial: () => import('../components/KohakuSpecial.vue'),
  VideoStats: () => import('../components/VideoStats.vue'),
  MemberTable: () => import('../components/MemberTable.vue'),
  KoreaHub: () => import('../components/KoreaHub.vue'),
  TourStamps: () => import('../components/TourStamps.vue'),
  AboutHub: () => import('../components/AboutHub.vue'),
  StagesHub: () => import('../components/StagesHub.vue'),
  WorldMap: () => import('../components/WorldMap.vue'),
  SongStory: () => import('../components/SongStory.vue'),
  SongList: () => import('../components/SongList.vue'),
  MemberStory: () => import('../components/MemberStory.vue'),
  NextCards: () => import('../components/NextCards.vue'),
}

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'layout-top': () => h(GlobalFx),
    'nav-bar-content-before': () => h(SearchPalette),
    'not-found': () => h(NotFound404),
  }),
  enhanceApp({ app }) {
    app.component('Quiz', Quiz)
    app.component('YtLite', YtLite)
    for (const [name, loader] of Object.entries(lazy)) app.component(name, defineAsyncComponent(loader))
  },
}
