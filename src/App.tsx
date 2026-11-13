import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { categories, initialVariant, money } from './menu';
import type { CategoryId, Drink, Variant } from './menu';
import { Penguin, StaticDrink } from './Brand';
import { useCategoryTransition } from './useCategoryTransition';

gsap.registerPlugin(MorphSVGPlugin);
const DrinkScene = lazy(() => import('./DrinkScene'));
const INTRO_KEY = 'cut-cafe-intro-seen-v2';
const shapes = {
 bean:'M277 37C398 14 496 105 472 231C450 351 342 430 229 446C104 463 39 381 65 262C89 151 167 57 277 37Z',
 leaf:'M277 37C374 13 470 27 487 45C505 160 458 300 357 383C259 462 124 462 65 416C29 306 72 160 172 88C209 62 245 45 277 37Z',
 drop:'M277 37C307 95 485 224 480 326C475 418 378 458 272 456C148 454 64 410 65 316C66 216 238 88 277 37Z'
};
function prefersReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function shouldIntroduce() { try { return !prefersReducedMotion() && !sessionStorage.getItem(INTRO_KEY); } catch { return !prefersReducedMotion(); } }
function useReducedMotion() {
 const [reduced, setReduced] = useState(prefersReducedMotion);
 useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
 return reduced;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function App() {
 const [selectedId, setSelectedId] = useState('black');
 const [expandedId, setExpandedId] = useState<string | null>('black');
 const [variants, setVariants] = useState<Record<string, Variant>>({});
 const [paused, setPaused] = useState(false);
 const [staticView, setStaticView] = useState(false);
 const [intro, setIntro] = useState(shouldIntroduce);
 const [sceneReady, setSceneReady] = useState(false);
 const [webgl, setWebgl] = useState(false);
 const [visible, setVisible] = useState(true);
 const [tabVisible, setTabVisible] = useState(!document.hidden);
 const reduced = useReducedMotion();
 const motion = !reduced && !paused;
 const rootRef = useRef<HTMLDivElement>(null);
 const wipeRef = useRef<HTMLDivElement>(null);
 const introRef = useRef<HTMLDivElement>(null);
 const skipRef = useRef<HTMLButtonElement>(null);
 const headingRef = useRef<HTMLHeadingElement>(null);
 const stageRef = useRef<HTMLDivElement>(null);
 const shapeRef = useRef<SVGPathElement>(null);
 const groupRef = useRef<HTMLDivElement>(null);
 const listRef = useRef<HTMLDivElement>(null);
 const commitCategory = useCallback((id: CategoryId) => {
  const first = categories.find(c => c.id === id)!.items[0].id;
  setSelectedId(first); setExpandedId(first);
  if (groupRef.current && window.scrollY > 100) groupRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
 }, []);
 const { displayedId, requestedId, transitioning, chooseCategory } = useCategoryTransition({ motion, wipeRef, onCommit: commitCategory });
 const category = categories.find(c => c.id === displayedId)!;
 const selected = category.items.find(d => d.id === selectedId) || category.items[0];
 const variant = variants[selected.id] || initialVariant;
 const index = categories.indexOf(category);
 const finishIntro = useCallback(() => {
  const wasFocused = introRef.current?.contains(document.activeElement);
  setIntro(false);
  if (wasFocused) requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
 }, []);
 useEffect(() => {
  try { const gl = document.createElement('canvas').getContext('webgl2'); setWebgl(!!gl); gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { setWebgl(false); }
  const timer = setTimeout(() => setSceneReady(true), 80);
  const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '60px' });
  if (stageRef.current) observer.observe(stageRef.current);
  const visibility = () => setTabVisible(!document.hidden);
  document.addEventListener('visibilitychange', visibility);
  return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
 }, []);
 useEffect(() => {
  if (!intro) return;
  if (!motion) { finishIntro(); return; }
  try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* Storage is optional. */ }
  skipRef.current?.focus({ preventScroll: true });
  const ctx = gsap.context(() => {
   gsap.timeline({ onComplete: finishIntro })
    .fromTo('.intro-word', { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: 'power3.out' })
    .to('.intro-top', { xPercent: -5, duration: .55, ease: 'power3.inOut' }, .45)
    .to('.intro-bottom', { xPercent: 5, duration: .55, ease: 'power3.inOut' }, '<')
    .to('.intro-caption', { opacity: 1, duration: .3 }, .7)
    .to(introRef.current, { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: .5, ease: 'power4.inOut' }, 1.05);
  }, introRef);
  return () => ctx.revert();
 }, [intro, motion, finishIntro]);
 useEffect(() => {
  if (!intro) return;
  const previous = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  return () => { document.documentElement.style.overflow = previous; };
 }, [intro]);
 useEffect(() => {
  if (intro || !motion) return;
  const ctx = gsap.context(() => {
   gsap.fromTo('.category-title .title-line', { yPercent: 105 }, { yPercent: 0, duration: .7, ease: 'power4.out', stagger: .07, clearProps: 'transform' });
   gsap.fromTo('.category-deck', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, clearProps: 'all' });
   gsap.fromTo('.drink-row, .tea-label', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .035, clearProps: 'all' });
  }, rootRef);
  return () => ctx.revert();
 }, [displayedId, intro, motion]);
 useEffect(() => {
  const tween = gsap.to(shapeRef.current, { morphSVG: shapes[category.shape], duration: motion ? .8 : 0, ease: 'power2.inOut', overwrite: true });
  return () => { tween.kill(); };
 }, [category.shape, motion]);
 const selectDrink = (drink: Drink) => { setSelectedId(drink.id); setExpandedId(id => id === drink.id ? null : drink.id); };
 const updateVariant = (drink: Drink, key: keyof Variant, value: Variant[keyof Variant]) => {
  setSelectedId(drink.id); setExpandedId(drink.id);
  setVariants(previous => ({ ...previous, [drink.id]: { ...(previous[drink.id] || initialVariant), [key]: value } }));
 };
 const renderDrink = (drink: Drink, i: number) => {
  const current = variants[drink.id] || initialVariant;
  const open = expandedId === drink.id;
  return <article key={drink.id} className={`drink-row ${selected.id === drink.id ? 'is-selected' : ''}`}>
   <button className="drink-select" onClick={() => selectDrink(drink)} aria-expanded={open} aria-controls={`description-${drink.id}`} aria-pressed={selected.id === drink.id}>
    <span className="drink-number">{String(i + 1).padStart(2, '0')}</span><span className="drink-name">{drink.name}</span><span className="leader" aria-hidden="true"/><span className="drink-price">{money(drink.price)}</span><span className="row-plus" aria-hidden="true">{open ? '−' : '+'}</span>
   </button>
   <div className="description-reveal" id={`description-${drink.id}`} hidden={!open}><p>{drink.note}</p></div>
   {drink.variants && <div className="variants"><div className="variant-options" role="group" aria-label={`Nhiệt độ ${drink.name}`}>{(['hot', 'cold'] as const).map(t => <button key={t} aria-pressed={current.temperature === t} onClick={() => updateVariant(drink, 'temperature', t)}>{t === 'hot' ? 'Nóng' : 'Lạnh'}</button>)}</div><div className="variant-options" role="group" aria-label={`Loại sữa ${drink.name}`}>{(['dairy', 'oat'] as const).map(m => <button key={m} aria-pressed={current.milk === m} onClick={() => updateVariant(drink, 'milk', m)}>{m === 'dairy' ? 'Sữa tươi' : 'Sữa yến mạch'}</button>)}</div></div>}
  </article>;
 };
 return <div ref={rootRef} className="site" data-paused={!motion} data-category={displayedId} data-transitioning={transitioning} style={{ '--bg': category.background, '--accent': category.accent } as CSSProperties}>
  <div className="site-content" inert={intro}>
   <a className="skip-link" href="#drink-list">Đến danh sách món</a>
   <header className="header"><a className="brand" href="#home" aria-label="Cụt Cafe — đầu trang">Cụt <span>Cafe</span><span className="brand-period">.</span></a><span className="header-tagline">Ghé Cụt, nhấp một chút.</span><a className="menu-badge" href="#drink-list" aria-label="Đến danh sách món"><span/> MENU · 19 MÓN ↘</a></header>
   <main className="experience" id="home" ref={groupRef}>
    <section className="category-intro" aria-labelledby="category-title"><div className="section-kicker"><span>THỰC ĐƠN CỦA CỤT</span><span className="category-counter">0{index + 1} <i>/ 05</i></span></div><h1 id="category-title" className="category-title" tabIndex={-1} ref={headingRef}><span className="title-mask"><span className="title-line">{category.name}</span></span><span className="title-period" aria-hidden="true">.</span></h1><div className="category-deck"><span className="category-english">{category.english}</span><p>{category.description}</p></div></section>
    <aside className="showcase" aria-label="Đồ uống đang khám phá"><div className="showcase-inner" ref={stageRef}>
     <div className="stage-topline"><span>MỘT NGỤM, MỘT NIỀM VUI.</span><span className="stage-cross" aria-hidden="true">+</span></div>
     <div className="drink-stage"><div className="studio-glow"/><svg className="morph-background" viewBox="0 0 540 500" aria-hidden="true"><path ref={shapeRef} d={shapes.bean}/></svg><span className="stage-watermark" aria-hidden="true">{category.english}</span><div className="canvas-wrap"><SceneBoundary fallback={<StaticDrink drink={selected} variant={variant}/>}><Suspense fallback={<StaticDrink drink={selected} variant={variant}/>}>{sceneReady && webgl && !staticView ? <DrinkScene drink={selected} variant={variant} category={category} reduced={!motion} active={visible && tabVisible} intro={intro}/> : <StaticDrink drink={selected} variant={variant}/>}</Suspense></SceneBoundary></div><span className="stage-bottom-cross" aria-hidden="true">+</span><span className="stage-side-note">PHA MỘT CHÚT THƯƠNG</span></div>
     <div className="preview-caption"><div className="preview-eyebrow"><span>LỰA CHỌN CỦA BẠN</span><span>GIÁ DEMO</span></div><div className="preview-name" aria-live="polite"><span>{selected.name}</span><span className="preview-price">{money(selected.price)}</span></div><p>{selected.variants ? `${variant.temperature === 'cold' ? 'Lạnh' : 'Nóng'} · ${variant.milk === 'dairy' ? 'Sữa tươi' : 'Sữa yến mạch'}` : selected.note}</p></div>
     <div className="scene-tools"><button onClick={() => setStaticView(value => !value)} aria-pressed={staticView}>{staticView ? '↗ Xem bản 3D' : '◇ Xem bản tĩnh'}</button><button onClick={() => setPaused(value => !value)} aria-pressed={paused} disabled={reduced}>{reduced ? 'Đã giảm chuyển động' : paused ? '▶ Bật chuyển động' : 'Ⅱ Tạm dừng chuyển động'}</button></div>
    </div></aside>
    <section className="menu-list-section" aria-label={`Danh sách ${category.name}`}><div className="list-heading"><span>CHỌN MỘT CHÚT ĐÚNG GU</span><span>{String(category.items.length).padStart(2, '0')} MÓN</span></div><div id="drink-list" ref={listRef} className="drink-list">{displayedId === 'tea' ? (['oolong', 'jasmine'] as const).map(base => <div key={base} className="tea-group"><h2 className="tea-label"><span/>Nền trà {base === 'oolong' ? 'ô long' : 'lài'}</h2>{category.items.filter(d => d.teaBase === base).map(d => renderDrink(d, category.items.indexOf(d)))}</div>) : category.items.map(renderDrink)}</div><div className="menu-note"><span aria-hidden="true">✳</span><p><strong>Giá minh họa — bản demo</strong><br/>Biến thể sữa chưa tính phụ thu. Hình ảnh đồ uống được cách điệu.</p></div></section>
   </main>
   <footer><div className="footer-note"><Penguin/><div><p>Một góc nhỏ.<br/><span>Một chút bình yên.</span></p><span className="footer-brand">Cụt Cafe</span></div></div><div className="footer-details"><span>CÀ PHÊ · MATCHA · CACAO · TRÀ</span><a href="#home">VỀ ĐẦU TRANG ↗</a></div></footer>
   <nav className="category-dock" aria-label="Nhóm đồ uống"><div className="dock-inner">{categories.map((c, i) => <button key={c.id} aria-pressed={requestedId === c.id} onClick={() => chooseCategory(c.id)}><span className="dock-index">0{i + 1}</span>{c.name}</button>)}</div></nav>
  </div>
  <div ref={wipeRef} className="category-wipe" aria-hidden="true"><span>Cụt Cafe</span></div>
  {intro && <div ref={introRef} className="intro" role="dialog" aria-modal="true" aria-label="Chào mừng đến Cụt Cafe" onKeyDown={event => { if (event.key === 'Escape') finishIntro(); if (event.key === 'Tab') { event.preventDefault(); skipRef.current?.focus(); } }}><span className="intro-corner">A LITTLE SIP OF JOY</span><div className="intro-logo"><span className="intro-word intro-top" aria-hidden="true">Cụt Cafe</span><span className="intro-word intro-bottom" aria-hidden="true">Cụt Cafe</span><span className="intro-caption">Ghé Cụt, nhấp một chút.</span></div><button ref={skipRef} className="intro-skip" onClick={finishIntro}>Bỏ qua ↗</button><span className="intro-bottom-note">MỘT GÓC NHỎ. MỘT NGỤM VUI.</span></div>}
 </div>;
}
