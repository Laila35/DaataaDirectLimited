import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
@Component({
  selector: 'app-site-cursor',
  standalone: true,
  template: `
    <div #root class="site-cursor" aria-hidden="true">
      <span class="site-cursor-dot"></span>
      <span class="site-cursor-lag">
        <span class="site-cursor-ring"></span>
      </span>
    </div>
  `,
})
export class SiteCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private raf = 0;
  private x = 0;
  private y = 0;
  private rx = 0;
  private ry = 0;
  private active = false;
  private readonly move = (event: MouseEvent) => {
    this.x = event.clientX;
    this.y = event.clientY;
    const el = this.root.nativeElement;
    if (!this.active) {
      this.active = true;
      this.rx = this.x;
      this.ry = this.y;
      el.classList.add('is-on');
    }
    const target = event.target instanceof Element ? event.target : null;
    el.classList.toggle('is-hot', !!target?.closest('a, button, input, textarea, select, label, summary'));
  };
  private readonly leave = () => {
    this.active = false;
    this.root.nativeElement.classList.remove('is-on');
  };
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.body.classList.add('has-site-cursor');
    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.move, { passive: true });
      document.documentElement.addEventListener('mouseleave', this.leave);
      const loop = () => {
        this.rx += (this.x - this.rx) * 0.18;
        this.ry += (this.y - this.ry) * 0.18;
        const el = this.root.nativeElement;
        el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        const lag = el.querySelector('.site-cursor-lag') as HTMLElement | null;
        if (lag) lag.style.transform = `translate3d(${this.rx - this.x}px, ${this.ry - this.y}px, 0)`;
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    });
  }
  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('mousemove', this.move);
    document.documentElement.removeEventListener('mouseleave', this.leave);
    document.body.classList.remove('has-site-cursor');
  }
}
