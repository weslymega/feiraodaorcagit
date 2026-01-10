
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { PromoBanner } from '../../constants';

interface PromoCarouselProps {
    banners: PromoBanner[];
    onPromoClick?: (promo: PromoBanner) => void;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ banners, onPromoClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAutoScrolling = useRef(false);

    // Auto-rotation every 6 seconds
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            if (isAutoScrolling.current) return;

            const nextIndex = (activeIndex + 1) % banners.length;
            scrollToIndex(nextIndex);
        }, 6000);

        return () => clearInterval(interval);
    }, [activeIndex, banners.length]);

    const scrollToIndex = (index: number) => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const itemWidth = container.offsetWidth;

        isAutoScrolling.current = true;
        container.scrollTo({
            left: index * itemWidth,
            behavior: 'smooth'
        });

        setActiveIndex(index);

        // Reset auto-scrolling flag after animation
        setTimeout(() => {
            isAutoScrolling.current = false;
        }, 500);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isAutoScrolling.current) return;

        const container = e.currentTarget;
        const index = Math.round(container.scrollLeft / container.offsetWidth);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    return (
        <div className="relative group">
            {/* Carousel Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-0 px-0 py-2"
            >
                {banners.map((promo) => (
                    <div
                        key={promo.id}
                        onClick={() => onPromoClick?.(promo)}
                        className="relative min-w-full aspect-[21/9] md:aspect-[25/9] overflow-hidden snap-center cursor-pointer active:scale-[0.99] transition-transform flex-shrink-0"
                    >
                        <div className="mx-4 h-full rounded-2xl overflow-hidden relative shadow-lg">
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img
                                    src={promo.image}
                                    alt={promo.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-r ${promo.backgroundColor === 'bg-primary' ? 'from-primary/90 to-primary/30' : 'from-accent/90 to-accent/30'} mix-blend-multiply opacity-80`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-center items-start text-white">
                                {promo.subtitle && (
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold tracking-widest mb-2 md:mb-3 border border-white/20 uppercase">
                                        {promo.subtitle}
                                    </span>
                                )}
                                <h2 className="text-xl md:text-3xl font-black leading-tight mb-3 md:mb-4 drop-shadow-md">
                                    {promo.title}
                                </h2>

                                <button className="bg-white text-gray-900 rounded-full px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-black flex items-center gap-2 shadow-xl hover:bg-gray-100 transition-colors uppercase">
                                    {promo.ctaText}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Indicators - Pill Style */}
            {banners.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-1 pb-1">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToIndex(index)}
                            className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === index
                                    ? 'w-6 bg-primary'
                                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Ir para slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
