import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingBag, 
  Globe2, 
  ShieldCheck, 
  HeartHandshake, 
  Leaf, 
  Sparkles,
  MapPin,
  CheckCircle2,
  Award,
  ChevronRight
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';

// Six Curated Image-Based Categories as per specification
const CATEGORIES = [
  {
    id: 'spices',
    title: 'Spices & Condiments',
    categoryQuery: 'Spices',
    description: 'True Ceylon cinnamon, whole black pepper & fragrant cardamom',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
    tag: 'Export Grade'
  },
  {
    id: 'tea',
    title: 'Tea & Beverages',
    categoryQuery: 'Tea',
    description: 'High-grown silver tips, orthodox black tea & single-estate infusions',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    tag: 'Lion Logo Pure Ceylon'
  },
  {
    id: 'wellness',
    title: 'Health & Wellness',
    categoryQuery: 'Spices',
    description: 'Ancient Ayurvedic herbal tonics, virgin coconut oil & herbal elixirs',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    tag: '100% Natural'
  },
  {
    id: 'crafts',
    title: 'Handicrafts & Art',
    categoryQuery: 'Crafts',
    description: 'Traditional Kaduru carved masks, brassware & Dumbara loom tapestries',
    image: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=800&q=80',
    tag: 'Master Artisan'
  },
  {
    id: 'lifestyle',
    title: 'Home & Lifestyle',
    categoryQuery: 'Crafts',
    description: 'Eco-friendly coconut crafts, handcrafted ceramics & heritage homeware',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    tag: 'Sustainable'
  },
  {
    id: 'textiles',
    title: 'Textiles & Apparel',
    categoryQuery: 'Apparel',
    description: 'Hand-dyed wax batik sarongs, pure organic cottons & artisanal linens',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    tag: 'Heritage Handloom'
  },
];

// Four Marketplace Benefits
const BENEFITS = [
  {
    icon: Globe2,
    title: 'Islandwide & International Shipping',
    description: 'From Sri Lanka to the world.',
    detail: 'Inspected, tracked export air-freight across 65+ countries.'
  },
  {
    icon: ShieldCheck,
    title: 'Authentic & Quality Assured',
    description: 'Certified local products.',
    detail: 'Verified geographical origin and master artisan certificates.'
  },
  {
    icon: HeartHandshake,
    title: 'Support Local Producers',
    description: 'Empowering Sri Lankan communities.',
    detail: 'Direct fair-trade returns directly to island growers & creators.'
  },
  {
    icon: Leaf,
    title: 'Sustainable & Ethical',
    description: 'People, Culture, Environment.',
    detail: 'Regenerative farming and ancestral technique preservation.'
  },
];

// Verified Local Producers
const PRODUCERS = [
  {
    name: 'Ceylon Heritage Crafts Guild',
    region: 'Kandy & Central Highlands',
    specialty: 'Hand-carved Kaduru masks, timber ornaments & brass relics',
    image: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=600&q=80',
    established: 'Est. 1984',
    badge: 'Heritage Master'
  },
  {
    name: 'Ruhuna Smallholder Tea Guild',
    region: 'Southern Rainforest Foothills',
    specialty: 'Low-grown orthodox black teas with sweet caramel notes',
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
    established: 'Est. 1996',
    badge: 'Rainforest Certified'
  },
  {
    name: 'Matale Spice Valley Farmers',
    region: 'Matale & Central Valley',
    specialty: 'Alba grade true cinnamon quills & highland black pepper',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
    established: 'Est. 2002',
    badge: 'Organic Origin'
  }
];

/**
 * SERENDIP Redesigned Homepage
 * Follows the Sri Lankan Heritage Brand Identity:
 * - 60% Warm Ivory (#F9F6EF)
 * - 25% Heritage Green (#315D4F)
 * - 10% Soft Beige (#E9E4D7)
 * - 5% Antique Gold (#A48B57)
 */
export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');

  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await api.getProducts();
        if (mounted) {
          setProducts(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Unable to connect to marketplace catalog';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFeaturedProducts = useMemo(() => {
    if (selectedCategoryTab === 'ALL') {
      return products.slice(0, 8);
    }
    return products.filter((p) => p.category.toLowerCase() === selectedCategoryTab.toLowerCase()).slice(0, 8);
  }, [products, selectedCategoryTab]);

  return (
    <div className="bg-[#F9F6EF] text-[#222B1F] space-y-20 sm:space-y-28 pb-24">

      {/* ========================================================================= */}
      {/* SECTION B: HERO SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E9E4D7]/70 via-[#F9F6EF] to-[#F9F6EF] pt-12 pb-16 sm:py-24 border-b border-[#D6CBB5]/60">
        
        {/* Subtle decorative background watermark rings */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-[#D6CBB5]/40 pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full border border-[#A48B57]/20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Side: Brand Narrative & CTAs */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9E4D7] border border-[#D6CBB5]">
                <span className="w-2 h-2 rounded-full bg-[#A48B57]" />
                <span className="text-[11px] font-bold tracking-[0.25em] text-[#315D4F] uppercase">
                  SRI LANKAN HERITAGE
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#222B1F] leading-[1.18]">
                Connecting Sri Lankan Products with{' '}
                <span className="text-[#A48B57] italic font-serif relative">
                  the World.
                  <svg className="absolute left-0 -bottom-1 w-full h-2 text-[#A48B57]/40" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="text-[#7A755D] text-base sm:text-lg leading-relaxed max-w-xl font-normal">
                A digital marketplace for authentic Sri Lankan local products, crafted by our communities. Direct from island masters to international doorsteps.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-semibold text-sm transition-all duration-300 shadow-heritage border border-[#A48B57]/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4 text-[#BD9F75]" />
                  Explore Products
                  <ArrowRight className="w-4 h-4 text-[#BD9F75]" />
                </Link>

                <a
                  href="#story"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#E9E4D7] hover:bg-[#D6CBB5]/60 text-[#315D4F] font-semibold text-sm transition-all duration-300 border border-[#D6CBB5]"
                >
                  Our Story
                </a>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#D6CBB5]/60 text-left">
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#315D4F]">100%</div>
                  <div className="text-[11px] text-[#7A755D] uppercase tracking-wider font-semibold">Origin Verified</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#315D4F]">Fair Trade</div>
                  <div className="text-[11px] text-[#7A755D] uppercase tracking-wider font-semibold">Artisan Returns</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#315D4F]">65+</div>
                  <div className="text-[11px] text-[#7A755D] uppercase tracking-wider font-semibold">Countries Shipped</div>
                </div>
              </div>

            </div>

            {/* Right Side: Organic Curved Sri Lankan Heritage Photography */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative Gold & Green Backdrop Frame */}
                <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-tr from-[#315D4F]/20 via-[#A48B57]/20 to-transparent blur-sm -rotate-1" />

                {/* Main Hero Mosaic Composition */}
                <div className="relative grid grid-cols-12 gap-3.5 sm:gap-4 p-3 bg-[#E9E4D7]/70 rounded-[2.2rem] border border-[#D6CBB5] shadow-elevated">
                  
                  {/* Primary Large Image: Sigiriya & Tropical Ceylon Highlands */}
                  <div className="col-span-8 relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D6CBB5]/80 group">
                    <img
                      src="https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80"
                      alt="Sigiriya Rock Fortress and Sri Lankan Central Highlands"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#BD9F75] block">
                        Ancient Ceylon
                      </span>
                      <h4 className="font-serif text-sm font-semibold leading-tight">
                        Sigiriya & Highland Spice Plantations
                      </h4>
                    </div>
                  </div>

                  {/* Secondary Stack: Spices & Artisan Teas */}
                  <div className="col-span-4 flex flex-col gap-3.5 sm:gap-4">
                    {/* Ceylon Cinnamon & Spices */}
                    <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#D6CBB5]/80 group">
                      <img
                        src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=500&q=80"
                        alt="Organic Ceylon Cinnamon Quills"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-[#BD9F75] block">
                          Spices
                        </span>
                        <p className="font-serif text-[11px] font-medium leading-none">
                          True Cinnamon
                        </p>
                      </div>
                    </div>

                    {/* Handcrafted Master Artisan Craft */}
                    <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#D6CBB5]/80 group">
                      <img
                        src="https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=500&q=80"
                        alt="Traditional Sri Lankan Handcarved Mask"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-[#BD9F75] block">
                          Heritage
                        </span>
                        <p className="font-serif text-[11px] font-medium leading-none">
                          Kaduru Craft
                        </p>
                      </div>
                    </div>
                  </div>


                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION C: MARKETPLACE BENEFITS                                           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] p-6 sm:p-7 rounded-2xl border border-[#D6CBB5] hover:border-[#A48B57] hover:shadow-premium transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Elegant Antique Gold Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#A48B57] group-hover:bg-[#315D4F] group-hover:text-[#BD9F75] group-hover:border-[#A48B57] transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-bold text-[#222B1F] group-hover:text-[#315D4F] transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#A48B57] tracking-wide">
                      {benefit.description}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#7A755D] mt-3 leading-relaxed pt-3 border-t border-[#D6CBB5]/40">
                  {benefit.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION D: PRODUCT CATEGORIES                                             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
            Islandwide Guilds
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#222B1F] tracking-tight">
            Explore Our Categories
          </h2>
          <div className="w-16 h-0.5 bg-[#A48B57] mx-auto mt-2" />
          <p className="text-[#7A755D] text-xs sm:text-sm mt-3">
            Handcrafted Ceylon teas, certified gemstones, organic spices, and generational artisan goods.
          </p>
        </div>

        {/* 6 Image-Based Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.categoryQuery}`}
              className="group relative h-80 rounded-2xl overflow-hidden border border-[#D6CBB5] hover:border-[#A48B57] shadow-subtle hover:shadow-elevated transition-all duration-500 block"
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
              />

              {/* Dark subtle image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:via-black/25 transition-all duration-300" />

              {/* Top Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#315D4F]/90 text-[#F9F6EF] border border-[#A48B57]/50 backdrop-blur-xs">
                  {cat.tag}
                </span>
              </div>

              {/* Bottom Content Details */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white z-10 space-y-1.5">
                <h3 className="font-serif text-xl sm:text-2xl font-bold group-hover:text-[#BD9F75] transition-colors flex items-center justify-between">
                  <span>{cat.title}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#A48B57] flex items-center justify-center text-white transition-all transform group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4 text-[#F9F6EF]" />
                  </div>
                </h3>
                <p className="text-xs text-white/75 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION E: FEATURED PRODUCTS                                              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-8 border-b border-[#D6CBB5]">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
              Curated Harvests & Masterpieces
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#222B1F] tracking-tight">
              Featured Products
            </h2>
            <p className="text-[#7A755D] text-xs sm:text-sm">
              Direct from verified Sri Lankan estates and certified island craftspeople.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            {['ALL', 'Tea', 'Spices', 'Gems', 'Crafts', 'Apparel'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategoryTab === tab
                    ? 'bg-[#315D4F] text-[#F9F6EF] border border-[#A48B57]'
                    : 'bg-[#E9E4D7] text-[#222B1F] hover:bg-[#D6CBB5] border border-transparent'
                }`}
              >
                {tab === 'ALL' ? 'All Items' : tab}
              </button>
            ))}

            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315D4F] hover:text-[#19372E] ml-2 group"
            >
              Browse all
              <ArrowRight className="w-3.5 h-3.5 text-[#A48B57] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Dynamic Catalog Cards Loading / Error / Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#D6CBB5] p-4 space-y-3 animate-pulse">
                <div className="aspect-square bg-[#E9E4D7] rounded-xl" />
                <div className="h-4 bg-[#E9E4D7] rounded w-2/3" />
                <div className="h-4 bg-[#E9E4D7] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-[#D6CBB5] rounded-2xl p-8 text-center max-w-md mx-auto shadow-subtle">
            <p className="text-sm font-semibold text-[#222B1F]">{error}</p>
            <p className="text-xs text-[#7A755D] mt-1">Please ensure your backend service is running.</p>
          </div>
        ) : filteredFeaturedProducts.length === 0 ? (
          <div className="bg-white border border-[#D6CBB5] rounded-2xl p-12 text-center max-w-md mx-auto shadow-subtle">
            <p className="text-sm text-[#7A755D]">No products found in this category.</p>
            <button
              onClick={() => setSelectedCategoryTab('ALL')}
              className="mt-3 text-xs font-semibold text-[#315D4F] underline"
            >
              View all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredFeaturedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>


      {/* ========================================================================= */}
      {/* SECTION F.1: DISCOVER LOCAL PRODUCERS                                     */}
      {/* ========================================================================= */}
      <section id="producers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="bg-[#E9E4D7]/70 rounded-[2.5rem] border border-[#D6CBB5] p-8 sm:p-12 space-y-10">
          
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
              Meet the Masters
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#222B1F] tracking-tight">
              Discover Local Producers
            </h2>
            <p className="text-[#7A755D] text-xs sm:text-sm">
              We connect you directly with rural cooperatives, estate smallholders, and generational craft guilds across Sri Lanka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCERS.map((producer, i) => (
              <div 
                key={i} 
                className="bg-[#FFFFFF] rounded-2xl border border-[#D6CBB5] overflow-hidden hover:border-[#A48B57] transition-all duration-300 hover:shadow-premium group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-[#E9E4D7]">
                    <img 
                      src={producer.image} 
                      alt={producer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 bg-[#315D4F] text-[#F9F6EF] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#A48B57]/50">
                      {producer.badge}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#A48B57] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#315D4F]" />
                      <span>{producer.region}</span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-[#222B1F] group-hover:text-[#315D4F] transition-colors">
                      {producer.name}
                    </h3>

                    <p className="text-xs text-[#7A755D] leading-relaxed">
                      {producer.specialty}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#D6CBB5]/40 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-[#ADA78A] font-medium">{producer.established}</span>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#315D4F] hover:text-[#19372E]"
                  >
                    View Harvests
                    <ChevronRight className="w-3.5 h-3.5 text-[#A48B57]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>

      </section>


      {/* ========================================================================= */}
      {/* SECTION F.2: FEATURED SRI LANKAN SEALS & MARKS                            */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 border-y border-[#D6CBB5] flex flex-wrap items-center justify-around gap-8 text-center text-[#7A755D]">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#315D4F]">
              <Award className="w-5 h-5 text-[#A48B57]" />
            </div>
            <div className="text-left">
              <span className="font-serif text-xs font-bold text-[#222B1F] block">Pure Ceylon Tea Lion Seal</span>
              <span className="text-[10px] text-[#ADA78A] uppercase tracking-wider">100% Origin Guaranteed</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#315D4F]">
              <Sparkles className="w-5 h-5 text-[#A48B57]" />
            </div>
            <div className="text-left">
              <span className="font-serif text-xs font-bold text-[#222B1F] block">Certified Ceylon Gemstones</span>
              <span className="text-[10px] text-[#ADA78A] uppercase tracking-wider">National Gem & Jewellery Auth</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#315D4F]">
              <CheckCircle2 className="w-5 h-5 text-[#A48B57]" />
            </div>
            <div className="text-left">
              <span className="font-serif text-xs font-bold text-[#222B1F] block">Pure Ceylon Cinnamon</span>
              <span className="text-[10px] text-[#ADA78A] uppercase tracking-wider">Cinnamomum Verum Certified</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9E4D7] border border-[#D6CBB5] flex items-center justify-center text-[#315D4F]">
              <HeartHandshake className="w-5 h-5 text-[#A48B57]" />
            </div>
            <div className="text-left">
              <span className="font-serif text-xs font-bold text-[#222B1F] block">Fair Trade Community</span>
              <span className="text-[10px] text-[#ADA78A] uppercase tracking-wider">Direct Village Reinvestment</span>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION F.3 & F.4: WHY CHOOSE SERENDIP & OUR HERITAGE STORY               */}
      {/* ========================================================================= */}
      <section id="story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A48B57] block">
                Our Heritage & Mission
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#315D4F]/10 text-[#315D4F] border border-[#315D4F]/20 text-[10px] font-bold uppercase tracking-wider">
                2500+ Years of Heritage
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#222B1F] tracking-tight leading-tight">
              From Ancient Ceylon Trade Routes to Your Doorstep.
            </h2>
            <p className="text-[#7A755D] text-sm sm:text-base leading-relaxed">
              For centuries, merchants, explorers, and navigators called Sri Lanka <em>Serendib</em> — an island of unexpected fortune, fragrant spices, and matchless treasures. Today, SERENDIP honors that legacy by creating a transparent, ethical bridge connecting local Sri Lankan producers with conscious buyers worldwide.
            </p>
          </div>

          {/* Why Choose SERENDIP Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            
            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#D6CBB5] space-y-1.5">
              <h4 className="font-serif text-sm font-bold text-[#315D4F]">1. Direct Fair Trade</h4>
              <p className="text-xs text-[#7A755D] leading-relaxed">
                Eliminating predatory middlemen; the vast majority of purchase proceeds flow straight to the village families who craft and harvest.
              </p>
            </div>

            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#D6CBB5] space-y-1.5">
              <h4 className="font-serif text-sm font-bold text-[#315D4F]">2. Island Origin Proof</h4>
              <p className="text-xs text-[#7A755D] leading-relaxed">
                Every tea batch, gemstone, and cinnamon quill is inspected for authentic geographic origin and pure Ceylon grade standards.
              </p>
            </div>

            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#D6CBB5] space-y-1.5">
              <h4 className="font-serif text-sm font-bold text-[#315D4F]">3. Export-Grade Packing</h4>
              <p className="text-xs text-[#7A755D] leading-relaxed">
                Hermetically sealed and thoughtfully protected with biodegradable materials to maintain mountain estate freshness across air routes.
              </p>
            </div>

            <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#D6CBB5] space-y-1.5">
              <h4 className="font-serif text-sm font-bold text-[#315D4F]">4. Preserving Ancestral Craft</h4>
              <p className="text-xs text-[#7A755D] leading-relaxed">
                Every order funds apprentice workshops for dying craft techniques like Dumbara mat weaving and traditional mask sculpture.
              </p>
            </div>

          </div>

          <div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#315D4F] hover:bg-[#19372E] text-[#F9F6EF] font-semibold text-xs tracking-wider uppercase transition-all shadow-md"
            >
              Experience the Marketplace
              <ArrowRight className="w-4 h-4 text-[#BD9F75]" />
            </Link>
          </div>

        </div>

      </section>

    </div>
  );
};
