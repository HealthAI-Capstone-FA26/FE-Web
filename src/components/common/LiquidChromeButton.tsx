import React, { useEffect, useRef, useState } from 'react';

interface LiquidChromeButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isActive?: boolean;
  className?: string;
}

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_hover;
uniform float u_press;
uniform float u_disabled;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float sdCapsulePill(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Environment reflection for liquid chrome
vec3 sampleChromeEnv(vec3 n, float warmGlow) {
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-viewDir, normalize(n));

  // Studio dark/light bands for crisp liquid chrome contrast
  float band1 = smoothstep(-0.35, 0.25, r.y + r.x * 0.45);
  float band2 = smoothstep(0.15, 0.85, sin(r.x * 5.5 + r.y * 3.2) * 0.5 + 0.5);
  float specTop = pow(max(dot(n, normalize(vec3(-0.35, 0.85, 0.4))), 0.0), 18.0);
  float specBot = pow(max(dot(n, normalize(vec3(0.45, -0.75, 0.45))), 0.0), 12.0);

  vec3 darkChrome = vec3(0.05, 0.06, 0.09);
  vec3 midChrome = vec3(0.55, 0.59, 0.66);
  vec3 brightChrome = vec3(0.98, 0.99, 1.0);

  vec3 col = mix(darkChrome, midChrome, band1);
  col = mix(col, brightChrome, band2 * 0.65);
  col += vec3(1.0) * specTop * 0.95;
  col += vec3(0.85, 0.9, 1.0) * specBot * 0.45;

  // Subtle spectral edge tint
  float fresnel = pow(1.0 - max(n.z, 0.0), 2.5);
  vec3 spectral = 0.5 + 0.5 * cos(6.2831 * (r.x * 0.35 + vec3(0.0, 0.33, 0.67)));
  col = mix(col, col * (0.75 + 0.5 * spectral), fresnel * 0.35);

  // Warm reflection from amber knob
  col += vec3(1.0, 0.58, 0.16) * warmGlow * (0.45 + 0.55 * fresnel);
  return col;
}

void main() {
  vec2 res = u_resolution;
  float H = res.y;
  float W = res.x;

  // Pixel coords with origin at center, Y up
  vec2 px = vec2(v_uv.x * W, (1.0 - v_uv.y) * H);
  vec2 center = res * 0.5;
  vec2 p = px - center;

  float outerR = H * 0.47;
  vec2 halfSize = vec2(W * 0.5 - H * 0.03, outerR);
  float dOuter = sdCapsulePill(p, halfSize, outerR);

  // Anti-aliased alpha for outer pill
  float aa = 1.25;
  float outerMask = 1.0 - smoothstep(-aa, aa, dOuter);
  if (outerMask <= 0.001) {
    outColor = vec4(0.0);
    return;
  }

  float bezelWidth = H * 0.088;
  float dInner = dOuter + bezelWidth;
  float innerMask = 1.0 - smoothstep(-aa, aa, dInner);
  float bezelMask = clamp(outerMask - innerMask, 0.0, 1.0);

  // Bezel normal via finite difference
  float eps = 1.0;
  float dx = sdCapsulePill(p + vec2(eps, 0.0), halfSize, outerR) - sdCapsulePill(p - vec2(eps, 0.0), halfSize, outerR);
  float dy = sdCapsulePill(p + vec2(0.0, eps), halfSize, outerR) - sdCapsulePill(p - vec2(0.0, eps), halfSize, outerR);
  vec2 grad = normalize(vec2(dx, dy) + 1e-5);

  // Normalized position across bezel [0..1]
  float bezelT = clamp(-dOuter / bezelWidth, 0.0, 1.0);
  float arch = sin(bezelT * 3.14159265);
  float slope = cos(bezelT * 3.14159265);
  vec3 bezelN = normalize(vec3(grad * slope * 1.15, max(arch, 0.12)));

  // Knob geometry on the right side (center at W - H * 0.5, H * 0.5)
  vec2 knobCenter = vec2(W * 0.5 - H * 0.50, 0.0);
  vec2 kp = p - knobCenter;
  float knobR = H * 0.305;
  float dKnob = length(kp) - knobR;

  // Warmth factor on right side when hovered
  float knobProx = exp(-length(kp) / (H * 0.95));
  float warmField = u_hover * knobProx * (1.0 - u_disabled * 0.85);

  // 1. Liquid-Chrome Bezel
  vec3 bezelCol = sampleChromeEnv(bezelN, warmField * 0.9);
  // Crisp dark inner groove between bezel and brushed face
  float groove = smoothstep(0.0, bezelWidth * 0.22, -dInner);
  float outerDarkEdge = smoothstep(0.0, bezelWidth * 0.14, -dOuter);
  bezelCol *= mix(0.28, 1.0, outerDarkEdge);

  // 2. Brushed Metallic Inner Face
  float domeY = clamp(p.y / (outerR - bezelWidth), -1.0, 1.0);
  float domeShade = 0.94 - 0.14 * (domeY * domeY) + 0.06 * (-domeY);
  vec3 faceCol = vec3(0.84, 0.86, 0.89) * domeShade;

  // Inner lip shadow around bezel
  float innerShadow = smoothstep(0.0, H * 0.14, -dInner);
  faceCol *= mix(0.62, 1.0, innerShadow);

  // Fine brushed metallic grain
  float fineGrain = hash12(floor(px * 0.85) + vec2(17.0, 43.0));
  float softNoise = noise(px * 0.18 + vec2(u_time * 0.15, 0.0));
  faceCol += (fineGrain - 0.5) * 0.085;
  faceCol += (softNoise - 0.5) * 0.035;

  // Ambient floating micro-particles
  vec2 gridUv = px * 0.075 + vec2(u_time * 0.12, -u_time * 0.08);
  vec2 gid = floor(gridUv);
  vec2 gf = fract(gridUv) - 0.5;
  float rnd = hash12(gid);
  if (rnd > 0.82) {
    vec2 offset = vec2(hash12(gid + 3.1), hash12(gid + 7.7)) - 0.5;
    float pDist = length(gf - offset * 0.6);
    float sparkle = smoothstep(0.18, 0.02, pDist) * (0.4 + 0.6 * sin(u_time * 2.2 + rnd * 25.0));
    faceCol += vec3(1.0, 0.98, 0.95) * sparkle * 0.35;
  }

  // Pointer-drawn light scratches & sheen
  vec2 pointerPx = vec2(u_pointer.x * W - center.x, (0.5 - u_pointer.y) * H);
  vec2 pDiff = p - pointerPx;
  float ptrGlow = exp(-dot(pDiff, pDiff) / (H * H * 0.95)) * u_hover * (1.0 - u_disabled);
  float scratchAngle = noise(vec2(px.x * 0.04, px.y * 0.25)) * 0.8 + 0.35;
  float scratchLine = sin((pDiff.x * 0.35 + pDiff.y * 0.95) * 0.45 + scratchAngle * 4.0);
  float scratches = smoothstep(0.86, 0.99, abs(scratchLine)) * ptrGlow;
  faceCol += vec3(1.0) * (ptrGlow * 0.16 + scratches * 0.28);

  // Warm amber spill from crystal knob onto brushed face
  float spill = exp(-max(dKnob, 0.0) / (H * 0.72)) * u_hover * (1.0 - u_disabled);
  faceCol = mix(faceCol, faceCol + vec3(1.0, 0.55, 0.15) * 0.42, spill);

  // 3. Crystal Knob (Right Circle)
  float knobMask = 1.0 - smoothstep(-aa, aa, dKnob);
  float socketShadow = smoothstep(H * 0.075, 0.0, max(dKnob, 0.0));
  faceCol *= mix(1.0, 0.45, socketShadow * 0.72);

  // Chrome bezel ring around knob socket
  float knobRing = (1.0 - smoothstep(0.0, H * 0.045, abs(dKnob - H * 0.018))) * (1.0 - knobMask);
  vec3 knobRingN = normalize(vec3(normalize(kp + 1e-5) * 0.7, 0.7));
  vec3 knobRingCol = sampleChromeEnv(knobRingN, u_hover * 0.75);
  faceCol = mix(faceCol, knobRingCol, knobRing * 0.85);

  // Knob 3D sphere shading
  vec2 kn = kp / knobR;
  float r2 = clamp(dot(kn, kn), 0.0, 1.0);
  float kz = sqrt(max(0.0, 1.0 - r2));
  vec3 knobN = normalize(vec3(kn.x, -kn.y, kz));

  // Cool silver-ice crystal base
  vec3 coolTop = vec3(0.95, 0.97, 1.0);
  vec3 coolMid = vec3(0.76, 0.82, 0.92);
  vec3 coolEdge = vec3(0.36, 0.42, 0.54);
  float coolGrad = clamp(0.5 + knobN.y * 0.5, 0.0, 1.0);
  vec3 coolCrystal = mix(coolEdge, coolMid, smoothstep(0.0, 0.7, kz));
  coolCrystal = mix(coolCrystal, coolTop, coolGrad * 0.65);
  // Subtle caustic swirl inside crystal
  float swirl = sin(kn.x * 4.5 + kn.y * 3.5 + u_time * 0.6) * 0.5 + 0.5;
  coolCrystal += vec3(0.18, 0.22, 0.35) * swirl * (1.0 - kz) * 0.45;

  // Warm amber-gold crystal on hover
  vec3 amberCore = vec3(1.0, 0.94, 0.62);
  vec3 amberMid = vec3(0.99, 0.52, 0.12);
  vec3 amberDeep = vec3(0.68, 0.18, 0.03);
  vec3 warmCrystal = mix(amberDeep, amberMid, smoothstep(0.0, 0.65, kz));
  warmCrystal = mix(warmCrystal, amberCore, pow(kz, 1.8) * 0.85);
  warmCrystal += vec3(1.0, 0.78, 0.35) * (1.0 - kz) * 0.45;

  vec3 knobCol = mix(coolCrystal, warmCrystal, u_hover * (1.0 - u_disabled));

  // Specular highlights on crystal dome
  vec3 lightDir = normalize(vec3(-0.42, 0.58, 0.70));
  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(knobN, halfVec), 0.0), 42.0);
  float rimSpec = pow(1.0 - kz, 3.2);
  knobCol += vec3(1.0) * spec * 0.95;
  knobCol += mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.88, 0.55), u_hover) * rimSpec * 0.45;

  // Subtle press darkening
  faceCol *= (1.0 - u_press * 0.06);
  knobCol *= (1.0 - u_press * 0.08);

  // Compose inner face + crystal knob
  vec3 innerComposite = mix(faceCol, knobCol, knobMask);
  // Subtle inner rim highlight
  innerComposite = mix(innerComposite * 0.88, innerComposite, groove);

  // Compose bezel + inner face
  vec3 finalCol = mix(innerComposite, bezelCol, bezelMask);

  // Disabled desaturation / dimming (kept legible and metallic)
  if (u_disabled > 0.01) {
    float luma = dot(finalCol, vec3(0.299, 0.587, 0.114));
    finalCol = mix(finalCol, vec3(luma) * 0.96, u_disabled * 0.72);
  }

  outColor = vec4(finalCol, outerMask);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Tactile Liquid-Chrome Button với WebGL 2 Shader:
 * - Viền kim loại lỏng phản chiếu ánh sáng 3D
 * - Mặt kim loại hạt mịn + hạt ánh sáng chuyển động + vệt sáng theo con trỏ
 * - Quả cầu pha lê bên phải chuyển sắc từ bạc băng giá sang hổ phách phát sáng khi hover
 */
export const LiquidChromeButton: React.FC<LiquidChromeButtonProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  isActive = false,
  className = '',
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [webglReady, setWebglReady] = useState(true);

  const stateRef = useRef({
    targetHover: 0,
    currentHover: 0,
    targetPress: 0,
    currentPress: 0,
    targetPointer: { x: 0.78, y: 0.5 },
    currentPointer: { x: 0.78, y: 0.5 },
    disabled: false,
  });

  useEffect(() => {
    stateRef.current.targetHover = !disabled && (hovered || isActive) ? 1 : 0;
  }, [hovered, isActive, disabled]);

  useEffect(() => {
    stateRef.current.targetPress = !disabled && pressed ? 1 : 0;
  }, [pressed, disabled]);

  useEffect(() => {
    stateRef.current.disabled = disabled;
  }, [disabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    if (!canvas || !btn) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      setWebglReady(false);
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      setWebglReady(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglReady(false);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglReady(false);
      return;
    }

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uPointer = gl.getUniformLocation(program, 'u_pointer');
    const uHover = gl.getUniformLocation(program, 'u_hover');
    const uPress = gl.getUniformLocation(program, 'u_press');
    const uDisabled = gl.getUniformLocation(program, 'u_disabled');

    const updateSize = () => {
      const rect = btn.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(btn);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let rafId = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      const s = stateRef.current;
      const lerpFactor = reducedMotion ? 1 : 0.14;

      s.currentHover += (s.targetHover - s.currentHover) * lerpFactor;
      s.currentPress += (s.targetPress - s.currentPress) * 0.25;
      s.currentPointer.x += (s.targetPointer.x - s.currentPointer.x) * lerpFactor;
      s.currentPointer.y += (s.targetPointer.y - s.currentPointer.y) * lerpFactor;

      const elapsed = reducedMotion ? 0 : (now - startTime) * 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uPointer, s.currentPointer.x, s.currentPointer.y);
      gl.uniform1f(uHover, s.currentHover);
      gl.uniform1f(uPress, s.currentPress);
      gl.uniform1f(uDisabled, s.disabled ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(rafId);
      setWebglReady(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    stateRef.current.targetPointer = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const isIlluminated = !disabled && (hovered || isActive);

  return (
    <div className="w-full flex justify-center">
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        disabled={disabled}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerMove={handlePointerMove}
        className={`relative flex h-[74px] w-full max-w-[330px] items-center rounded-full select-none transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 ${
          disabled
            ? 'cursor-not-allowed'
            : 'cursor-pointer active:scale-[0.98]'
        } ${className}`}
        style={{
          filter: isIlluminated
            ? 'drop-shadow(0 12px 22px rgba(15, 23, 42, 0.28)) drop-shadow(0 4px 16px rgba(249, 115, 22, 0.25))'
            : 'drop-shadow(0 10px 18px rgba(15, 23, 42, 0.18))',
        }}
      >
        {/* WebGL 2 Shader Canvas */}
        {webglReady ? (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full rounded-full"
          />
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border-4 border-slate-400 bg-gradient-to-b from-slate-100 to-slate-300 shadow-inner"
          />
        )}

        {/* Nhãn chữ monospace bên trái quả cầu pha lê */}
        <span
          className={`relative z-10 w-full pr-[70px] pl-6 text-center font-mono text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 ${
            disabled
              ? 'text-slate-500/80'
              : isIlluminated
                ? 'text-slate-950'
                : 'text-slate-800'
          }`}
        >
          {label}
        </span>

        {/* Icon nằm đúng tâm quả cầu pha lê (width = height = 74px => tâm = W - H*0.5) */}
        <span
          className={`pointer-events-none absolute top-0 right-0 bottom-0 z-10 flex w-[74px] items-center justify-center transition-colors duration-300 ${
            disabled
              ? 'text-slate-500/80'
              : isIlluminated
                ? 'text-white drop-shadow-[0_1px_2px_rgba(124,45,18,0.85)]'
                : 'text-slate-800'
          }`}
        >
          {icon}
        </span>
      </button>
    </div>
  );
};
