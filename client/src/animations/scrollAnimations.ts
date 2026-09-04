import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const animateSectionReveal = (sections: NodeListOf<HTMLElement>): (() => void) => {
  const ctx = gsap.context(() => {
    sections.forEach((section) => {
      // Safety guard: never hide content that is already on screen (e.g. after
      // a back-navigation restored the scroll position). Skip the animation and
      // leave the section fully visible.
      if (section.getBoundingClientRect().top < window.innerHeight * 0.85) return;

      const heading = section.querySelector('[data-section-heading]');
      const content = section.querySelector('[data-section-content]');
      const cards = section.querySelectorAll('[data-section-card]');

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'bottom 20%',
          // Fire once, never reverse — prevents sections getting stuck invisible
          // when the browser restores the scroll position after route changes.
          toggleActions: 'play none none none',
          once: true,
        },
        defaults: { ease: 'power3.out' },
      });

      if (heading) {
        timeline.from(heading, {
          y: 40,
          opacity: 0,
          duration: 0.8,
        });
      }

      if (content) {
        timeline.from(
          content,
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.4'
        );
      }

      if (cards.length > 0) {
        timeline.from(
          cards,
          {
            y: 30,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          '-=0.3'
        );
      }
    });

    // Recalculate trigger positions against the *current* scroll offset so
    // sections already above/below the viewport after a back-navigation
    // immediately resolve to their final (visible) state.
    ScrollTrigger.refresh();
  }, document.body);

  return () => ctx.revert();
};

export const animateParallaxElements = (elements: NodeListOf<HTMLElement>): (() => void) => {
  const ctx = gsap.context(() => {
    elements.forEach((element) => {
      const speed = parseFloat(element.dataset.parallaxSpeed || '0.5');
      
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: () => ScrollTrigger.maxScroll(window) * speed * 0.1,
      });
    });
  }, document.body);

  return () => ctx.revert();
};

export const animateTimeline = (timelineContainer: HTMLElement): (() => void) => {
  const ctx = gsap.context(() => {
    const timelineItems = timelineContainer.querySelectorAll('[data-timeline-item]');
    const timelineLine = timelineContainer.querySelector('[data-timeline-line]');

    // Safety guard: if the timeline is already on screen (e.g. after a
    // back-navigation restored the scroll position), leave everything visible.
    const containerTop = timelineContainer.getBoundingClientRect().top;
    if (containerTop < window.innerHeight * 0.85) return;

    // Animate timeline line
    if (timelineLine) {
      gsap.from(timelineLine, {
        scrollTrigger: {
          trigger: timelineContainer,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: true,
        },
        scaleY: 0,
        transformOrigin: 'top',
      });
    }

    // Animate timeline items
    timelineItems.forEach((item, index) => {
      // Skip items already at/above the viewport — never hide visible content.
      if (item.getBoundingClientRect().top < window.innerHeight * 0.85) return;

      const marker = item.querySelector('[data-timeline-marker]');

      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
        x: index % 2 === 0 ? -50 : 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      if (marker) {
        gsap.from(marker, {
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
          },
          scale: 0,
          duration: 0.5,
          ease: 'back.out(1.7)',
        });
      }
    });
  }, timelineContainer);

  return () => ctx.revert();
};

export const animateCardHover = (card: HTMLElement): (() => void) => {
  const ctx = gsap.context(() => {
    const hoverTimeline = gsap.timeline({ paused: true });
    const image = card.querySelector('[data-card-image]');
    const content = card.querySelector('[data-card-content]');

    hoverTimeline
      .to(card, {
        y: -8,
        duration: 0.3,
        ease: 'power2.out',
      })
      .to(
        card,
        {
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)',
          duration: 0.3,
        },
        '<'
      );

    if (image) {
      hoverTimeline.to(
        image,
        {
          scale: 1.05,
          duration: 0.4,
        },
        '<'
      );
    }

    if (content) {
      hoverTimeline.from(
        content,
        {
          y: 10,
          opacity: 0,
          duration: 0.3,
          // CRITICAL: gsap.from renders immediately by default, which would set
          // the card content to opacity:0 on mount (before any hover) and leave
          // it invisible until the paused timeline plays.
          immediateRender: false,
        },
        '<0.1'
      );
    }

    card.addEventListener('mouseenter', () => hoverTimeline.play());
    card.addEventListener('mouseleave', () => hoverTimeline.reverse());
  }, card);

  return () => ctx.revert();
};

export const initScrollAnimations = (): (() => void) => {
  // NOTE: GSAP ScrollTrigger section/timeline reveals were removed intentionally.
  // They repeatedly left content stuck at opacity:0 across route changes
  // (back-navigation, scroll restoration, StrictMode remounts).
  // Entrance animations are handled by the framer-motion <Reveal> component,
  // which is resilient to route transitions. Only parallax remains here.
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  const cleanupFunctions: (() => void)[] = [];

  if (parallaxElements.length > 0) {
    cleanupFunctions.push(animateParallaxElements(parallaxElements as NodeListOf<HTMLElement>));
  }

  // Clean up all animations
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};
