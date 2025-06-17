import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'om-lightning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ngx-lightning.component.html",
  styleUrl: './ngx-lightning.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxLightningComponent implements AfterViewInit, OnDestroy {
  @ViewChild('OmLightning') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() set hue(v: number) {
    this.hueSignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set xOffset(v: number) {
    this.xOffsetSignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set speed(v: number) {
    this.speedSignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set intensity(v: number) {
    this.intensitySignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set size(v: number) {
    this.sizeSignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set flashTimeOut(v: number) {
    this.flashTimeOutSignal.set(v);
    if (this.initialized) this.setup();
  }

  @Input() set transparent(v: boolean) {
    this.transparentSignal.set(v);
    if (this.initialized) this.setup();
  }

  hueSignal = signal(230);
  xOffsetSignal = signal(0);
  speedSignal = signal(1);
  intensitySignal = signal(1);
  sizeSignal = signal(1);
  flashTimeOutSignal = signal<number | undefined>(undefined);
  transparentSignal = signal(false);

  private initialized = false;
  private running = false;
  private intersectionObserver?: IntersectionObserver;
  private animationFrameId?: number;
  isInView = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initialized = true;
    this.setup();
    this.observeInView();
  }

  ngOnDestroy() {
    this.running = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
  }

  private observeInView() {
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      const wasInView = this.isInView();
      this.isInView.set(entry.isIntersecting);
      if (!wasInView && this.isInView()) {
        this.running = true;
        this.setup();
      }
      if (wasInView && !this.isInView()) {
        this.running = false;
      }
    });
    this.intersectionObserver.observe(this.canvasRef.nativeElement);
  }

  private setup() {
    const canvas = this.canvasRef.nativeElement;
    this.running = true;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
    });

    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
    `;
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      #define OCTAVE_COUNT 10
      vec3 hsv2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }
      float hash11(float p) {
        p = fract(p * .1031);
        p *= p + 33.33;
        p *= p + p;
        return fract(p);
      }
      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      mat2 rotate2d(float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat2(c, -s, s, c);
      }
      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        float a = hash12(ip);
        float b = hash12(ip + vec2(1.0, 0.0));
        float c = hash12(ip + vec2(0.0, 1.0));
        float d = hash12(ip + vec2(1.0, 1.0));
        vec2 t = smoothstep(0.0, 1.0, fp);
        return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < OCTAVE_COUNT; ++i) {
          value += amplitude * noise(p);
          p *= rotate2d(0.45);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / iResolution.xy;
        uv = 2.0 * uv - 1.0;
        uv.x *= iResolution.x / iResolution.y;
        uv.x += uXOffset;
        uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
        float dist = abs(uv.x);
        vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
        vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
        col = pow(col, vec3(1.0));

        ${this.transparentSignal() ? `
          float alpha = clamp(1.0 - dist * 3.0, 0.0, 1.0);
          fragColor = vec4(col, alpha);
        ` :
      'fragColor = vec4(col, 1.0);'
    }
      }
      void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
    `;

    const compileShader = (src: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLoc = gl.getUniformLocation(program, "iResolution");
    const iTimeLoc = gl.getUniformLocation(program, "iTime");
    const uHueLoc = gl.getUniformLocation(program, "uHue");
    const uXOffsetLoc = gl.getUniformLocation(program, "uXOffset");
    const uSpeedLoc = gl.getUniformLocation(program, "uSpeed");
    const uIntensityLoc = gl.getUniformLocation(program, "uIntensity");
    const uSizeLoc = gl.getUniformLocation(program, "uSize");

    const startTime = performance.now();

    let i = 0;

    const render = () => {
      if (!this.running) return;
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResolutionLoc, canvas.width, canvas.height);
      const t = (performance.now() - startTime) / 1000.0;
      gl.uniform1f(iTimeLoc, t);
      gl.uniform1f(uHueLoc, this.hueSignal());
      gl.uniform1f(uXOffsetLoc, this.xOffsetSignal());
      gl.uniform1f(uSpeedLoc, this.speedSignal());
      gl.uniform1f(uIntensityLoc, this.intensitySignal());
      gl.uniform1f(uSizeLoc, this.sizeSignal());
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!this.flashTimeOutSignal()) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      i = i + 1;

      const activeFrames = 75;

      if (i < activeFrames) {
        const intensity = activeFrames / i;
        gl.uniform1f(uIntensityLoc, this.intensitySignal() * intensity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        this.animationFrameId = requestAnimationFrame(render);
      } else {
        i = 0;
        gl.uniform1f(uIntensityLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        setTimeout(() => {
          this.animationFrameId = requestAnimationFrame(render);
        }, this.flashTimeOutSignal());
      }
    };
    this.animationFrameId = requestAnimationFrame(render);
  }
}
