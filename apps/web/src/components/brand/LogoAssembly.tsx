"use client";
import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";

const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stages = ["Shapes emerge", "Find their place", "A name takes shape", "Your world. HIMATU."];
const pieces = [[0,0,1000,1060],[1000,0,1000,960],[0,1060,1000,940],[1000,960,1000,1040]];
const letters = [[270,280],[550,95],[645,310],[955,255],[1210,204],[1414,260]];

export function LogoAssembly({ create = false }: { create?: boolean }) {
  const id = useId().replaceAll(":", "");
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const visible = useRef(false);
  const userPaused = useRef(false);
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  useLayoutEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let observer: IntersectionObserver | undefined;
    const context = gsap.context(() => {
      const shapes = gsap.utils.toArray<SVGGElement>("[data-logo-piece]", root.current!);
      const glyphs = root.current!.querySelectorAll("[data-logo-letter]");
      const starts = [{x:-270,y:-170,rotation:-32},{x:250,y:-130,rotation:55},{x:-220,y:160,rotation:-55},{x:240,y:220,rotation:32}];
      const sequence = gsap.timeline({ paused:true, repeat:-1, repeatDelay:1.8, onStart: () => { setStage(0); setPaused(false); }, onRepeat: () => setStage(0) });
      timeline.current = sequence;
      shapes.forEach((shape,index) => sequence.set(shape, { ...starts[index], scale:.8, opacity:0, transformOrigin:"50% 50%" }, 0));
      sequence.set(glyphs, { opacity:0, y:35 }, 0)
        .to(shapes, { opacity:1, duration:.55, stagger:.12 }, .15)
        .call(() => setStage(1), [], .9)
        .to(shapes, { x:0,y:0,rotation:0,scale:1,duration:1.45,stagger:.13,ease:"power3.inOut" }, .65)
        .call(() => setStage(2), [], 2.55)
        .to(glyphs, { opacity:1,y:0,duration:.55,stagger:.12,ease:"power3.out" }, 2.55)
        .fromTo(".logo-assembly-sheen", { xPercent:-140,opacity:0 }, { xPercent:140,opacity:.38,duration:1.2,ease:"power2.inOut" }, 3.1)
        .to(".logo-assembly-sheen", { opacity:0,duration:.3 }, 4.1)
        .call(() => setStage(3), [], 4.15)
        .fromTo(".logo-assembly-emblem", { filter:"drop-shadow(0 0 0px currentColor)" }, { filter:"drop-shadow(0 0 9px currentColor)",duration:.35,yoyo:true,repeat:1 }, 4.15);
      observer = new IntersectionObserver(entries => {
        visible.current = entries[0].isIntersecting;
        if (visible.current && !userPaused.current) sequence.resume(); else sequence.pause();
      }, { threshold:.12 });
      observer.observe(root.current!);
    }, root);
    return () => { observer?.disconnect(); timeline.current = null; context.revert(); };
  }, [reduced]);
  useLayoutEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) timeline.current?.pause();
      else if (visible.current && !paused) timeline.current?.resume();
    };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => document.removeEventListener("visibilitychange", pauseHidden);
  }, [paused]);
  const still = Boolean(reduced);
  return <div className="logo-assembly" ref={root} data-motion={still ? "still" : "playing"}>
    <div className="logo-assembly-topline"><span>HIMATU / {create ? "BECOME PART OF THE STORY" : "WELCOME TO YOUR WORLD"}</span><span aria-hidden="true">0{(still ? 3 : stage) + 1} / 04</span></div>
    <div className="logo-assembly-stage" role="img" aria-label="The four shapes of the HIMATU emblem assemble above the HIMATU wordmark">
      <div className="logo-assembly-orbit" aria-hidden="true" />
      <svg className="logo-assembly-emblem" viewBox="450 240 1100 1550" aria-hidden="true">
        <defs><mask id={`${id}-mark`} maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000" style={{maskType:"luminance"}}><image href="/images/brand/originals/HIMATU-MAIN.png" width="2000" height="2000" /></mask>
          {pieces.map(([x,y,width,height],index) => <clipPath id={`${id}-piece-${index}`} key={index}><rect x={x} y={y} width={width} height={height} /></clipPath>)}
        </defs>
        {pieces.map((_,index) => <g key={index} data-logo-piece="" className="logo-assembly-piece"><g clipPath={`url(#${id}-piece-${index})`}><rect width="2000" height="2000" fill="currentColor" mask={`url(#${id}-mark)`} /></g></g>)}
      </svg>
      <div className="logo-assembly-name"><svg viewBox="270 385 1400 305" aria-hidden="true"><defs><mask id={`${id}-name`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080" style={{maskType:"luminance"}}><image href="/images/brand/originals/HIMATU-LOGO-NAME-VW.png" width="1920" height="1080" /></mask>{letters.map(([x,width],index)=><clipPath key={index} id={`${id}-letter-${index}`}><rect x={x} y="380" width={width} height="320" /></clipPath>)}</defs>{letters.map((_,index)=><g key={index} data-logo-letter="" className="logo-assembly-letter"><g clipPath={`url(#${id}-letter-${index})`}><rect width="1920" height="1080" fill="currentColor" mask={`url(#${id}-name)`} /></g></g>)}</svg><span className="logo-assembly-sheen" aria-hidden="true" /></div>
    </div>
    <motion.div className="logo-assembly-story" key={still ? "complete" : stage} initial={still?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:still?0:.3}}><p className="eyebrow">{stages[still ? 3 : stage]}</p><h2>{create ? <>Every collection<br />starts with connection.</> : <>Your favourites.<br />Your next chapter.</>}</h2><p>Figures. Stories. A world that feels like you.</p></motion.div>
    <div className="logo-assembly-bottom"><div className="logo-assembly-steps" aria-hidden="true">{stages.map((name,index)=><span key={name} className={index<=(still?3:stage)?"is-active":""} />)}</div>{!still && <div className="logo-assembly-controls"><button type="button" aria-label={paused?"Play HIMATU logo animation":"Pause HIMATU logo animation"} onClick={()=>{if(paused)timeline.current?.resume();else timeline.current?.pause();userPaused.current=!paused;setPaused(!paused);}}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>}</div>
    <noscript><img src="/images/brand/signature-light.webp" alt="HIMATU" width="240" height="182" /></noscript>
  </div>;
}
