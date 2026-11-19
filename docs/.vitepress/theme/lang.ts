// lang="ja" for Japanese strings inside this Korean site (#201): screen readers switch to a Japanese voice and the
// Korean keep-all line breaking is lifted (style.css exempts :lang(ja)). A string counts as Japanese when it has
// kana or kanji and no Hangul — mixed Korean+Japanese lines stay lang=ko. Use as :lang="jaLang(text)".
const JA = /[ぁ-ヿ一-鿿]/
const KO = /[가-힣]/
export const jaLang = (s?: string | null): 'ja' | undefined => (s && JA.test(s) && !KO.test(s) ? 'ja' : undefined)
