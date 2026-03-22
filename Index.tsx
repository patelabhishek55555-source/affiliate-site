import { useMemo, useState, lazy, Suspense } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductSection } from '@/components/ProductSection';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PriceFilter } from '@/components/PriceFilter';
import { ShoppingBag, Flame, TrendingUp } from 'lucide-react';

const AiAssistant = lazy(() => import('@/components/AiAssistant').then(m => ({ default: m.AiAssistant })));

const isPopular = (id: string) => {
  const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return hash % 3 === 0;
};

const Index = () => {
  const { data: products, isLoading, error } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.category))].sort();
  }, [products]);

  const priceExtents = useMemo<[number, number]>(() => {
    if (!products || products.length === 0) return [0, 1000];
    const prices = products.map((p) => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  useMemo(() => {
    setPriceRange(priceExtents);
  }, [priceExtents]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || p.category === category;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, search, category, priceRange]);

  const bestDeals = useMemo(() => {
    if (!filtered.length) return [];
    return [...filtered].sort((a, b) => a.price - b.price).slice(0, 4);
  }, [filtered]);

  const trending = useMemo(() => {
    if (!filtered.length) return [];
    return filtered.filter((p) => !bestDeals.some((d) => d.id === p.id)).slice(0, 4);
  }, [filtered, bestDeals]);

  const allOther = useMemo(() => {
    const shown = new Set([...bestDeals.map((p) => p.id), ...trending.map((p) => p.id)]);
    return filtered.filter((p) => !shown.has(p.id));
  }, [filtered, bestDeals, trending]);

  const getBadge = (product: { id: string; price: number }) => {
    if (bestDeals.some((d) => d.id === product.id)) return 'best-deal' as const;
    if (isPopular(product.id)) return 'popular' as const;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main navigation">
          <a href="/" className="flex items-center gap-2" aria-label="TopPicks Home">
            <ShoppingBag className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight text-foreground">TopPicks</span>
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-primary/5 border-b border-border" aria-label="Hero">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Discover the Best Products
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Handpicked deals and trending items — find what you love at the best prices.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10" role="main">
        {/* Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" role="search" aria-label="Product filters">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter categories={categories} selected={category} onChange={setCategory} />
          </div>
          <PriceFilter min={priceExtents[0]} max={priceExtents[1]} value={priceRange} onChange={setPriceRange} />
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted aspect-[3/4]" />
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load products. Please try again later.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No products found. Try adjusting your filters.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <ProductSection
              title="Best Deals"
              icon={<Flame className="h-5 w-5 text-destructive" aria-hidden="true" />}
              products={bestDeals}
              getBadge={getBadge}
            />
            <ProductSection
              title="Trending Products"
              icon={<TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />}
              products={trending}
              getBadge={getBadge}
            />
            {allOther.length > 0 && (
              <ProductSection
                title="All Products"
                products={allOther}
                getBadge={getBadge}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} TopPicks. All rights reserved.</p>
      </footer>

      {/* Lazy-loaded AI Assistant */}
      <Suspense fallback={null}>
        <AiAssistant />
      </Suspense>
    </div>
  );
};

export default Index;
