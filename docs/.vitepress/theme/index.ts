import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import Flashcard from '../components/Flashcard.vue'
import Quiz from '../components/Quiz.vue'
import RomajiToggle from '../components/RomajiToggle.vue'
import StudyDashboard from '../components/StudyDashboard.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
    app.component('Flashcard', Flashcard)
    app.component('Quiz', Quiz)
    app.component('RomajiToggle', RomajiToggle)
    app.component('StudyDashboard', StudyDashboard)
  },
}
