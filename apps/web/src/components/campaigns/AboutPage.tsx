import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Layers3, MessageCircle, Package } from "lucide-react";
import { BrandStory } from "./BrandStory";

const figurePhoto = "/images/figures/862314978_122155859979356138_1917160491667365230_n.jpg";

const pillars = [
  { title: "Find your character", text: "Explore figures and collectibles by the stories you love, from anime to comics and cinema.", Icon: Heart },
  { title: "Collect your way", text: "Discover action figures, keychains, display swords, T-shirts and more in one place.", Icon: Layers3 },
  { title: "See the details", text: "Browse product photographs, prices and available details before adding something to your collection.", Icon: Package },
  { title: "Stay connected", text: "Have a question about an item or a custom idea? Talk with the HIMATU team directly.", Icon: MessageCircle },
];

export function AboutPage() {
  return <div className="about-page">
    <header className="about-hero">
      <Image src={figurePhoto} alt="HIMATU collectible figure photographed for the collection" fill priority sizes="100vw" />
      <div className="about-hero-copy"><p className="eyebrow">THE WORLD BEHIND HIMATU</p><h1>FOR THE LOVE<br />OF COLLECTING.</h1><p>Characters stay with us. HIMATU gives them a place in our everyday world.</p><a href="#about-story" aria-label="Scroll to our story" className="about-scroll">↓</a></div>
    </header>
    <section id="about-story" className="about-intro">
      <div><p className="eyebrow">OUR STORY</p><h2>YOUR FANDOM.<br /><span>YOUR SPACE.</span></h2><p>HIMATU is a Bangladesh-based home for people who love characters and the stories behind them. We bring figures, accessories and custom ideas together so you can discover pieces that feel personal.</p><p>Whether you are arranging your first shelf or looking for the next addition, we want browsing to feel as enjoyable as collecting.</p><Link href="/collections" className="text-link">EXPLORE COLLECTIONS <ArrowUpRight size={17} /></Link></div>
      <div className="about-intro-image"><Image src={figurePhoto} alt="Luffy figure with sculpted display effects, photographed for HIMATU" fill sizes="(max-width:767px) 100vw, 45vw" /></div>
    </section>
    <section className="about-pillars"><div className="about-section-heading"><p className="eyebrow">WHAT YOU’LL FIND HERE</p><h2>MORE THAN A PLACE TO SHOP.</h2><p>Find a story, choose a form, and make it part of your space.</p></div><div className="about-pillar-grid">{pillars.map(({title,text,Icon},index) => <article key={title}><span>0{index + 1}</span><Icon size={27} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="about-contact"><p className="eyebrow">LET’S KEEP THE CONVERSATION GOING</p><h2>YOUR NEXT DISCOVERY STARTS HERE.</h2><div><Link href="/shop" className="button button--primary">SHOP THE COLLECTION <ArrowUpRight size={17} /></Link><Link href="/contact" className="button button--outline">CONTACT HIMATU <ArrowUpRight size={17} /></Link></div></section>
    <BrandStory />
  </div>;
}
