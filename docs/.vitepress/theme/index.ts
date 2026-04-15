import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import Flashcard from '../components/Flashcard.vue'
import Quiz from '../components/Quiz.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
    app.component('Flashcard', Flashcard)
    app.component('Quiz', Quiz)
  },
}
