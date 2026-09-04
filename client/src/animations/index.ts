import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as scrollAnimations from './scrollAnimations';

gsap.registerPlugin(ScrollTrigger);

// Centralized animation controller
export class AnimationController {
  private cleanupFunctions: Array<() => void> = [];
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize scroll animations
    this.cleanupFunctions.push(scrollAnimations.initScrollAnimations());

    // Refresh ScrollTrigger after initialization
    ScrollTrigger.refresh();
  }

  cleanup() {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
    this.isInitialized = false;
  }

  // Scroll animations
  animateSectionReveal(_sections: NodeListOf<HTMLElement>) {
    // Disabled — GSAP ScrollTrigger reveals caused content to get stuck at
    // opacity:0 across route changes. framer-motion <Reveal> handles entrances.
  }

  animateParallaxElements(elements: NodeListOf<HTMLElement>) {
    this.cleanupFunctions.push(scrollAnimations.animateParallaxElements(elements));
  }

  animateTimeline(_timelineContainer: HTMLElement) {
    // Disabled — see animateSectionReveal note above.
  }

  animateCardHover(card: HTMLElement) {
    this.cleanupFunctions.push(scrollAnimations.animateCardHover(card));
  }

  // Utility methods
  refreshScrollTrigger() {
    ScrollTrigger.refresh();
  }

  killAllScrollTriggers() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}

// Singleton instance
let animationController: AnimationController | null = null;

export const getAnimationController = (): AnimationController => {
  if (!animationController) {
    animationController = new AnimationController();
  }
  return animationController;
};

// React hook for using the animation controller
export const useAnimations = () => {
  const controllerRef = useRef<AnimationController>(getAnimationController());

  useEffect(() => {
    const controller = controllerRef.current;
    controller.initialize();

    return () => {
      controller.cleanup();
    };
  }, []);

  return controllerRef.current;
};

// Export individual animation modules for direct use
export { scrollAnimations };
