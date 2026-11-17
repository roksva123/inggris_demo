import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { loadContent, submitTrial } from './api.js'
import { createScene } from './scene.js'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)]
let lenis
let lenisTicker
let motionContext
let programMedia
let resizeHandler
let initPromise

const createProgramCard = (program, index) => `
  <article class="program-card program-card--${program.accent}" data-cursor="Daftar">
    <div class="program-card__top"><span>0${index + 1}</span><span>${program.level}</span></div>
    <div class="program-object object--${program.accent}" aria-hidden="true"><span>${index === 0 ? '∑' : index === 1 ? 'π' : index === 2 ? 'A' : index === 3 ? '✓' : '文'}</span></div>
    <div class="program-card__body"><h3>${program.name}</h3><p>${program.description}</p><div class="program-card__meta"><strong>${program.price}</strong><span>${program.duration}</span></div><a href="#trial" class="card-link">Daftar <i>↗</i></a></div>
  </article>`

const createTutorCard = (tutor, index) => `
  <article class="tutor-card tutor-card--${tutor.color}" data-cursor="Kenalan">
    <div class="tutor-card__portrait"><span>${tutor.initials}</span><b>0${index + 1}</b></div>
    <div class="tutor-card__info"><div><h3>${tutor.name}</h3><span class="subject-pill">${tutor.subject}</span></div><p>${tutor.bio}</p></div>
  </article>`

const createTestimonial = (item) => `
  <article class="testimonial"><div class="testimonial__quote">“</div><blockquote>${item.quote}</blockquote><div class="testimonial__person"><span>${item.name}</span><small>${item.role}</small></div><strong>${item.result}</strong></article>`

const showContentError = () => {
  const status = $('#content-status')
  if (!status) return
  status.hidden = false
  status.innerHTML = '<strong>Konten belum tersedia.</strong><span>Coba muat ulang untuk menghubungkan kembali.</span><button type="button" id="content-retry">Coba lagi</button>'
  $('#content-retry')?.addEventListener('click', () => window.location.reload())
}

const renderContent = ({ programs, testimonials, tutors, stats }) => {
  const rail = $('#program-rail')
  const select = $('#program-select')
  if (rail) rail.innerHTML = programs.map(createProgramCard).join('')
  if (select) select.innerHTML = `<option value="">Pilih program</option>${programs.map((program) => `<option value="${program.id}">${program.name}</option>`).join('')}`
  const tutorGrid = $('#tutor-grid')
  const testimonialTrack = $('#testimonial-track')
  const statsGrid = $('#stats-grid')
  if (tutorGrid) tutorGrid.innerHTML = tutors.map(createTutorCard).join('')
  if (testimonialTrack) testimonialTrack.innerHTML = testimonials.map(createTestimonial).join('')
  if (statsGrid) statsGrid.innerHTML = stats.map((stat) => `<div class="stat"><strong data-value="${stat.value}" data-suffix="${stat.suffix}">0${stat.suffix}</strong><span>${stat.label}</span></div>`).join('')
}

const setupPreloader = () => {
  const preloader = $('#preloader')
  const counter = $('#loader-count')
  const line = $('#loader-line')
  if (!preloader || !counter || !line) return
  let alreadyLoaded = false
  try { alreadyLoaded = sessionStorage.getItem('rt-loaded') === 'true' } catch { alreadyLoaded = false }
  if (alreadyLoaded || prefersReduced) { preloader.classList.add('is-done'); return }
  let value = 0
  const timer = setInterval(() => {
    value += Math.ceil(Math.random() * 9)
    if (value >= 100) {
      value = 100
      clearInterval(timer)
      setTimeout(() => {
        preloader.classList.add('is-done')
        try { sessionStorage.setItem('rt-loaded', 'true') } catch {}
      }, 420)
    }
    counter.textContent = value
    line.style.width = `${value}%`
  }, 45)
}

const setupSmoothScroll = () => {
  if (prefersReduced || matchMedia('(hover: none)').matches) return
  lenis = new Lenis({ duration: 1.15, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  lenisTicker = (time) => lenis?.raf(time * 1000)
  gsap.ticker.add(lenisTicker)
  gsap.ticker.lagSmoothing(0)
  $$('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const target = $(link.getAttribute('href'))
    if (target) { event.preventDefault(); lenis.scrollTo(target, { offset: -16 }) }
  }))
}

const setupReveals = () => {
  const targets = gsap.utils.toArray('.section-heading, .why__intro, .reason, .programs__header, .results__head, .stat, .testimonial, .tutors__intro, .tutor-card, .trial__copy, .trial-form, .footer__top')
  targets.forEach((element) => gsap.set(element, { autoAlpha: 0, y: 34 }))
  targets.forEach((element) => gsap.to(element, {
    autoAlpha: 1,
    y: 0,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: { trigger: element, start: 'top 85%', once: true },
  }))
  window.setTimeout(() => targets.forEach((element) => gsap.set(element, { autoAlpha: 1, y: 0 })), 3000)
}

const setupProgramPin = () => {
  programMedia?.revert()
  programMedia = gsap.matchMedia()
  const section = $('#programs')
  const rail = $('#program-rail')
  if (!section || !rail || !rail.children.length || prefersReduced) return

  programMedia.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (context) => {
    const { desktop, mobile } = context.conditions
    if (desktop) {
      const distance = () => rail.scrollWidth - window.innerWidth
      gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          id: 'programs-horizontal',
          trigger: section,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          end: () => `+=${distance()}`,
          onRefresh: () => console.debug('[ScrollTrigger] total triggers:', ScrollTrigger.getAll().length),
        },
      })
    }
    if (mobile) gsap.set(rail, { clearProps: 'transform' })
    return () => gsap.killTweensOf(rail)
  })
}

const setupMotion = () => {
  motionContext?.revert()
  if (programMedia) programMedia.revert()
  if (prefersReduced) {
    document.documentElement.classList.add('reduced-motion')
    $$('.section-heading, .why__intro, .reason, .programs__header, .results__head, .stat, .testimonial, .tutors__intro, .tutor-card, .trial__copy, .trial-form, .footer__top').forEach((element) => gsap.set(element, { clearProps: 'all', autoAlpha: 1, y: 0 }))
    return
  }
  motionContext = gsap.context(() => {
    setupReveals()
    gsap.to('.marquee__track', { xPercent: -18, ease: 'none', scrollTrigger: { trigger: '.marquee', scrub: 1, invalidateOnRefresh: true } })
    gsap.to('.results-marquee__track', { skewX: 5, xPercent: -14, ease: 'none', scrollTrigger: { trigger: '.results-marquee', scrub: 1, invalidateOnRefresh: true } })
    setupProgramPin()
  }, document.body)
  setupCounters()
  setupSlider()
}

const setupCounters = () => {
  $$('.stat strong').forEach((counter) => {
    const value = Number(counter.dataset.value)
    const suffix = counter.dataset.suffix
    const state = { current: 0 }
    ScrollTrigger.create({ trigger: counter, start: 'top 85%', once: true, onEnter: () => gsap.to(state, { current: value, duration: 1.5, ease: 'power2.out', onUpdate: () => { counter.textContent = `${Math.round(state.current).toLocaleString('id-ID')}${suffix}` } }) })
  })
}

const setupSlider = () => {
  const track = $('#testimonial-track')
  if (!track || track.dataset.ready === 'true') return
  track.dataset.ready = 'true'
  let isDown = false
  let startX = 0
  let scrollLeft = 0
  const progress = $('#slider-progress')
  const updateProgress = () => { if (progress) progress.style.width = `${Math.min(100, (track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth)) * 100 + 14)}%` }
  const down = (event) => { isDown = true; startX = event.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; track.classList.add('is-dragging') }
  const up = () => { isDown = false; track.classList.remove('is-dragging') }
  const move = (event) => { if (!isDown) return; event.preventDefault(); track.scrollLeft = scrollLeft - (event.pageX - track.offsetLeft - startX) * 1.4; updateProgress() }
  track.addEventListener('mousedown', down)
  addEventListener('mouseup', up)
  track.addEventListener('mouseleave', up)
  track.addEventListener('mousemove', move)
  track.addEventListener('scroll', updateProgress, { passive: true })
  $('#testimonial-prev')?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.75, behavior: 'smooth' }))
  $('#testimonial-next')?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' }))
}

const setupCursor = () => {
  if (matchMedia('(pointer: coarse)').matches) return
  const cursor = $('#cursor')
  if (!cursor) return
  addEventListener('pointermove', (event) => { cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)` })
  document.addEventListener('mouseover', (event) => { const target = event.target.closest('[data-cursor]'); cursor.dataset.label = target?.dataset.cursor || ''; cursor.classList.toggle('is-label', Boolean(target)) })
}

const setupTrialForm = () => {
  const form = $('#trial-form')
  const error = $('#form-error')
  const success = $('#trial-success')
  if (!form || !error || !success || form.dataset.ready === 'true') return
  form.dataset.ready = 'true'
  $$('input, select', form).forEach((field) => field.addEventListener('focus', () => {
    window.setTimeout(() => field.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }))
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); error.textContent = ''
    const payload = Object.fromEntries(new FormData(form).entries())
    if (!payload.name.trim() || payload.phone.trim().length < 8 || !payload.grade || !payload.program) { error.textContent = 'Lengkapi semua detail dulu, ya.'; return }
    const button = $('button', form); button.disabled = true; button.querySelector('span').textContent = 'Mengirim...'
    try { await submitTrial(payload); form.hidden = true; success.hidden = false; spawnConfetti() } catch { error.textContent = 'Ada kendala sebentar. Coba lagi ya.'; button.disabled = false; button.querySelector('span').textContent = 'Kirim & jadwalkan trial' }
  })
}

const spawnConfetti = () => {
  const colors = ['#F4EFE6', '#1F3D2B', '#F2B705', '#14110F']
  const area = $('.trial')
  if (!area) return
  for (let i = 0; i < 18; i += 1) { const shape = document.createElement('i'); shape.className = 'confetti'; shape.style.left = `${45 + Math.random() * 40}%`; shape.style.top = `${20 + Math.random() * 30}%`; shape.style.background = colors[i % colors.length]; shape.style.setProperty('--x', `${(Math.random() - 0.5) * 300}px`); shape.style.setProperty('--y', `${-80 - Math.random() * 180}px`); shape.style.setProperty('--r', `${Math.random() * 360}deg`); area.appendChild(shape); setTimeout(() => shape.remove(), 1800) }
}

const cleanup = () => {
  motionContext?.revert()
  programMedia?.revert()
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  if (lenisTicker) gsap.ticker.remove(lenisTicker)
  lenis?.destroy()
  lenis = undefined
  lenisTicker = undefined
  if (resizeHandler) {
    removeEventListener('resize', resizeHandler)
    removeEventListener('orientationchange', resizeHandler)
  }
  resizeHandler = undefined
}

const init = async () => {
  if (initPromise) return initPromise
  initPromise = (async () => {
    window.__ruangTumbuhCleanup?.()
    setupPreloader()
    setupSmoothScroll()
    setupCursor()
    setupTrialForm()
    createScene()
    try {
      const content = await loadContent()
      renderContent(content)
      await document.fonts.ready
      setupMotion()
      ScrollTrigger.refresh()
      window.setTimeout(() => ScrollTrigger.refresh(), 250)
      resizeHandler = () => {
        window.clearTimeout(resizeHandler.timer)
        resizeHandler.timer = window.setTimeout(() => {
          setupMotion()
          ScrollTrigger.refresh()
        }, 180)
      }
      addEventListener('resize', resizeHandler)
      addEventListener('orientationchange', resizeHandler)
    } catch (error) {
      console.error(error)
      document.body.classList.add('api-error')
      showContentError()
    }
    window.__ruangTumbuhCleanup = cleanup
  })()
  return initPromise
}

const boot = () => init()
if (document.readyState === 'complete') boot()
else addEventListener('load', boot, { once: true })
