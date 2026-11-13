import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { categories, initialVariant, money } from './menu';
import type { CategoryId, Drink, Variant } from './menu';

gsap.registerPlugin(MorphSVGPlugin);
const DrinkScene = lazy(() => import('./DrinkScene'));
const shapes = {
 bean:'M 277 37 C 398 14 496 105 472 231 C 450 351 342 430 229 446 C 104 463 39 381 65 262 C 89 151 167 57 277 37 Z',
 leaf:'M 277 37 C 374 13 470 27 487 45 C 505 160 458 300 357 383 C 259 462 124 462 65 416 C 29 306 72 160 172 88 C 209 62 245 45 277 37 Z',
 drop:'M 277 37 C 307 95 485 224 480 326 C 475 418 378 458 272 456 C 148 454 64 410 65 316 C 66 216 238 88 277 37 Z'
};

export function Penguin({ className = '' }: { className?: string }) {
 return <svg className={className} viewBox="0 0 72 82" fill="none" aria-hidden="true"><path d="M18 65C11 56 12 41 15 28C17 9 27 4 36 4C46 4 56 10 58 29C61 44 60 58 54 65" fill="currentColor"/><path d="M18 39C5 44 1 54 5 56C8 58 15 53 20 48M54 39C67 44 71 54 67 56C64 58 57 53 52 48" fill="currentColor"/><ellipse cx="36" cy="48" rx="17" ry="24" fill="#F6F0E5"/><ellipse cx="28" cy="25" rx="5" ry="7" fill="#F6F0E5"/><ellipse cx="44" cy="25" rx="5" ry="7" fill="#F6F0E5"/><circle cx="29" cy="26" r="2" fill="currentColor"/><circle cx="43" cy="26" r="2" fill="currentColor"/><path d="m30 34 6 7 6-7" fill="#C88952"/><path d="M31 70c-14-3-19 7-13 8h14M41 70c14-3 19 7 13 8H40" fill="#C88952"/></svg>;
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={diagonal ? { transform:'rotate(-45deg)' }:undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg>; }
export function DrinkFallback({ drink }: { drink: Drink }) {
 return <svg viewBox="0 0 400 440" className="drink-fallback" aria-label={`Minh họa ${drink.name}`} role="img"><defs><linearGradient id="glass" x2="1" y2=".4"><stop stopColor="#fff" stopOpacity=".8"/><stop offset=".5" stopColor="#fff" stopOpacity=".1"/><stop offset="1" stopColor="#fff" stopOpacity=".6"/></linearGradient></defs><ellipse cx="203" cy="379" rx="95" ry="14" fill="#30241f" opacity=".1"/>{drink.coconut ? <><ellipse cx="200" cy="260" rx="105" ry="115" fill={drink.color}/><ellipse cx="200" cy="170" rx="78" ry="24" fill="#f5e9c9"/><path d="m220 170 20-92 35-10" stroke="#c88952" strokeWidth="10" fill="none"/></> : <g transform="rotate(9 200 230)"><path d="M103 117h194l-22 240q-75 25-150 0z" fill={drink.color}/>{drink.milk && <path d="m114 242 11 115q75 25 150 0l10-115z" fill="#e8cf9e"/>}<path d="M103 117h194l-22 240q-75 25-150 0z" fill="url(#glass)" stroke="#fff" strokeWidth="3"/><ellipse cx="200" cy="117" rx="97" ry="19" fill={drink.cream?'#f7e6c6':drink.color} stroke="#fff" strokeWidth="3"/>{[145,192,235].map((x,i)=><rect key={x} x={x} y={105+i*12} width="37" height="36" rx="7" fill="#fff" opacity=".35" transform={`rotate(${i*13} ${x} 125)`}/>)}<rect x="156" y="220" width="88" height="65" rx="30" fill="#f6f0e5"/><text x="200" y="259" textAnchor="middle" fill="#30241f" fontSize="25" fontFamily="serif" fontWeight="bold">cụt.</text></g>}</svg>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
 state = { failed:false }; static getDerivedStateFromError() { return {failed:true}; }
 render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function useReducedMotion() {
 const [reduced,setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'); const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);return reduced;
}

export default function App() {
 const [categoryId,setCategoryId] = useState<CategoryId>('coffee');
 const category = categories.find(c=>c.id===categoryId)!;
 const [selectedId,setSelectedId] = useState('black');
 const selected = category.items.find(d=>d.id===selectedId) || category.items[0];
 const [variants,setVariants] = useState<Record<string,Variant>>({});
 const variant = variants[selected.id] || initialVariant;
 const [sceneReady,setSceneReady] = useState(false);
 const [webgl,setWebgl] = useState(false);
 const [visible,setVisible] = useState(true);
 const [tabVisible,setTabVisible] = useState(!document.hidden);
 const [motionPaused,setMotionPaused] = useState(false);
 const [staticView,setStaticView] = useState(false);
 const reduced = useReducedMotion();
 const motion = !reduced && !motionPaused;
 const shapeRef=useRef<SVGPathElement>(null);
 const listRef=useRef<HTMLDivElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  try { const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');setWebgl(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch {setWebgl(false);}
  const timer=setTimeout(()=>setSceneReady(true),150);
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'80px'});if(stageRef.current)observer.observe(stageRef.current);
  const visibility=()=>setTabVisible(!document.hidden);document.addEventListener('visibilitychange',visibility);
  return()=>{clearTimeout(timer);observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  const ctx=gsap.context(()=>{if(!reduced)gsap.from('.reveal',{y:24,opacity:0,stagger:.11,duration:.9,ease:'power3.out',clearProps:'all'});},rootRef);return()=>ctx.revert();
 },[reduced]);
 useEffect(()=>{
  if(!shapeRef.current)return;
  const tween=gsap.to(shapeRef.current,{morphSVG:shapes[category.shape],duration:motion?.85:0,ease:'power2.inOut',overwrite:true});return()=>{tween.kill();};
 },[category.shape,motion]);
 useEffect(()=>{
  if(!listRef.current||!motion)return;
  const ctx=gsap.context(()=>gsap.fromTo('.drink-row, .tea-label',{y:12,opacity:0},{y:0,opacity:1,duration:.35,stagger:.045,clearProps:'all'}),listRef);return()=>ctx.revert();
 },[categoryId,motion]);
 const chooseCategory=(id:CategoryId)=>{setCategoryId(id);setSelectedId(categories.find(c=>c.id===id)!.items[0].id);};
 const updateVariant=(drink:Drink,key:keyof Variant,value:Variant[keyof Variant])=>{setSelectedId(drink.id);setVariants(v=>({...v,[drink.id]:{...(v[drink.id]||initialVariant),[key]:value}}));};
 const renderDrink=(drink:Drink,index:number)=>{
  const current=variants[drink.id]||initialVariant;
  return <article className={`drink-row ${drink.id===selected.id?'is-selected':''}`} key={drink.id}>
   <button className="drink-select" onClick={()=>setSelectedId(drink.id)} aria-pressed={drink.id===selected.id}>
    <span className="drink-number">{String(index+1).padStart(2,'0')}</span><span className="drink-copy"><span className="drink-name">{drink.name}{drink.id==='salt-cream'&&<span className="little-star" aria-hidden="true">✳</span>}</span><span className="drink-note">{drink.note}</span></span><span className="drink-price">{money(drink.price)}</span><span className="select-arrow"><Arrow diagonal /></span>
   </button>
   {drink.variants&&<div className="variants"><div className="variant-options" role="group" aria-label={`Nhiệt độ ${drink.name}`}>{(['hot','cold'] as const).map(t=><button key={t} aria-pressed={current.temperature===t} onClick={()=>updateVariant(drink,'temperature',t)}>{t==='hot'?'Nóng':'Lạnh'}</button>)}</div><span className="variant-divider"/><div className="variant-options" role="group" aria-label={`Loại sữa ${drink.name}`}>{(['dairy','oat'] as const).map(m=><button key={m} aria-pressed={current.milk===m} onClick={()=>updateVariant(drink,'milk',m)}>{m==='dairy'?'Sữa tươi':'Sữa yến mạch'}</button>)}</div></div>}
  </article>;
 };
 return <div ref={rootRef} className="site" data-paused={!motion} style={{'--accent':category.accent} as CSSProperties}>
  <a href="#menu" className="skip-link">Đến thực đơn</a>
  <header className="header"><a className="brand" href="#home" aria-label="Cụt Cụt Cafe — đầu trang"><Penguin/><span>cụt cụt<span className="brand-small">CAFE & A LITTLE JOY</span></span></a><nav aria-label="Điều hướng chính"><a className="nav-menu" href="#menu">Thực đơn <span>↗</span></a><a href="#little-note" className="nav-note">Một chút về Cụt</a></nav><span className="header-note"><span/> CHẬM MỘT NHỊP. VUI MỘT CHÚT.</span></header>
  <main id="home"><div className="experience">
   <section className="hero" aria-labelledby="hero-title"><div className="eyebrow reveal"><span className="tiny-line"/> MỘT GÓC NHỎ, NHIỀU NIỀM VUI</div><h1 id="hero-title" className="reveal">Ghé Cụt,<br/><em>nhấp một chút.</em><span className="title-spark" aria-hidden="true">✳</span></h1><p className="hero-description reveal">Một chút đậm đà. Một chút ngọt ngào.<br/>Một món đúng gu, cho một ngày thật êm.</p><a className="primary-button reveal" href="#menu">Khám phá menu <span><Arrow diagonal/></span></a><div className="hero-footnote reveal"><span className="drawn-heart" aria-hidden="true">♡</span> Pha chút vui vào mỗi ngày.</div></section>
   <aside className="showcase" aria-label="Đồ uống đang khám phá"><div className="showcase-inner" ref={stageRef}>
    <div className="showcase-topline"><span>A LITTLE SIP OF JOY</span><span>YOUR DAILY LITTLE JOY</span></div>
    <div className="drink-stage"><svg className="morph-background" viewBox="0 0 540 500" aria-hidden="true"><path ref={shapeRef} d={shapes.bean}/></svg><div className="orbit" aria-hidden="true"/><span className="floating-spark spark-one" aria-hidden="true">✳</span><span className="floating-spark spark-two" aria-hidden="true">+</span><span className="handwritten" aria-hidden="true">một ngụm<br/>là thấy vui <svg viewBox="0 0 70 50"><path d="M8 5q45-7 42 30m-12-6 12 8 10-10"/></svg></span>
     <div className="canvas-wrap"><SceneBoundary fallback={<DrinkFallback drink={selected}/>}><Suspense fallback={<DrinkFallback drink={selected}/>}>{sceneReady&&webgl&&!staticView?<DrinkScene drink={selected} variant={variant} reduced={!motion} active={visible&&tabVisible}/>:<DrinkFallback drink={selected}/>}</Suspense></SceneBoundary></div>
     <div className="round-seal" aria-hidden="true"><span>PHA CHÚT VUI</span><Penguin/><span>NHẤP CHÚT ÊM</span></div>
    </div>
    <div className="preview-caption"><span className="preview-index">{category.english}<span> / ĐANG KHÁM PHÁ</span></span><div className="preview-name" aria-live="polite">{selected.name}<span>{money(selected.price)}</span></div><p>{selected.variants?`${variant.temperature==='cold'?'Lạnh':'Nóng'} · ${variant.milk==='dairy'?'Sữa tươi':'Sữa yến mạch'}`:selected.note}</p></div>
    <div className="scene-tools"><button onClick={()=>setStaticView(v=>!v)} aria-pressed={staticView}>{staticView?'↗ Xem bản 3D':'◇ Xem bản tĩnh'}</button><button onClick={()=>setMotionPaused(v=>!v)} aria-pressed={motionPaused} disabled={reduced}>{reduced?'Đã giảm chuyển động':motionPaused?'▶ Bật chuyển động':'Ⅱ Tạm dừng chuyển động'}</button></div>
   </div></aside>
   <section id="menu" className="menu" aria-labelledby="menu-title"><div className="menu-heading"><div><div className="eyebrow">THE LITTLE MENU</div><h2 id="menu-title">Hôm nay, uống gì?</h2></div><span className="menu-count">19 món<br/><span>một chút cho mỗi gu</span></span></div>
    <div className="category-tabs" role="group" aria-label="Nhóm đồ uống">{categories.map((c,i)=><button key={c.id} aria-pressed={categoryId===c.id} onClick={()=>chooseCategory(c.id)}><span className="tab-number">0{i+1}</span>{c.name}{categoryId===c.id&&<span className="tab-dot"/>}</button>)}</div>
    <div className="category-heading"><span className="eyebrow">{category.eyebrow}</span><h3>{category.title.split('\n').map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>)}</h3><p>{category.description}</p></div>
    <div className="drink-list" ref={listRef}>{categoryId==='tea'?<>{(['oolong','jasmine'] as const).map(base=><div key={base}><h4 className="tea-label"><span/>Nền trà {base==='oolong'?'ô long':'lài'}</h4>{category.items.filter(d=>d.teaBase===base).map(d=>renderDrink(d,category.items.indexOf(d)))}</div>)}</>:category.items.map(renderDrink)}</div>
    <div className="menu-note"><span>✳</span><p><strong>Giá minh họa — bản demo</strong><br/>Biến thể sữa chưa tính phụ thu. Hình ảnh mang tính cách điệu.</p></div>
   </section>
  </div>
  <section className="little-note" id="little-note"><span className="note-star" aria-hidden="true">✳</span><div><span className="eyebrow">MỘT CHÚT VỀ CỤT</span><h2>Chẳng cần vội.<br/><em>Cứ nhấp một chút thôi.</em></h2><p>Cụt dành một góc nhỏ cho những niềm vui giản dị.<br/>Chọn món bạn thích, để ngày nhẹ nhàng hơn một chút.</p></div><Penguin className="note-penguin"/></section>
  </main><footer><div className="footer-top"><span>CÀ PHÊ · MATCHA · CACAO · TRÀ</span><a href="#home">Lên đầu trang <span>↗</span></a></div><div className="footer-wordmark">cụt cụt<span>✳</span></div><div className="footer-bottom"><span>MỘT GÓC NHỎ. MỘT NGỤM VUI.</span><span>Cụt Cụt Cafe · Menu demo</span><span>ĐƯỢC PHA BẰNG MỘT CHÚT THƯƠNG ♡</span></div></footer>
 </div>;
}
