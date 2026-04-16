import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import Flashcard from '../components/Flashcard.vue'
import Quiz from '../components/Quiz.vue'
import RomajiToggle from '../components/RomajiToggle.vue'
import StudyDashboard from '../components/StudyDashboard.vue'
import SrsFlashcard from '../components/SrsFlashcard.vue'
import WordBookmark from '../components/WordBookmark.vue'
import BookmarkList from '../components/BookmarkList.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
    app.component('Flashcard', Flashcard)
    app.component('Quiz', Quiz)
    app.component('RomajiToggle', RomajiToggle)
    app.component('StudyDashboard', StudyDashboard)
    app.component('SrsFlashcard', SrsFlashcard)
    app.component('WordBookmark', WordBookmark)
    app.component('BookmarkList', BookmarkList)
  },
}
