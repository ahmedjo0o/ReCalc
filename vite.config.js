import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { homeContent } from './src/i18n/homeContent.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Writes the English home-page information (what reCalc is, how it works,
// FAQ) into index.html, inside #root. Visitors never see it: the app replaces
// it as soon as it starts. It is there so that anything reading the raw page
// (search engines, the AdSense review) finds real content, not an empty box.
function staticHomeContent() {
  const c = homeContent.en
  const html = [
    '<main style="max-width:760px;margin:0 auto;padding:24px 16px;font-family:sans-serif">',
    '<h1>reCalc: your receipt calculator</h1>',
    `<h2>${esc(c.title)}</h2>`,
    `<p>${esc(c.intro)}</p>`,
    `<h3>${esc(c.howTitle)}</h3><ol>`,
    ...c.how.map((s) => `<li><strong>${esc(s.title)}</strong>: ${esc(s.text)}</li>`),
    `</ol><h3>${esc(c.featuresTitle)}</h3><ul>`,
    ...c.features.map((f) => `<li>${esc(f)}</li>`),
    `</ul><h3>${esc(c.faqTitle)}</h3>`,
    ...c.faq.map((f) => `<h4>${esc(f.q)}</h4><p>${esc(f.a)}</p>`),
    '<p><a href="/how-to-use/">How to use reCalc</a> · <a href="/blog.html">Blog</a> · <a href="/about.html">About</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/contact.html">Contact</a></p>',
    '</main>',
  ].join('')
  return {
    name: 'static-home-content',
    transformIndexHtml: (page) => page.replace('<!--home-content-->', html),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), staticHomeContent()],
})
