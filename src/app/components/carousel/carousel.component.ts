/**
 * Carousel Component
 * Displays a 3D rotating carousel where cards orbit around an invisible sphere
 * Cards always face outward from the sphere's center
 * Uses CSS 3D transforms with backface-visibility for proper card orientation
 */
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';

/** Interface defining the structure of a carousel slide */
interface Slide {
  /** Unique identifier for the slide */
  id: number;
  /** Title text displayed on the slide */
  title: string;
  /** Description text displayed on the slide */
  description: string;
  /** Path to the slide's background image */
  imageUrl: string;
}

@Component({
  selector: 'app-carousel',
  standalone: false,
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, OnDestroy {
  /** Array of slides to display in the carousel */
  slides: Slide[] = [
    {
      id: 1,
      title: 'Welcome to Employee Portal',
      description: 'Manage your workforce efficiently with our comprehensive employee management system.',
      imageUrl: 'assets/images/carousel/slide1.jpg'
    },
    {
      id: 2,
      title: 'Track Performance',
      description: 'Monitor employee performance and productivity with real-time analytics.',
      imageUrl: 'assets/images/carousel/slide2.jpg'
    },
    {
      id: 3,
      title: 'Streamline HR Operations',
      description: 'Simplify your HR processes with automated workflows and reporting.',
      imageUrl: 'assets/images/carousel/slide3.jpg'
    },
    {
      id: 4,
      title: 'Data-Driven Decisions',
      description: 'Make informed decisions with comprehensive employee data and insights.',
      imageUrl: 'assets/images/carousel/slide4.jpg'
    }
  ];

  /** Current rotation angle of the carousel in degrees */
  rotationAngle = 0;

  /** Angle between each card on the sphere (360 / number of slides) */
  anglePerSlide = 0;

  /** Radius of the invisible sphere (distance from center to cards) */
  sphereRadius = 400;

  /** Subscription to the auto-play interval observable */
  private autoPlaySubscription: Subscription | null = null;

  /** Duration in milliseconds between automatic rotations */
  private autoPlayDuration = 4000;

  /** Flag to track if user is interacting with carousel */
  isInteracting = false;

  /**
   * Constructor - injects ChangeDetectorRef for manual change detection
   */
  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Lifecycle hook - initializes the component
   * Calculates angle per slide and starts auto-play
   */
  ngOnInit(): void {
    // Calculate the angle between each card based on total number of slides
    this.anglePerSlide = 360 / this.slides.length;
    this.startAutoPlay();
  }

  /**
   * Lifecycle hook - cleans up when component is destroyed
   * Stops the auto-play interval to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Calculates the transform style for positioning each card on the sphere surface
   * Cards are rotated around the Y-axis and translated outward to sit on the sphere
   * Cards always face outward from the sphere's center
   * @param index - The index of the card in the slides array
   * @returns CSS transform string for positioning the card
   */
  getCardTransform(index: number): string {
    // Calculate the card's angle position on the sphere
    const cardAngle = (this.anglePerSlide * index) + this.rotationAngle;
    // Rotate around Y-axis, then translate outward on Z-axis
    // This places the card on the sphere surface, facing outward
    return `rotateY(${cardAngle}deg) translateZ(${this.sphereRadius}px)`;
  }

  /**
   * Rotates the carousel to the next position
   */
  nextSlide(): void {
    this.rotationAngle -= this.anglePerSlide;
    this.resetAutoPlay();
  }

  /**
   * Rotates the carousel to the previous position
   */
  prevSlide(): void {
    this.rotationAngle += this.anglePerSlide;
    this.resetAutoPlay();
  }

  /**
   * Rotates the carousel to show a specific slide at the front
   * @param index - The index of the slide to bring to front
   */
  goToSlide(index: number): void {
    this.rotationAngle = -(this.anglePerSlide * index);
    this.resetAutoPlay();
  }

  /**
   * Returns the index of the currently front-facing slide
   * @returns Index of the active slide
   */
  getActiveSlideIndex(): number {
    const normalizedAngle = (((-this.rotationAngle) % 360) + 360) % 360;
    return Math.round(normalizedAngle / this.anglePerSlide) % this.slides.length;
  }

  /**
   * Starts the automatic rotation of the carousel using RxJS interval
   */
  private startAutoPlay(): void {
    this.autoPlaySubscription = interval(this.autoPlayDuration).subscribe(() => {
      if (!this.isInteracting) {
        this.rotationAngle -= this.anglePerSlide;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Stops the automatic rotation by unsubscribing from the interval
   */
  private stopAutoPlay(): void {
    if (this.autoPlaySubscription) {
      this.autoPlaySubscription.unsubscribe();
      this.autoPlaySubscription = null;
    }
  }

  /**
   * Resets the auto-play timer after user interaction
   */
  private resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  /**
   * Handles mouse enter event - pauses auto-play during interaction
   */
  onMouseEnter(): void {
    this.isInteracting = true;
  }

  /**
   * Handles mouse leave event - resumes auto-play after interaction
   */
  onMouseLeave(): void {
    this.isInteracting = false;
  }
}
