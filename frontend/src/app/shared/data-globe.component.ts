import {
  AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy,
  PLATFORM_ID, ViewChild, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
@Component({
  selector: 'app-data-globe',
  standalone: true,
  host: { class: 'block' },
  template: `<canvas #cv class="block h-full w-full"></canvas>`,
})
export class DataGlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;
  @Input() logoUrl = 'assets/logo.jpeg'; // path to the logo image
  @Input() showLogo = true;
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private raf = 0;
  private ro?: ResizeObserver;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private mx = 0;
  private my = 0;
  private onMove = (e: MouseEvent) => {
    this.mx = e.clientX / window.innerWidth - 0.5;
    this.my = e.clientY / window.innerHeight - 0.5;
  };
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => this.init());
  }
  private init(): void {
    const canvas = this.cv.nativeElement;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) {
      console.error('[DataGlobe] WebGL is not available', err);
      return;
    }
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // transparent background
    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 8.2;
    const INK = 0xffffff;
    const RAD = 3;      // globe radius
    const N = 700;      // dots on the globe
    const ARCS = 22;    // number of data arcs
    const starMap = this.starTexture();
    const group = new THREE.Group();   // tilts with the mouse
    const globe = new THREE.Group();   // dots + arcs + pulses, rotates slowly
    const coin = new THREE.Group();    // logo coin, spins faster
    group.add(globe, coin);
    scene.add(group);
    // 1. Star field on the globe
    const pos = new Float32Array(N * 3);
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963; // golden angle
      const p = new THREE.Vector3(Math.cos(th) * r * RAD, y * RAD, Math.sin(th) * r * RAD);
      pos.set([p.x, p.y, p.z], i * 3);
      if (i % 25 === 0) nodes.push(p);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({
      map: starMap,
      color: INK,
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    });
    globe.add(new THREE.Points(dotGeo, starMat));
    const nodeMat = starMat.clone();
    nodeMat.size = 0.42;
    globe.add(new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(nodes),
      nodeMat,
    ));
    // Arcs in white, with a travelling star on each
    const pulses: { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Sprite; t: number; s: number }[] = [];
    for (let k = 0; k < ARCS; k++) {
      const a = nodes[k % nodes.length];
      const b = nodes[(k * 7 + 3) % nodes.length];
      if (a === b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(RAD * (1.35 + Math.random() * 0.3));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
        new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.42 }),
      ));
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: starMap,
        color: INK,
        transparent: true,
        depthWrite: false,
      }));
      sprite.scale.set(0.38, 0.38, 1);
      globe.add(sprite);
      pulses.push({ curve, mesh: sprite, t: Math.random(), s: 0.004 + Math.random() * 0.004 });
    }
    if (this.showLogo) {
      const edge = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.16, 64, 1, true),
        new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide }),
      );
      edge.rotation.x = Math.PI / 2;
      const faceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const front = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), faceMat);
      const back = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), faceMat);
      front.position.z = 0.081;
      back.position.z = -0.081;
      back.rotation.y = Math.PI;
      coin.add(edge, front, back);
      new THREE.TextureLoader().load(
        this.logoUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          faceMat.map = tex;
          faceMat.needsUpdate = true;
        },
        undefined,
        (err) => console.error('[DataGlobe] logo failed to load:', this.logoUrl, err),
      );
    }
    // 6. Orbit ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(RAD * 1.6, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = 1.25;
    group.add(ring);
    // Sizing
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) { console.warn('[DataGlobe] canvas has zero size. Give the host an explicit width and height.'); return; }
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    this.ro = new ResizeObserver(resize);
    this.ro.observe(canvas);
    resize();
    window.addEventListener('mousemove', this.onMove, { passive: true });
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (ms: number) => {
      const t = ms * 0.001;
      group.rotation.y += (this.mx * 0.9 - group.rotation.y) * 0.04;
      group.rotation.x += (this.my * 0.6 - group.rotation.x) * 0.04;
      if (!calm) {
        globe.rotation.y = t * 0.25;
        coin.rotation.y = t * 1.1;
        ring.rotation.z = t * 0.3;
        starMat.size = 0.13 + Math.sin(t * 2.6) * 0.045;
        nodeMat.size = 0.34 + Math.sin(t * 1.8) * 0.1;
        starMat.opacity = 0.72 + Math.sin(t * 3.1) * 0.22;
        for (const p of pulses) {
          p.t += p.s;
          if (p.t > 1) p.t = 0;
          p.mesh.position.copy(p.curve.getPoint(p.t));
          const twinkle = 0.28 + Math.sin(t * 4 + p.t * 12) * 0.12;
          p.mesh.scale.set(twinkle, twinkle, 1);
        }
      }
      renderer.render(scene, camera);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  private starTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const glow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(0.25, 'rgba(255,255,255,0.28)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cx);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const spikes = 4;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? 48 : 12;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener('mousemove', this.onMove);
    this.scene?.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const m = mesh.material;
      (Array.isArray(m) ? m : m ? [m] : []).forEach((x: THREE.Material) => {
        const mapped = x as THREE.Material & { map?: THREE.Texture | null };
        mapped.map?.dispose?.();
        x.dispose?.();
      });
    });
    this.renderer?.dispose();
  }
}
