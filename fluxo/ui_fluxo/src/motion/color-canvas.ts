import { colorGeometry, type ColorGeometry } from "./color-contract";

/** Opaque, sRGB-encoded channels in the inclusive range 0..1. */
export type ColorCanvasRGB = readonly [
  red: number,
  green: number,
  blue: number,
];

export interface ColorCanvasColors {
  highlight: ColorCanvasRGB;
  color: ColorCanvasRGB;
  depth: ColorCanvasRGB;
}

export interface ColorCanvasRadii {
  outerRadius: number;
  /** Zero produces a solid disc; positive values cut a transparent hole. */
  holeRadius: number;
}

export interface ColorCanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  draw(
    geometry: ColorGeometry,
    radii: ColorCanvasRadii,
    colors: ColorCanvasColors,
  ): void;
  dispose(): void;
}

let prepared: ColorCanvasRenderer | null = null;

export function preparedColorCanvas() {
  return prepared;
}

/** Prepare program and viewport buffer once, before an interaction needs them. */
export function warmColorTransition() {
  if (prepared) return;
  const canvas = document.createElement("canvas");
  const renderer = createColorCanvas(canvas);
  if (!renderer) return;
  canvas.className = "route-color-canvas";
  const black = [0, 0, 0] as const;
  renderer.draw(
    colorGeometry({ x: 0, y: 0 }, window.innerWidth, window.innerHeight),
    { outerRadius: 0, holeRadius: 0 },
    { highlight: black, color: black, depth: black },
  );
  prepared = renderer;
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      if (prepared === renderer) prepared = null;
      renderer.dispose();
    },
    { once: true },
  );
}

const vertexSource = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;
uniform vec2 uCssSize;
uniform vec2 uPixelsPerCss;
uniform vec2 uOrigin;
uniform float uGradientRadius;
uniform float uOuterRadius;
uniform float uHoleRadius;
uniform float uHalfPixel;
uniform vec3 uHighlight;
uniform vec3 uColor;
uniform vec3 uDepth;

void main() {
  vec2 point = vec2(
    gl_FragCoord.x / uPixelsPerCss.x,
    uCssSize.y - gl_FragCoord.y / uPixelsPerCss.y
  );
  float distanceFromOrigin = length(point - uOrigin);
  float t = clamp(distanceFromOrigin / uGradientRadius, 0.0, 1.0);
  // SVG's default gradient interpolation mixes encoded sRGB channels.
  vec3 color = t <= 0.58
    ? mix(uHighlight, uColor, t / 0.58)
    : mix(uColor, uDepth, (t - 0.58) / 0.42);

  float outer = uOuterRadius <= 0.0 ? 0.0 : 1.0 - smoothstep(
    uOuterRadius - uHalfPixel,
    uOuterRadius + uHalfPixel,
    distanceFromOrigin
  );
  float hole = uHoleRadius <= 0.0 ? 1.0 : smoothstep(
    uHoleRadius - uHalfPixel,
    uHoleRadius + uHalfPixel,
    distanceFromOrigin
  );
  float alpha = outer * hole;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/**
 * Draws the approved viewport-space gradient through circular coverage masks.
 * The analytic edge spans one physical pixel. SVG/Skia coverage and shader
 * coverage can differ at that edge; pixel identity requires a measured fixture.
 *
 * The parent owns CSS sizing, scheduling, reduced motion and context-loss
 * recovery. This renderer never starts a frame loop or changes React/DOM state.
 */
export function createColorCanvas(
  canvas: HTMLCanvasElement,
): ColorCanvasRenderer | null {
  let gl: WebGLRenderingContext | null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    return null;
  }
  if (!gl) return null;
  const context = gl;
  let vertexShader: WebGLShader | null = null;
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (buffer) context.deleteBuffer(buffer);
    if (program) context.deleteProgram(program);
    if (vertexShader) context.deleteShader(vertexShader);
    if (fragmentShader) context.deleteShader(fragmentShader);
  };

  const compile = (type: number, source: string): WebGLShader => {
    const shader = context.createShader(type);
    if (!shader) throw new Error("Unable to allocate color shader");
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      context.deleteShader(shader);
      throw new Error("Unable to compile color shader");
    }
    return shader;
  };

  try {
    const precision = context.getShaderPrecisionFormat(
      context.FRAGMENT_SHADER,
      context.HIGH_FLOAT,
    );
    if (!precision || precision.precision === 0) {
      dispose();
      return null;
    }
    vertexShader = compile(context.VERTEX_SHADER, vertexSource);
    fragmentShader = compile(context.FRAGMENT_SHADER, fragmentSource);
    program = context.createProgram();
    buffer = context.createBuffer();
    if (!program || !buffer)
      throw new Error("Unable to allocate color program");
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      throw new Error("Unable to link color program");
    }
    context.useProgram(program);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      context.STATIC_DRAW,
    );
    const position = context.getAttribLocation(program, "aPosition");
    if (position < 0) throw new Error("Missing color vertex attribute");
    context.enableVertexAttribArray(position);
    context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    context.disable(context.BLEND);
    context.disable(context.DEPTH_TEST);
    context.disable(context.STENCIL_TEST);

    const uniform = (name: string): WebGLUniformLocation => {
      const location = context.getUniformLocation(program!, name);
      if (!location) throw new Error(`Missing color uniform ${name}`);
      return location;
    };
    const uniforms = {
      cssSize: uniform("uCssSize"),
      pixelsPerCss: uniform("uPixelsPerCss"),
      origin: uniform("uOrigin"),
      gradientRadius: uniform("uGradientRadius"),
      outerRadius: uniform("uOuterRadius"),
      holeRadius: uniform("uHoleRadius"),
      halfPixel: uniform("uHalfPixel"),
      highlight: uniform("uHighlight"),
      color: uniform("uColor"),
      depth: uniform("uDepth"),
    };

    // Compile and submit a transparent, physical 1x1 draw before a real click.
    canvas.width = 1;
    canvas.height = 1;
    context.viewport(0, 0, 1, 1);
    context.uniform2f(uniforms.cssSize, 1, 1);
    context.uniform2f(uniforms.pixelsPerCss, 1, 1);
    context.uniform2f(uniforms.origin, 0, 0);
    context.uniform1f(uniforms.gradientRadius, 1);
    context.uniform1f(uniforms.outerRadius, 0);
    context.uniform1f(uniforms.holeRadius, 0);
    context.uniform1f(uniforms.halfPixel, 0.5);
    context.uniform3f(uniforms.highlight, 0, 0, 0);
    context.uniform3f(uniforms.color, 0, 0, 0);
    context.uniform3f(uniforms.depth, 0, 0, 0);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
    context.flush();
    if (context.isContextLost() || context.getError() !== context.NO_ERROR) {
      dispose();
      return null;
    }

    let lastGeometry: ColorGeometry | null = null;
    let lastColors: ColorCanvasColors | null = null;
    let lastCssWidth = 0;
    let lastCssHeight = 0;

    return {
      canvas,
      draw(geometry, radii, colors) {
        if (disposed || context.isContextLost()) return;
        const { width, height, start, radius } = geometry;
        if (!(width > 0 && height > 0 && radius > 0)) return;
        const reportedDpr = canvas.ownerDocument.defaultView?.devicePixelRatio;
        const dpr =
          reportedDpr && Number.isFinite(reportedDpr) && reportedDpr > 0
            ? reportedDpr
            : 1;
        const pixelWidth = Math.max(1, Math.round(width * dpr));
        const pixelHeight = Math.max(1, Math.round(height * dpr));
        const resized =
          canvas.width !== pixelWidth || canvas.height !== pixelHeight;
        if (resized) {
          if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
          if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
          context.viewport(0, 0, pixelWidth, pixelHeight);
        }
        if (resized || width !== lastCssWidth || height !== lastCssHeight) {
          context.uniform2f(uniforms.cssSize, width, height);
          context.uniform2f(
            uniforms.pixelsPerCss,
            pixelWidth / width,
            pixelHeight / height,
          );
          context.uniform1f(
            uniforms.halfPixel,
            0.5 * Math.max(width / pixelWidth, height / pixelHeight),
          );
          lastCssWidth = width;
          lastCssHeight = height;
        }
        if (geometry !== lastGeometry) {
          context.uniform2f(uniforms.origin, start.x, start.y);
          context.uniform1f(uniforms.gradientRadius, radius);
          lastGeometry = geometry;
        }
        if (colors !== lastColors) {
          context.uniform3f(uniforms.highlight, ...colors.highlight);
          context.uniform3f(uniforms.color, ...colors.color);
          context.uniform3f(uniforms.depth, ...colors.depth);
          lastColors = colors;
        }
        context.uniform1f(uniforms.outerRadius, Math.max(0, radii.outerRadius));
        context.uniform1f(uniforms.holeRadius, Math.max(0, radii.holeRadius));
        // Every pixel is replaced, including transparent pixels in the hole.
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
