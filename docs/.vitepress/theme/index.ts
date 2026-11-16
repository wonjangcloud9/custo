import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Flashcard from '../components/Flashcard.vue'
import Quiz from '../components/Quiz.vue'
import RomajiToggle from '../components/RomajiToggle.vue'
import StudyDashboard from '../components/StudyDashboard.vue'
import SrsFlashcard from '../components/SrsFlashcard.vue'
import WordBookmark from '../components/WordBookmark.vue'
import BookmarkList from '../components/BookmarkList.vue'
import VideoArchive from '../components/VideoArchive.vue'
import MemberProfile from '../components/MemberProfile.vue'
import MemberGrid from '../components/MemberGrid.vue'
import HomeHub from '../components/HomeHub.vue'
import JourneyToTop from '../components/JourneyToTop.vue'
import ScheduleBoard from '../components/ScheduleBoard.vue'
import DiscoShelf from '../components/DiscoShelf.vue'
import BirthdayRing from '../components/BirthdayRing.vue'
import LikesAlbum from '../components/LikesAlbum.vue'
import UnitLab from '../components/UnitLab.vue'
import GlobalFx from '../components/GlobalFx.vue'
import SearchPalette from '../components/SearchPalette.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'layout-top': () => h(GlobalFx),
    'nav-bar-content-before': () => h(SearchPalette),
  }),
  enhanceApp({ app }) {
    app.component('Flashcard', Flashcard)
    app.component('Quiz', Quiz)
    app.component('RomajiToggle', RomajiToggle)
    app.component('StudyDashboard', StudyDashboard)
    app.component('SrsFlashcard', SrsFlashcard)
    app.component('WordBookmark', WordBookmark)
    app.component('BookmarkList', BookmarkList)
    app.component('VideoArchive', VideoArchive)
    app.component('MemberProfile', MemberProfile)
    app.component('MemberGrid', MemberGrid)
    app.component('HomeHub', HomeHub)
    app.component('JourneyToTop', JourneyToTop)
    app.component('ScheduleBoard', ScheduleBoard)
    app.component('DiscoShelf', DiscoShelf)
    app.component('BirthdayRing', BirthdayRing)
    app.component('LikesAlbum', LikesAlbum)
    app.component('UnitLab', UnitLab)
  },
}
