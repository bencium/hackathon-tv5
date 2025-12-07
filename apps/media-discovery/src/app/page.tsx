'use client';

import { Suspense, useEffect, useRef, useCallback, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { TrendingSection } from '@/components/TrendingSection';
import { RecommendationsSection } from '@/components/RecommendationsSection';
import { AdminWidget } from '@/components/AdminWidget';
import { useDiscoveryStore, GENRES } from '@/lib/discovery-store';

export default function HomePage() {
  const {
    currentScreen,
    setScreen,
    isTransitioning,
    setTransitioning,
    profileComplete,
    startDiscovery,
    genres,
    clickSequence,
    totalTime,
    updateTotalTime,
    onHoverEnter,
    onHoverLeave,
    onThumbnailClick,
    trackVelocity,
    startTime,
    completeProfile,
    getGenreScores,
    resetMetrics,
    initializeGenres,
  } = useDiscoveryStore();

  const timerRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });
  const [shuffledGenres, setShuffledGenres] = useState<typeof GENRES>([]);

  // Initialize genres on mount
  useEffect(() => {
    initializeGenres();
  }, [initializeGenres]);

  // Shuffle genres when entering discovery screen
  useEffect(() => {
    if (currentScreen === 'discovery') {
      setShuffledGenres([...GENRES].sort(() => Math.random() - 0.5));
    }
  }, [currentScreen]);

  // Timer logic
  useEffect(() => {
    if (currentScreen === 'discovery' && startTime) {
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        updateTotalTime(elapsed);
        timerRef.current = requestAnimationFrame(animate);
      };
      timerRef.current = requestAnimationFrame(animate);

      return () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
      };
    }
  }, [currentScreen, startTime, updateTotalTime]);

  // Mouse velocity tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = performance.now();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const dt = now - lastMousePos.current.time;

    if (dt > 0) {
      const speed = Math.sqrt(dx * dx + dy * dy) / dt * 1000;
      trackVelocity(speed);
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
  }, [trackVelocity]);

  useEffect(() => {
    if (currentScreen === 'discovery') {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [currentScreen, handleMouseMove]);

  // Screen transition
  const goToScreen = (screen: typeof currentScreen) => {
    if (isTransitioning) return;
    setTransitioning(true);

    setTimeout(() => {
      setScreen(screen);
      if (screen === 'discovery') startDiscovery();
      setTimeout(() => setTransitioning(false), 500);
    }, 400);
  };

  const handleRestart = () => {
    resetMetrics();
    goToScreen('signin');
  };

  const showContinueButton = totalTime > 8 || clickSequence.length >= 3;

  // Get top genres for personalized sections
  const topGenres = getGenreScores();
  const primaryGenres = topGenres.slice(0, 2);
  const secondaryGenres = topGenres.slice(2, 4);

  // If profile is complete, show the main app
  if (profileComplete) {
    return (
      <main className="min-h-screen">
        <AdminWidget />

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-4 text-center bg-gradient-to-b from-accent-cyan/10 to-transparent">
          <h1 className="headline-hero mb-4 text-text-primary">
            AI Media Discovery
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Describe what you want to watch in plain English. Our AI understands
            your mood and finds the perfect match.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={<SearchBarSkeleton />}>
              <SearchBar />
            </Suspense>
          </div>

          {/* Example Prompts */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'exciting sci-fi adventure',
              'cozy romantic comedy',
              'dark psychological thriller',
              'inspiring true story',
            ].map((prompt) => (
              <button
                key={prompt}
                className="px-5 py-2.5 text-sm bg-bg-elevated text-text-primary border border-border-subtle rounded-full hover:bg-bg-primary hover:border-accent-cyan hover:-translate-y-0.5 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        {/* Primary Picks - Based on top genres */}
        <section className="py-12 px-4 md:px-8">
          <h2 className="headline-h2 mb-2 text-text-primary">
            Perfect for {primaryGenres.map(g => g.name).join(' & ')} Fans
          </h2>
          <p className="text-text-secondary mb-6">Curated based on your taste profile</p>
          <Suspense fallback={<ContentSkeleton />}>
            <TrendingSection />
          </Suspense>
        </section>

        {/* Secondary Picks */}
        <section className="py-12 px-4 md:px-8 bg-bg-primary/50">
          <h2 className="headline-h2 mb-2 text-text-primary">More for You</h2>
          <p className="text-text-secondary mb-6">
            Because you like {secondaryGenres.map(g => g.name).join(' and ')}
          </p>
          <Suspense fallback={<ContentSkeleton />}>
            <RecommendationsSection />
          </Suspense>
        </section>

        {/* Explore Section */}
        <section className="py-12 px-4 md:px-8">
          <h2 className="headline-h2 mb-2 text-text-primary">Expand Your Horizons</h2>
          <p className="text-text-secondary mb-6">Discover something new outside your usual picks</p>
          <Suspense fallback={<ContentSkeleton />}>
            <TrendingSection />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 text-center text-text-secondary text-sm border-t border-border-subtle">
          <p>
            Powered by{' '}
            <a href="https://www.themoviedb.org/" className="underline hover:text-accent-cyan">
              TMDB
            </a>{' '}
            &bull; Built with{' '}
            <a href="https://arw.dev" className="underline hover:text-accent-cyan">
              ARW
            </a>{' '}
            &bull;{' '}
            <a href="/.well-known/arw-manifest.json" className="underline hover:text-accent-cyan">
              Agent API
            </a>
          </p>
        </footer>
      </main>
    );
  }

  // Cold-start discovery flow
  return (
    <main className="min-h-screen">
      <AdminWidget />

      {/* SCREEN 1: SIGN-IN */}
      <section
        className={`screen ${currentScreen === 'signin' ? 'active' : ''} ${
          isTransitioning && currentScreen === 'signin' ? 'exiting' : ''
        } ${isTransitioning && currentScreen !== 'signin' ? 'entering' : ''}`}
      >
        <div className="bg-bg-primary border border-border-subtle p-12 w-full max-w-[420px] text-center animate-card-fade-in rounded-lg">
          <h1 className="headline-hero mb-2">
            Discover Your<br />Next Watch
          </h1>
          <p className="text-body mb-8">
            No questionnaires. No endless scrolling.<br />
            Just a few moments of your attention.
          </p>
          <input
            type="email"
            className="input-field mb-4 rounded"
            placeholder="Enter your email"
            disabled
          />
          <button
            className="btn-primary w-full rounded"
            onClick={() => goToScreen('discovery')}
          >
            Start Exploring
          </button>
        </div>
      </section>

      {/* SCREEN 2: DISCOVERY GRID */}
      <section
        className={`screen ${currentScreen === 'discovery' ? 'active' : ''} ${
          isTransitioning && currentScreen === 'discovery' ? 'entering' : ''
        }`}
      >
        <div className="w-full max-w-[1000px]">
          <div className="text-center mb-8">
            <h1 className="headline-h1 mb-2">What catches your eye?</h1>
            <p className="text-body">Hover over the images that interest you</p>
            <div className="mono text-xl text-accent-cyan mt-4">
              {totalTime.toFixed(3)}s
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {shuffledGenres.map((genre, index) => {
              const genreData = genres[genre.id];
              const isClicked = genreData?.clickOrder !== null;

              return (
                <div
                  key={genre.id}
                  className="card-hover relative aspect-video overflow-hidden cursor-pointer rounded-lg"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: isClicked ? genre.color : 'transparent',
                    animationDelay: `${index * 50}ms`,
                  }}
                  onMouseEnter={() => onHoverEnter(genre.id)}
                  onMouseLeave={() => onHoverLeave(genre.id)}
                  onClick={() => onThumbnailClick(genre.id)}
                >
                  <img
                    src={genre.src}
                    alt={genre.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="genre-label-hover absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-xs font-medium uppercase tracking-wide"
                    style={{ borderLeft: `3px solid ${genre.color}` }}
                  >
                    {genre.name}
                  </div>
                  {isClicked && (
                    <div
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded text-xs font-bold animate-badge-pop"
                      style={{ backgroundColor: genre.color, color: '#0D1117' }}
                    >
                      {genreData?.clickOrder}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          {showContinueButton && (
            <button
              className="btn-primary mx-auto block max-w-[300px] w-full rounded animate-button-reveal"
              onClick={() => goToScreen('results')}
            >
              See My Recommendations
            </button>
          )}
        </div>
      </section>

      {/* SCREEN 3: RESULTS FEED */}
      <section
        className={`screen ${currentScreen === 'results' ? 'active' : ''} ${
          isTransitioning && currentScreen === 'results' ? 'entering' : ''
        }`}
      >
        <ResultsFeed
          genres={genres}
          totalTime={totalTime}
          onRestart={handleRestart}
          onContinue={completeProfile}
          getGenreScores={getGenreScores}
        />
      </section>
    </main>
  );
}

// Results Feed Component
function ResultsFeed({
  genres,
  totalTime,
  onRestart,
  onContinue,
  getGenreScores,
}: {
  genres: Record<string, any>;
  totalTime: number;
  onRestart: () => void;
  onContinue: () => void;
  getGenreScores: () => any[];
}) {
  const sorted = getGenreScores();
  const top2 = sorted.slice(0, 2);
  const next2 = sorted.slice(2, 4);
  const rest = sorted.slice(4);

  return (
    <div className="w-full max-w-[1000px] animate-section-fade-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="headline-h1 mb-2">Curated for You</h1>
        <p className="text-body">Based on your unique viewing style</p>
      </div>

      {/* Primary Picks */}
      <div className="mb-8">
        <h3 className="text-text-secondary font-medium mb-4 animate-header-slide">
          Perfect for {top2.map(g => g.name).join(' & ')} Fans
        </h3>
        <div className="feed-grid primary">
          {top2.map((genre, i) => (
            <div
              key={genre.id}
              className="card-hover feed-card-primary relative aspect-video overflow-hidden cursor-pointer rounded-lg animate-card-reveal"
              style={{
                border: `2px solid ${genre.color}`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              <img src={genre.src} alt={genre.name} className="w-full h-full object-cover" />
              <div
                className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-sm font-semibold uppercase tracking-wide"
                style={{ borderLeft: `3px solid ${genre.color}` }}
              >
                {genre.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Picks */}
      <div className="mb-8">
        <h3 className="text-text-secondary font-medium mb-4">More for You</h3>
        <div className="feed-grid secondary">
          {next2.map((genre, i) => (
            <div
              key={genre.id}
              className="card-hover feed-card-secondary relative aspect-video overflow-hidden cursor-pointer rounded-lg animate-card-reveal"
              style={{ animationDelay: `${(i + 2) * 80}ms` }}
            >
              <img src={genre.src} alt={genre.name} className="w-full h-full object-cover" />
              <div
                className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-sm font-semibold uppercase tracking-wide"
                style={{ borderLeft: `3px solid ${genre.color}` }}
              >
                {genre.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explore Section */}
      <div className="mb-8">
        <h3 className="text-text-secondary font-medium mb-4">Expand Your Horizons</h3>
        <div className="feed-grid explore">
          {rest.map((genre, i) => (
            <div
              key={genre.id}
              className="card-hover feed-card-explore relative aspect-video overflow-hidden cursor-pointer rounded-lg animate-card-reveal"
              style={{ animationDelay: `${(i + 4) * 80}ms` }}
            >
              <img src={genre.src} alt={genre.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="text-center p-8 bg-bg-primary border border-border-subtle rounded-lg animate-section-fade-up">
        <div className="text-4xl text-accent-cyan mono mb-2">
          {totalTime.toFixed(0)} seconds
        </div>
        <p className="text-body mb-4">Not 45 minutes.</p>
        <div className="flex gap-4 justify-center">
          <button className="btn-secondary rounded" onClick={onRestart}>
            Try Again
          </button>
          <button className="btn-primary rounded" onClick={onContinue}>
            Continue to Discovery
          </button>
        </div>
      </div>
    </div>
  );
}

// Skeleton components
function SearchBarSkeleton() {
  return (
    <div className="h-14 bg-bg-elevated rounded-xl animate-pulse" />
  );
}

function ContentSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] bg-bg-elevated rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
