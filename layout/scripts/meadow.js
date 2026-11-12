/**
 * Nathan Juan — Crisp Retina 4x-MSAA Soft Painterly 120Hz Short-Grass Meadow Engine
 *
 * Aesthetic Inspiration:
 *   Kazuo Oga (Studio Ghibli gouache meadows), Andrei Tarkovsky ("Mirror"),
 *   Andrew Wyeth, and Kodak Portra 400 botanical color science.
 *
 * High-Momentum Wind + Ultra-Light 120Hz ProMotion Architecture (Short Meadow Turf, Zero Flowers):
 *   1. True Retina Resolution + Native Hardware 4x MSAA in Tile SRAM (zero blurry low-DPR upscaling!)
 *   2. Single-Pass 96x96 RGBA16F High-Momentum Fluid Wind & Canopy Sim (lingering 3.5–5s gesture wakes!)
 *   3. Inertial Gesture Coaster + Traveling 2D Swipe/Scroll Wave Pool (zero extra GPU passes!)
 *   4. Shorter, Supple 3-Segment (7-Vertex) Curved Silk Grass via Zero-IBO TRIANGLE_STRIP
 *   5. NaN-Proof Fast-Math Safe Shaders + Gentle Wandering Breeze, Random Gusts & Wind Shifts
 *   6. Pure Uninterrupted Grass & Luminous Wind-Aura Streamlines (100% flower-free)
 */

(function () {
'use strict';

// ============================================================================
// 1. SOFT PROCEDURAL WIND & AEOLIAN HARP SOUNDSCAPE (Zero External Assets)
// ============================================================================
class MeadowSoundscape {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.smoothSpeed = 0;
    this.lastChime = 0;
    this.noteCursor = 0;
    this.suspendTimer = null;
    this.scale = [293.66, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25, 739.99];
  }

  _makeBuffer(type) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * 4.5);
    const fade = Math.floor(sr * 0.12);
    const raw = new Float32Array(len + fade);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0, brown=0;
    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522; b5 = -0.76160*b5 - w*0.0168980;
        raw[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.10;
        b6 = w * 0.115926;
      } else {
        brown = (brown + 0.018 * w) / 1.018;
        raw[i] = brown * 3.0;
      }
    }
    const buf = this.ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    for (let i = 0; i < len - fade; i++) out[i] = raw[fade + i];
    for (let j = 0; j < fade; j++) {
      const t = j / fade;
      out[len - fade + j] = raw[len + j] * Math.cos(t * Math.PI * 0.5) + raw[j] * Math.sin(t * Math.PI * 0.5);
    }
    return buf;
  }

  _init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    const now = this.ctx.currentTime;

    this.master = this.ctx.createGain();
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.connect(this.ctx.destination);

    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this._makeBuffer('brown');
    windSrc.loop = true;
    this.windLP = this.ctx.createBiquadFilter();
    this.windLP.type = 'lowpass';
    this.windLP.frequency.setValueAtTime(240, now);
    this.windBP = this.ctx.createBiquadFilter();
    this.windBP.type = 'bandpass';
    this.windBP.frequency.setValueAtTime(290, now);
    this.windBP.Q.setValueAtTime(1.5, now);
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.022, now);

    windSrc.connect(this.windLP);
    this.windLP.connect(this.windGain);
    this.windLP.connect(this.windBP);
    this.windBP.connect(this.windGain);
    this.windGain.connect(this.master);
    windSrc.start(now);

    const grassSrc = this.ctx.createBufferSource();
    grassSrc.buffer = this._makeBuffer('pink');
    grassSrc.loop = true;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1350, now);
    this.grassBP = this.ctx.createBiquadFilter();
    this.grassBP.type = 'bandpass';
    this.grassBP.frequency.setValueAtTime(1950, now);
    this.grassBP.Q.setValueAtTime(2.2, now);
    this.grassGain = this.ctx.createGain();
    this.grassGain.gain.setValueAtTime(0.005, now);

    grassSrc.connect(hp);
    hp.connect(this.grassBP);
    this.grassBP.connect(this.grassGain);
    this.grassGain.connect(this.master);
    grassSrc.start(now);

    this.chimeLP = this.ctx.createBiquadFilter();
    this.chimeLP.type = 'lowpass';
    this.chimeLP.frequency.setValueAtTime(1150, now);
    const dL = this.ctx.createDelay(1.0); dL.delayTime.setValueAtTime(0.28, now);
    const dR = this.ctx.createDelay(1.0); dR.delayTime.setValueAtTime(0.39, now);
    const fb = this.ctx.createGain(); fb.gain.setValueAtTime(0.40, now);
    this.chimeLP.connect(this.master);
    this.chimeLP.connect(dL); this.chimeLP.connect(dR);
    dL.connect(fb); dR.connect(fb); fb.connect(dL);
    dL.connect(this.master); dR.connect(this.master);
  }

  async toggle() {
    if (!this.ctx) this._init();
    this.enabled = !this.enabled;
    clearTimeout(this.suspendTimer);
    const now = this.ctx.currentTime;
    if (this.enabled) {
      if (this.ctx.state !== 'running') await this.ctx.resume();
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
      this.master.gain.exponentialRampToValueAtTime(0.55, now + 0.65);
    } else {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
      this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      this.suspendTimer = setTimeout(() => {
        if (!this.enabled && this.ctx?.state === 'running') this.ctx.suspend();
      }, 500);
    }
    return this.enabled;
  }

  update(rawSpeed) {
    const s = Math.max(0, Math.min(1, rawSpeed));
    this.smoothSpeed += (s - this.smoothSpeed) * (s > this.smoothSpeed ? 0.14 : 0.024);
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return this.smoothSpeed;

    const now = this.ctx.currentTime;
    const v = this.smoothSpeed;
    const tau = s > v ? 0.06 : 0.55;
    this.windLP.frequency.setTargetAtTime(240 * Math.pow(1350 / 240, v), now, tau);
    this.windBP.frequency.setTargetAtTime(280 * Math.pow(1150 / 280, v), now, tau);
    this.windGain.gain.setTargetAtTime(0.020 + v * v * 0.28, now, tau);
    this.grassBP.frequency.setTargetAtTime(1850 + v * 1750, now, tau);
    this.grassGain.gain.setTargetAtTime(0.005 + v * 0.10, now, tau);

    if (v > 0.52 && now - this.lastChime > 2.2) {
      this.lastChime = now;
      this.noteCursor = (this.noteCursor + (Math.random() < 0.65 ? 1 : 2)) % this.scale.length;
      const freq = this.scale[this.noteCursor];
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.018 * Math.min(1, v), now + 0.55);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
      osc.connect(env); env.connect(this.chimeLP);
      osc.start(now); osc.stop(now + 3.5);
    }
    return this.smoothSpeed;
  }
}

// ============================================================================
// 2. ZERO-ALLOCATION MATRIX MATH
// ============================================================================
function mat4Perspective(out, fovyRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovyRad * 0.5);
  const nf = 1.0 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4LookAt(out, eye, center, up) {
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
  out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0;
  out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0;
  out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0;
  out[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
  out[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
  out[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
  out[15]=1;
  return out;
}

function mat4Multiply(out, a, b) {
  for (let i = 0; i < 4; i++) {
    const ai0=a[i], ai1=a[i+4], ai2=a[i+8], ai3=a[i+12];
    out[i]    = ai0*b[0]  + ai1*b[1]  + ai2*b[2]  + ai3*b[3];
    out[i+4]  = ai0*b[4]  + ai1*b[5]  + ai2*b[6]  + ai3*b[7];
    out[i+8]  = ai0*b[8]  + ai1*b[9]  + ai2*b[10] + ai3*b[11];
    out[i+12] = ai0*b[12] + ai1*b[13] + ai2*b[14] + ai3*b[15];
  }
  return out;
}

// ============================================================================
// 3. GLSL ES 3.00 SHADERS (Short Plush Meadow Turf · High-Momentum Single-Pass Sim)
// ============================================================================
const FULLSCREEN_VS = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const NOISE_LIB_GLSL = `
vec2 hashGrad22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

vec4 hash42(vec2 p) {
  vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec3 noised2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u  = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hashGrad22(i);
  vec2 gb = hashGrad22(i + vec2(1.0, 0.0));
  vec2 gc = hashGrad22(i + vec2(0.0, 1.0));
  vec2 gd = hashGrad22(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k1 = vb - va, k2 = vc - va, k4 = va - vb - vc + vd;
  float val = va + u.x * k1 + u.y * k2 + u.x * u.y * k4;
  vec2 grad = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)
            + du * (u.yx * k4 + vec2(k1, k2));
  return vec3(val, grad);
}
`;

// Stage-neutral math & terrain helpers (safe under Metal -ffast-math unconditional select!)
const SHARED_FAST_GLSL = `
vec2 safeNorm2(vec2 v, vec2 fb) {
  float l2 = dot(v, v);
  return (l2 > 1e-8) ? (v * inversesqrt(max(l2, 1e-8))) : fb;
}

vec3 safeNorm3(vec3 v, vec3 fb) {
  float l2 = dot(v, v);
  return (l2 > 1e-8) ? (v * inversesqrt(max(l2, 1e-8))) : fb;
}

vec2 cleanVec2(vec2 v, float lim) {
  bvec2 bad = bvec2(isnan(v.x) || isinf(v.x), isnan(v.y) || isinf(v.y));
  return clamp(mix(v, vec2(0.0), bad), vec2(-lim), vec2(lim));
}

highp uint pcg_hash(highp uint v) {
  highp uint state = v * 747796405u + 2891336453u;
  highp uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

vec2 uvToFrustumXZ(vec2 uv, float aspect) {
  float z = mix(5.8, -10.4, uv.y);
  float halfW = mix(5.3, 7.8, uv.y) * max(0.75, aspect);
  float x = (uv.x * 2.0 - 1.0) * halfW;
  return vec2(x, z);
}

float evalHillHeight(vec2 xz) {
  float swell1 = sin(xz.x * 0.21 + xz.y * 0.17 + 0.5) * 0.38;
  float swell2 = cos(xz.x * 0.34 - xz.y * 0.27 - 0.3) * 0.19;
  float ridge  = sin(xz.y * 0.25 - 1.0) * 0.26;
  return swell1 + swell2 + ridge;
}

vec3 evalHillNormal(vec2 xz) {
  float dhdx = 0.21 * 0.38 * cos(xz.x * 0.21 + xz.y * 0.17 + 0.5)
             - 0.34 * 0.19 * sin(xz.x * 0.34 - xz.y * 0.27 - 0.3);
  float dhdz = 0.17 * 0.38 * cos(xz.x * 0.21 + xz.y * 0.17 + 0.5)
             + 0.27 * 0.19 * sin(xz.x * 0.34 - xz.y * 0.27 - 0.3)
             + 0.25 * 0.26 * cos(xz.y * 0.25 - 1.0);
  return safeNorm3(vec3(-dhdx, 1.0, -dhdz), vec3(0.0, 1.0, 0.0));
}

float evalCloudMask(vec2 uv, vec2 drift) {
  vec2 p = uv * 3.1 - drift * 2.2;
  float c = sin(p.x * 1.35 + p.y * 0.95 + sin(p.y * 1.65 - p.x * 0.82) * 0.85) * 0.50
          + sin(p.x * 0.78 - p.y * 1.52 + 2.1) * 0.32
          + cos(p.x * 1.92 + p.y * 1.60 - 1.4) * 0.18;
  return smoothstep(-0.34, 0.44, c);
}
`;

// Fragment-shader-only deep botanical film curve & optical framing (zero white highlight bleach!)
const GRADE_FS_GLSL = `
vec3 gradeSoftFilm(vec3 hdr, vec2 screenUv, vec2 fragPx, vec3 horizonMistTint, vec3 edgeMistTint) {
  // 1. Subtle distant atmospheric depth near the upper horizon (keeps grass rich & dark)
  float mistVeil = smoothstep(0.56, 1.06, screenUv.y);
  hdr = mix(hdr, hdr * 0.88 + horizonMistTint * 0.12, mistVeil * 0.18);

  // 2. Deep botanical filmic shoulder (preserves dark greens & rich chroma, never desaturates to white)
  vec3 x = max(vec3(0.0), hdr);
  vec3 mapped = (x * (2.15 * x + 0.055)) / (x * (2.05 * x + 0.68) + 0.135);

  float luma = dot(mapped, vec3(0.2126, 0.7152, 0.0722));
  mapped = mix(vec3(luma), mapped, 1.08);

  // 3. Soft dark optical framing vignette
  vec2 c = screenUv - 0.5;
  float vig = smoothstep(0.18, 0.90, dot(c, c));
  mapped = mix(mapped, mix(mapped * 0.74, edgeMistTint * 0.30, 0.12), vig * 0.56);

  // 4. True 2.2 gamma (eliminates pale fourth-root pastel lift; 1e-6 floor prevents fast-math log2(0))
  vec3 srgb = pow(clamp(mapped, 1e-6, 1.0), vec3(1.0 / 2.2));

  // Imperceptible 8-bit anti-banding dither only
  float dither = fract(dot(fragPx, vec2(0.75487766, 0.56984029)));
  return clamp(srgb + (dither - 0.5) * (0.7 / 255.0), 0.0, 1.0);
}
`;

// --- STARTUP BAKE PASS 1 (512x512 RGBA16F Linear-Filtered) ---
const BAKE_STATIC_FS = `#version 300 es
precision highp float;
precision highp int;
${NOISE_LIB_GLSL}
${SHARED_FAST_GLSL}
in vec2 vUv;
out vec4 fragColor;
uniform float uAspect;

void main() {
  vec2 xz = uvToFrustumXZ(vUv, uAspect);

  // Bias-free multi-scale curl cowlicks (zero uniform global lean!)
  vec3 n1 = noised2D(xz * 0.17 + vec2(2.8, -1.4));
  vec2 c1 = vec2(n1.z, -n1.y);
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  vec3 n2 = noised2D((rot * xz) * 0.44 + vec2(-5.2, 4.1));
  vec2 c2 = rot * vec2(n2.z, -n2.y);
  vec3 n3 = noised2D(xz * 0.92 + vec2(8.1, 3.4));
  vec2 c3 = vec2(n3.z, -n3.y);

  vec2 p = xz * 1.65;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d1 = 8.0, d2 = 8.0;
  float cellHeight = 0.5;
  float cellSpecies = 0.5;
  vec2 nearestVec = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec4 h = hash42(ip + g);
      vec2 o = 0.16 + 0.68 * h.xy;
      vec2 r = g + o - fp;
      float dSq = dot(r, r);
      if (dSq < d1) {
        d2 = d1; d1 = dSq;
        cellHeight = h.z;
        cellSpecies = h.w;
        nearestVec = r;
      } else if (dSq < d2) {
        d2 = dSq;
      }
    }
  }
  float dist1 = sqrt(max(0.0, d1));
  float border = sqrt(max(0.0, d2)) - dist1;

  // Natural tuft rosette splay + cowlick swirl
  vec2 radialOut = safeNorm2(-nearestVec, vec2(0.7071, 0.7071));
  float swirlSign = (cellSpecies > 0.5) ? 1.0 : -1.0;
  vec2 tuftSwirl = safeNorm2(radialOut * 0.68 + vec2(-radialOut.y, radialOut.x) * (0.45 * swirlSign), radialOut);
  vec2 bedFlow = c1 * 0.56 + c2 * 0.48 + c3 * 0.30 + tuftSwirl * (0.42 * smoothstep(0.04, 0.48, dist1));

  // Varied tussock & mossy-hollow height relief (cropped hollows next to plush grass clumps)
  float macroDrift = noised2D(xz * 0.24 - 1.9).x * 0.5 + 0.5;
  float tuftDome = mix(0.60, 1.34, mix(cellHeight, macroDrift, 0.44))
                 * mix(0.76, 1.04, smoothstep(0.0, 0.26, border))
                 * mix(1.06, 0.90, clamp(dist1, 0.0, 1.0));

  float macro1 = noised2D(xz * 0.18 + 7.4).x * 0.5 + 0.5;
  float macro2 = noised2D(xz * 0.46 - 3.8).x * 0.5 + 0.5;
  float fertility = mix(mix(macro1, macro2, 0.42), cellSpecies, 0.32);

  fragColor = vec4(bedFlow, tuftDome, fertility);
}`;

// --- STARTUP BAKE PASS 2 (512x512 RGBA16F Linear-Filtered Soft Self-Shadow) ---
const BAKE_SHADOW_FS = `#version 300 es
precision highp float;
precision highp int;
${NOISE_LIB_GLSL}
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uStaticLUT;
uniform vec2 uSunDirUV;

void main() {
  float myH = texture(uStaticLUT, vUv).z;
  float occ = 0.0;
  for (int i = 1; i <= 6; i++) {
    float stepFrac = float(i) * 0.0044;
    float neighborH = texture(uStaticLUT, clamp(vUv + uSunDirUV * stepFrac, 0.002, 0.998)).z;
    float diff = neighborH - myH - float(i) * 0.028;
    occ += max(0.0, diff) * (1.05 - float(i) * 0.11);
  }
  float selfShadow = clamp(1.0 - occ * 0.72, 0.48, 1.0);
  float softMossWave = noised2D(vUv * 22.0).x * 0.5 + 0.5;
  fragColor = vec4(selfShadow, softMossWave, 0.0, 1.0);
}`;

// --- SINGLE UNIFIED 96x96 PHYSICS PASS: ROLLING WIND WAVES (.xy) + CUSHIONED CANOPY (.zw) ---
const WIND_SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${NOISE_LIB_GLSL}
${SHARED_FAST_GLSL}
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uPrevWind;
uniform vec2 uTexel;
uniform float uDt;
uniform float uTime;
uniform float uAspect;
uniform vec2 uAmbientWind;
uniform vec2 uWindTravel;
uniform float uBreezeWavePhase;
uniform int uNumImpulses;
uniform vec4 uImpPosForce[12];
uniform vec2 uImpMeta[12];

void main() {
  vec4 cL = texture(uPrevWind, vUv - vec2(uTexel.x, 0.0));
  vec4 cR = texture(uPrevWind, vUv + vec2(uTexel.x, 0.0));
  vec4 cB = texture(uPrevWind, vUv - vec2(0.0, uTexel.y));
  vec4 cT = texture(uPrevWind, vUv + vec2(0.0, uTexel.y));

  vec2 nL = cleanVec2(cL.xy, 4.0);
  vec2 nR = cleanVec2(cR.xy, 4.0);
  vec2 nB = cleanVec2(cB.xy, 4.0);
  vec2 nT = cleanVec2(cT.xy, 4.0);
  vec2 neighborAvg = 0.25 * (nL + nR + nB + nT);
  float curl = 0.5 * (nR.y - nL.y - nT.x + nB.x);

  vec4 prevRaw = texture(uPrevWind, vUv);
  vec2 prevVel = cleanVec2(prevRaw.xy, 4.0);
  vec2 prevCanopy = cleanVec2(prevRaw.zw, 4.0);

  vec2 advStep = vec2(prevVel.x / max(0.75, uAspect), prevVel.y) * (uDt * 0.44);
  vec2 backUv  = clamp(vUv - advStep, 0.004, 0.996);
  vec2 advected = cleanVec2(texture(uPrevWind, backUv).xy, 4.0);

  // Asymmetric breeze transport: gusts drift gracefully downwind while leaving a long, soft wake
  float rise = smoothstep(-0.04, 0.20, length(advected) - length(prevVel));
  vec2 transport = mix(prevVel, advected, mix(clamp(uDt * 0.45, 0.0, 0.05), 0.76, rise));
  vec2 vel = mix(transport, neighborAvg, clamp(uDt * 1.45, 0.0, 0.11)) * exp(-0.18 * uDt);
  vel += vec2(-(nT.x - nB.x), nR.y - nL.y) * curl * 1.85 * uDt;

  // Spatially varied wind streamlines + sculpted rolling wind waves (calm hollows & sweeping crests!)
  float breezeSpd = length(uAmbientWind);
  vec2 breezeDir = safeNorm2(uAmbientWind, vec2(0.82, 0.57));
  vec2 breezePerp = vec2(-breezeDir.y, breezeDir.x);

  vec2 aspectUv = vec2((vUv.x - 0.5) * max(0.75, uAspect), vUv.y - 0.5);
  vec3 g1 = noised2D(aspectUv * 2.25 - uWindTravel * 0.56);
  vec3 g2 = noised2D(aspectUv * 4.65 + vec2(3.7, -2.3) - uWindTravel * 0.94);

  // Local wind angle curves by +-55 deg across eddies so the field never points all one way
  float angleSwirl = g1.x * 0.86 + g2.x * 0.44;
  float ca = cos(angleSwirl), sa = sin(angleSwirl);
  vec2 localDir  = vec2(breezeDir.x * ca - breezeDir.y * sa, breezeDir.x * sa + breezeDir.y * ca);
  vec2 localPerp = vec2(-localDir.y, localDir.x);

  float alongCoord  = dot(aspectUv, breezeDir);
  float acrossCoord = dot(aspectUv, breezePerp);

  // Primary curved crescent wave train (sharpened crests + calm lulls between waves)
  float warpAlong1 = alongCoord * 8.2 - uBreezeWavePhase * 1.30 + g1.x * 2.15 + sin(acrossCoord * 4.3 + g2.x * 1.4) * 0.78;
  float rawWave1   = sin(warpAlong1) * 0.5 + 0.5;
  float waveBand1  = rawWave1 * rawWave1 * (3.0 - 2.0 * rawWave1);
  waveBand1 *= waveBand1;

  // Secondary offset ripple train broken into localized wind corridors across the page
  float warpAlong2 = alongCoord * 13.0 - uBreezeWavePhase * 1.92 - g2.x * 2.35 + cos(acrossCoord * 6.5 - g1.x * 1.6) * 0.68;
  float rawWave2   = sin(warpAlong2) * 0.5 + 0.5;
  float waveBand2  = rawWave2 * rawWave2 * rawWave2;

  float corridor1 = smoothstep(-0.28, 0.48, g1.x * 0.72 + sin(acrossCoord * 3.6 + uTime * 0.24) * 0.45);
  float corridor2 = smoothstep(-0.20, 0.52, -g1.x * 0.55 + g2.x * 0.68);

  float waveStrength = 0.06 + 2.45 * waveBand1 * (0.30 + 0.70 * corridor1) + 1.55 * waveBand2 * corridor2;
  vec2 eddySwirl = (vec2(g1.z, -g1.y) * 0.58 + vec2(g2.z, -g2.y) * 0.34) * (0.14 + 0.36 * breezeSpd);

  vec2 ambient = localDir * (breezeSpd * waveStrength) + localPerp * (g2.x * 0.24 * breezeSpd) + eddySwirl;

  // Dual-rate relaxation: tracks rolling ambient wind waves crisply (1.85/s), while strong touch
  // swipes above ambient linger for ~4–5s (0.18/s) before melting back into the meadow waves!
  float speedDiff = length(vel) - length(ambient);
  float touchWake = smoothstep(0.22, 1.25, speedDiff);
  float relaxRate = mix(1.85, 0.18, touchWake);
  vel += (ambient - vel) * (1.0 - exp(-relaxRate * uDt));

  for (int i = 0; i < 12; i++) {
    if (i >= uNumImpulses) break;
    vec2 pt = uImpPosForce[i].xy;
    vec2 fc = uImpPosForce[i].zw;
    float rad = max(0.03, uImpMeta[i].x);
    float mode = uImpMeta[i].y;
    float w = 0.0;
    if (mode > 2.5) {
      // Localized crescent natural wind tongue (sweeps a 35%–50% wide corridor, never uniform across page!)
      vec2 fDir = safeNorm2(fc, breezeDir);
      vec2 fPerp = vec2(-fDir.y, fDir.x);
      vec2 rel = vUv - pt;
      rel.x *= max(0.75, uAspect);
      float across = clamp(dot(rel, fPerp), -8.0, 8.0);
      float along = clamp((dot(rel, fDir) - 0.34 * across * across) / rad, -8.0, 8.0);
      float lobes = 0.72 + 0.28 * sin(across * 7.4 + uTime * 1.35) * cos(across * 3.7 - uTime * 0.90);
      w = exp(-along * along * 1.30) * exp(-across * across * 2.75) * lobes;
    } else if (mode > 1.5) {
      // Sculpted crescent touch/scroll breeze wave along your gesture corridor
      vec2 fDir = safeNorm2(fc, breezeDir);
      vec2 fPerp = vec2(-fDir.y, fDir.x);
      vec2 rel = vUv - pt;
      rel.x *= max(0.75, uAspect);
      float across = clamp(dot(rel, fPerp), -8.0, 8.0);
      float along = clamp((dot(rel, fDir) - 0.18 * across * across) / rad, -8.0, 8.0);
      float lobes = 0.76 + 0.24 * sin(across * 6.2 + uTime * 1.2) * cos(across * 3.1 - uTime * 0.85);
      w = exp(-along * along * 1.25) * exp(-across * across * 1.08) * lobes;
    } else if (mode > 0.5) {
      float dy = clamp((vUv.y - pt.y) / rad, -8.0, 8.0);
      float lobes = 0.76 + 0.24 * sin(vUv.x * 8.0 + uTime * 1.15) * cos(vUv.x * 3.8 - uTime * 0.85);
      w = exp(-dy * dy * 1.25) * lobes;
    } else {
      // Soft radial breeze cushion
      vec2 d = vUv - pt;
      d.x *= max(0.75, uAspect);
      float dNorm2 = min(64.0, dot(d, d) / (rad * rad));
      w = exp(-dNorm2);
    }
    vel += fc * w;
  }

  vel = cleanVec2(vel, 3.8);
  float speed = length(vel);
  if (speed > 3.8) vel *= (3.8 / max(speed, 3.8));

  // Cushioned, responsive grass canopy bend (.zw):
  // Follows fresh/aligned breezes briskly (~0.26s) while keeping soft uncurling inertia (~0.65s)
  // when wind opposes the current grass lean so blades never snap or flip abruptly!
  vec2 nbCanopy = 0.25 * (
    cleanVec2(cL.zw, 3.8) + cleanVec2(cR.zw, 3.8) +
    cleanVec2(cB.zw, 3.8) + cleanVec2(cT.zw, 3.8)
  );
  vec2 canopy = mix(prevCanopy, nbCanopy, clamp(uDt * 1.25, 0.0, 0.08));
  float oppose = clamp(-dot(safeNorm2(canopy, localDir), safeNorm2(vel, localDir)), 0.0, 1.0);
  float followRate = mix(3.85, 1.55, oppose * smoothstep(0.15, 0.95, length(canopy)));
  canopy += (vel - canopy) * (1.0 - exp(-followRate * uDt));
  canopy = cleanVec2(canopy, 3.8);

  fragColor = vec4(vel, canopy);
}`;

// --- DARK VELVETY MOSS & WARM THATCH UNDERSTORY ---
const GROUND_VS = `#version 300 es
precision highp float;
precision highp int;
${SHARED_FAST_GLSL}
uniform mat4 uViewProj;
uniform float uAspect;
uniform vec2 uCloudDrift;
out vec2 vUv;
out float vCloud;
void main() {
  int quadId = gl_InstanceID;
  int gx = quadId % 28;
  int gz = quadId / 28;
  const vec2 corners[4] = vec2[4](vec2(0.0,0.0), vec2(1.0,0.0), vec2(0.0,1.0), vec2(1.0,1.0));
  const int idx[6] = int[6](0, 1, 2, 2, 1, 3);
  vec2 c = corners[idx[gl_VertexID]];
  vec2 gridUv = (vec2(float(gx), float(gz)) + c) / 28.0;
  vec2 expandedUv = mix(vec2(-0.12), vec2(1.12), gridUv);
  vUv = clamp(expandedUv, 0.002, 0.998);
  vCloud = evalCloudMask(vUv, uCloudDrift);
  vec2 xz = uvToFrustumXZ(expandedUv, uAspect);
  gl_Position = uViewProj * vec4(xz.x, evalHillHeight(xz), xz.y, 1.0);
}`;

const GROUND_FS = `#version 300 es
precision highp float;
precision highp int;
${SHARED_FAST_GLSL}
${GRADE_FS_GLSL}
in vec2 vUv;
in float vCloud;
out vec4 fragColor;

uniform sampler2D uStaticLUT;
uniform sampler2D uShadowLUT;
uniform vec2 uResolution;
uniform vec3 uColorGround;
uniform vec3 uColorStraw;
uniform vec3 uColorShadowTint;
uniform vec3 uHorizonMistTint;
uniform vec3 uEdgeMistTint;

void main() {
  vec4 stat = texture(uStaticLUT, vUv);
  vec2 shad = texture(uShadowLUT, vUv).xy;
  float cloud = clamp(vCloud, 0.0, 1.0);

  vec3 softMoss = uColorGround * mix(0.88, 1.12, clamp(shad.y, 0.0, 1.0));
  vec3 warmThatch = uColorStraw * 0.14 * smoothstep(0.50, 0.92, clamp(stat.w, 0.0, 1.0));
  vec3 col = (softMoss + warmThatch) * clamp(shad.x, 0.48, 1.0);
  col = mix(col * 0.68 + uColorShadowTint * 0.18, col * 1.10, cloud);

  vec2 screenUv = gl_FragCoord.xy / max(vec2(1.0), uResolution);
  fragColor = vec4(gradeSoftFilm(col, screenUv, gl_FragCoord.xy, uHorizonMistTint, uEdgeMistTint), 1.0);
}`;

// --- 3-SEGMENT (7-VERTEX) VARIED BOTANICAL MEADOW GRASS (3 MORPHOLOGIES · ZERO FLOWERS) ---
const GRASS_VS = `#version 300 es
precision highp float;
precision highp int;
${SHARED_FAST_GLSL}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform float uAspect;
uniform vec2 uResolution;
uniform float uFlutterPhase;
uniform float uActiveBlades;
uniform float uWidthScale;
uniform vec2 uCloudDrift;
uniform sampler2D uStaticLUT;
uniform sampler2D uShadowLUT;
uniform sampler2D uWindCloud;

out float vH;
out float vSide;
out float vWindTilt;
out float vHash;
out float vStrawFactor;
out float vClumpVar;
out float vSelfShadow;
out float vCloud;
out vec3 vWorldPos;
out vec3 vNormal;
out vec3 vTangent;
out vec3 vWidthAxis;

void main() {
  uint id = uint(gl_InstanceID);

  uvec2 r2 = uvec2(id * 3242174889u, id * 2447445414u);
  vec2 baseUv = vec2(r2) * 2.3283064365386963e-10;
  vec2 rootXZ = uvToFrustumXZ(baseUv, uAspect);
  float hillY = evalHillHeight(rootXZ);

  uint h0 = pcg_hash(id);
  uint h1 = pcg_hash(h0);
  float rA = float(h0 & 0xFFFFu) * (1.0 / 65535.0);
  float rB = float((h0 >> 16u) & 0xFFFFu) * (1.0 / 65535.0);
  float rC = float(h1 & 0xFFFFu) * (1.0 / 65535.0);
  float rTall = float((h1 >> 16u) & 0xFFFFu) * (1.0 / 65535.0);

  vec4 stat = textureLod(uStaticLUT, baseUv, 0.0);
  float selfShad = clamp(textureLod(uShadowLUT, baseUv, 0.0).x, 0.44, 1.0);
  vec4 windRaw   = textureLod(uWindCloud, baseUv, 0.0);
  // Read the cushioned canopy bend (.zw) so blades respond lushly without snapping on reversal!
  vec2 windXY    = cleanVec2(windRaw.zw, 3.8);
  float cloudVal = evalCloudMask(baseUv, uCloudDrift);

  float patchZone = clamp(stat.w, 0.0, 1.0);
  float strawZone = smoothstep(0.40, 0.90, patchZone);
  bool isWispyTall = (rTall > (0.85 - strawZone * 0.11));
  bool isFineTurf  = (!isWispyTall) && (rTall < 0.50);
  float lodScale = clamp((uActiveBlades - float(id)) / max(1.0, uActiveBlades * 0.08), 0.0, 1.0);

  // 7-vertex (3-segment) TRIANGLE_STRIP: vertices 0..5 = pairs, vertex 6 = pointed silk tip
  int vid = gl_VertexID;
  bool isTip = (vid == 6);
  float t = isTip ? 1.0 : float(vid >> 1) * (1.0 / 3.0);
  float side = isTip ? 0.0 : ((vid & 1) == 0 ? -1.0 : 1.0);

  // Bias-free cowlick swirl + varied per-blade rosette splay so grass never combs one way
  vec2 bedCurl = cleanVec2(stat.xy, 4.0);
  vec2 randDir = vec2(cos(rA * 6.283185), sin(rA * 6.283185));
  float splayMix = isFineTurf ? 0.56 : (isWispyTall ? 0.30 : 0.40);
  vec2 baseDir = safeNorm2(mix(bedCurl, randDir, splayMix), randDir);
  vec2 basePerp = vec2(-baseDir.y, baseDir.x);

  // 3 Distinct Botanical Grass Morphologies (fine mossy fescue, broad clover-turf, wispy tussock stalks)
  float tuftScale = clamp(stat.z, 0.56, 1.38);
  float baseH = isWispyTall
    ? mix(0.66, 0.94, rB)
    : (isFineTurf ? mix(0.30, 0.52, rB) : mix(0.46, 0.72, rB));
  float bladeH = max(0.02, baseH * tuftScale * lodScale);

  float baseW = isWispyTall
    ? mix(0.048, 0.072, rC)
    : (isFineTurf ? mix(0.044, 0.064, rC) : mix(0.064, 0.090, rC));
  float bladeW = baseW * uWidthScale;

  float stiffness = isWispyTall
    ? mix(0.35, 0.52, rB)
    : (isFineTurf ? mix(0.68, 0.96, rB) : mix(0.46, 0.68, rB));
  float restLean = mix(0.14, 0.48, fract(rA * 3.7 + rB));

  vec2 instWindXZ    = vec2(windXY.x, -windXY.y);
  float windSpeed    = length(instWindXZ);
  float gustBoost    = 1.0 + 0.44 * smoothstep(0.38, 2.40, windSpeed);
  vec2 dynamicBendXZ = instWindXZ * (bladeH * 1.16 * gustBoost / stiffness);
  vec2 windDir       = safeNorm2(instWindXZ, baseDir);
  vec2 windPerp      = vec2(-windDir.y, windDir.x);

  float flutterGate = smoothstep(0.08, 1.80, windSpeed);
  float phase = dot(rootXZ, windDir) * 2.8 + rA * 24.0;
  float t2 = t * t;
  float inlineFlut = sin(uFlutterPhase + phase) * bladeH * (0.016 + 0.076 * flutterGate) * (t2 * t);
  float crossFlut  = sin(uFlutterPhase * 1.42 + rC * 31.0) * bladeH * (0.012 + 0.056 * flutterGate) * t2;

  vec2 totalTipXZ = baseDir * (bladeH * restLean) + dynamicBendXZ + windDir * inlineFlut + windPerp * crossFlut;

  float horizDist = length(totalTipXZ);
  float maxReach = bladeH * 1.12;
  if (horizDist > 1e-4) {
    float softDist = maxReach * (1.0 - exp(-horizDist / max(1e-4, maxReach * 0.82)));
    totalTipXZ *= (softDist / horizDist);
    horizDist = softDist;
  }
  float bowRatio = clamp(horizDist / max(1e-4, maxReach), 0.0, 0.96);
  float tipLocalY = bladeH * sqrt(max(0.05, 1.0 - bowRatio * bowRatio * 0.92));

  // Natural mid-blade arch height & organic S-curve twist per blade
  vec2 midTwistXZ = basePerp * (bladeH * (rC - 0.5) * 0.22 * (1.0 - bowRatio * 0.55));
  float midArchY  = bladeH * mix(mix(0.58, 0.74, rA), 0.42, bowRatio);

  vec3 p0 = vec3(rootXZ.x, hillY, rootXZ.y);
  vec3 p1 = p0 + vec3(totalTipXZ.x * 0.44 + midTwistXZ.x, midArchY, totalTipXZ.y * 0.44 + midTwistXZ.y);
  vec3 p2 = p0 + vec3(totalTipXZ.x, tipLocalY, totalTipXZ.y);

  float u = 1.0 - t;
  vec3 spine = (u * u) * p0 + (2.0 * u * t) * p1 + t2 * p2;
  vec3 rawTang = 2.0 * u * (p1 - p0) + 2.0 * t * (p2 - p1);
  vec3 tang = safeNorm3(rawTang, vec3(0.0, 1.0, 0.0));

  vec2 leanHoriz = safeNorm2(totalTipXZ, baseDir);
  vec3 geomRight = safeNorm3(vec3(-leanHoriz.y, 0.0, leanHoriz.x), vec3(1.0, 0.0, 0.0));
  vec3 toCam = uCamPos - spine;
  float camDist = max(0.5, length(toCam));
  vec3 viewDir = safeNorm3(toCam, vec3(0.0, 1.0, 0.0));

  vec3 bbRight = safeNorm3(cross(viewDir, tang), geomRight);
  float align = dot(bbRight, geomRight);
  bbRight *= align * inversesqrt(align * align + 0.06);

  vec3 faceNorm = safeNorm3(cross(geomRight, tang), vec3(0.0, 1.0, 0.0));
  if (faceNorm.y < 0.0) faceNorm = -faceNorm;
  float ndotv = clamp(abs(dot(faceNorm, viewDir)), 0.0, 1.0);
  float oneMinusNV = 1.0 - ndotv;
  vec3 finalRight = safeNorm3(mix(geomRight, bbRight, (oneMinusNV * oneMinusNV) * 0.50), geomRight);

  // Silky botanical taper + exact 3D isotropic perspective pixel-width floor
  float taperExp = isWispyTall ? 0.64 : 0.52;
  float taper = (1.0 - t * taperExp) * sqrt(max(0.0, 1.0 - t * 0.95));
  float worldPerPx = camDist / max(1.0, 2.0826 * uResolution.y);
  float minWorldHalfW = 1.05 * worldPerPx * taper;
  float halfW = max(0.5 * bladeW * taper, minWorldHalfW);
  vec3 worldPos = spine + finalRight * (side * halfW);

  gl_Position = uViewProj * vec4(worldPos, 1.0);
  vH = t;
  vSide = side;
  vWindTilt = clamp(windSpeed / 1.75, 0.0, 1.0);
  vHash = rC;
  vStrawFactor = isWispyTall
    ? (0.42 + strawZone * 0.42)
    : (strawZone * 0.38 + smoothstep(0.76, 1.0, rA) * 0.24);
  vClumpVar = clamp(patchZone * 0.68 + rB * 0.32, 0.0, 1.0);
  vSelfShadow = selfShad;
  vCloud = cloudVal;
  vWorldPos = worldPos;
  vNormal = faceNorm;
  vTangent = tang;
  vWidthAxis = finalRight;
}`;

const GRASS_FS = `#version 300 es
precision highp float;
precision highp int;
${SHARED_FAST_GLSL}
${GRADE_FS_GLSL}

in float vH;
in float vSide;
in float vWindTilt;
in float vHash;
in float vStrawFactor;
in float vClumpVar;
in float vSelfShadow;
in float vCloud;
in vec3 vWorldPos;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vWidthAxis;

out vec4 fragColor;

uniform vec3 uCamPos;
uniform vec2 uResolution;
uniform vec3 uSunDir;
uniform vec3 uColorRoot;
uniform vec3 uColorMid;
uniform vec3 uColorTip;
uniform vec3 uColorStraw;
uniform vec3 uColorShadowTint;
uniform vec3 uColorSpecSun;
uniform vec3 uColorSpecSky;
uniform vec3 uHorizonMistTint;
uniform vec3 uEdgeMistTint;

void main() {
  vec3 V = safeNorm3(uCamPos - vWorldPos, vec3(0.0, 1.0, 0.0));
  vec3 L = safeNorm3(uSunDir, vec3(0.45, 0.60, -0.66));
  vec3 T = safeNorm3(vTangent, vec3(0.0, 1.0, 0.0));
  vec3 B = safeNorm3(vWidthAxis, vec3(1.0, 0.0, 0.0));

  // Painterly Gouache Canopy Normal Cohesion
  vec3 hillN = evalHillNormal(vWorldPos.xz);
  vec3 leafN = safeNorm3(vNormal + vSide * 0.36 * B, vec3(0.0, 1.0, 0.0));
  if (dot(leafN, V) < 0.0) leafN = -leafN;
  vec3 cushionN = safeNorm3(mix(leafN, hillN, 0.64), hillN);
  vec3 N = safeNorm3(mix(cushionN, leafN, smoothstep(0.10, 0.82, vWindTilt) * 0.52), hillN);

  float h2 = vH * vH;
  vec3 greenBlade = mix(uColorRoot, uColorMid, smoothstep(0.0, 0.52, vH));
  greenBlade = mix(greenBlade, uColorTip, smoothstep(0.45, 1.0, vH));

  // Rich botanical hue variety across patches: cool forest viridian, woodland clover, & warm olive-russet
  vec3 coolViridian = vec3(greenBlade.r * 0.70, greenBlade.g * 0.96, greenBlade.b * 1.38 + greenBlade.g * 0.13);
  vec3 foliageCol = mix(coolViridian, greenBlade, smoothstep(0.16, 0.72, vClumpVar));

  vec3 warmGrassBlade = mix(uColorMid * 0.88, uColorStraw, smoothstep(0.22, 0.92, vH));
  vec3 baseCol = mix(foliageCol, warmGrassBlade, vStrawFactor * smoothstep(0.18, 0.90, vH));

  // Richer per-blade & per-clump tonal texture across silk ribbons
  float centerSoft = 1.0 - 0.11 * (vSide * vSide);
  baseCol *= mix(0.76, 1.24, vHash) * mix(0.90, 1.10, vClumpVar) * centerSoft;

  // Deep velvety tuft valleys (stays dark and lush at the roots even when bent by wind)
  float restAO = mix(0.24, 0.96, smoothstep(0.0, 0.86, vH)) * vSelfShadow;
  float flatAO = mix(0.44, 0.92, vH) * vSelfShadow;
  float dynAO  = mix(restAO, flatAO, smoothstep(0.08, 0.85, vWindTilt));

  // Rich dark emerald-olive leaf underside (zero white or chalky grey sheen!)
  vec3 underside = mix(uColorRoot * 1.30, baseCol * 0.86, smoothstep(0.15, 0.95, vH));
  vec3 albedo = mix(baseCol, underside, vWindTilt * vH * 0.34);

  // Dappled cloud shadows & warm sunlit clearings
  float wrapDiff = clamp((dot(N, L) + 0.48) * 0.66, 0.0, 1.0);
  float sunVis = mix(0.22, 1.0, vCloud) * mix(0.56, 1.0, vSelfShadow);
  vec3 sunLight = vec3(1.08, 1.00, 0.84) * wrapDiff * sunVis;
  vec3 skyAmb   = mix(uColorShadowTint, uColorSpecSky * 0.48, vCloud) * (0.54 + 0.46 * N.y) * 0.68;

  vec3 L_dist = safeNorm3(L + N * 0.42, L);
  float vdotl = clamp(dot(V, -L_dist), 0.0, 1.0);
  float fwdSSS = vdotl * vdotl;
  float grazeSun = (1.0 - abs(dot(N, L))) * (0.20 + 0.45 * vWindTilt);
  vec3 sssTint = mix(uColorTip * 0.72, uColorStraw * 0.68, vStrawFactor * 0.45);
  vec3 sss = sssTint * (fwdSSS * 0.42 + grazeSun * 0.28) * h2 * sunVis;

  // Subtle botanical Kajiya-Kay wind sheen (warm green-gold glint, never white!)
  vec3 H = safeNorm3(L + V, vec3(0.0, 1.0, 0.0));
  vec3 T_shift = safeNorm3(T + (0.14 + (vHash - 0.5) * 0.10) * N, T);
  float th = dot(T_shift, H);
  float sinTH2 = max(0.0, 1.0 - th * th);
  float s4 = sinTH2 * sinTH2;
  s4 = s4 * s4;

  float gustSheen = mix(0.18, 0.75, smoothstep(0.08, 0.80, vWindTilt));
  float specSun = s4 * smoothstep(-0.05, 0.55, dot(N, L)) * h2 * gustSheen * 0.22;

  vec3 H_sky = safeNorm3(vec3(0.0, 1.0, 0.0) + V, vec3(0.0, 1.0, 0.0));
  float thSky = dot(T, H_sky);
  float sinSky2 = max(0.0, 1.0 - thSky * thSky);
  float specSky = (sinSky2 * sinSky2 * sinSky2) * h2 * (0.06 + 0.16 * vWindTilt);

  vec3 sheen = specSun * uColorSpecSun * sunVis + specSky * uColorSpecSky * 0.14;

  vec3 hdr = albedo * (sunLight + skyAmb) * dynAO + sss + sheen;
  vec2 screenUv = gl_FragCoord.xy / max(vec2(1.0), uResolution);
  fragColor = vec4(gradeSoftFilm(hdr, screenUv, gl_FragCoord.xy, uHorizonMistTint, uEdgeMistTint), 1.0);
}`;

// --- SUBTLE DRIFTING MIST VEILS & WHISPER-SOFT WIND STREAMLINES ---
const RIBBON_VS = `#version 300 es
precision highp float;
precision highp int;
${SHARED_FAST_GLSL}

uniform mat4 uViewProj;
uniform float uAspect;
uniform float uTime;
uniform vec2 uAmbientWind;
uniform vec2 uCloudDrift;
uniform sampler2D uWindCloud;
uniform vec3 uAuraColor;

out vec2 vRibbonUv;
out float vOpacity;
out vec3 vColor;

void main() {
  uint id = uint(gl_InstanceID);
  uint h0 = pcg_hash(id + 88123u);
  float seedA = float(h0 & 0xFFFFu) * (1.0 / 65535.0);
  float seedB = float((h0 >> 16u) & 0xFFFFu) * (1.0 / 65535.0);

  int seg = gl_VertexID >> 1;
  float side = ((gl_VertexID & 1) == 0) ? -1.0 : 1.0;
  float frac = float(seg) / 15.0;

  vec2 breezeDir = safeNorm2(uAmbientWind, vec2(0.82, 0.57));
  float cycle = floor(uTime * 0.14 + seedA);
  float life = fract(uTime * 0.14 + seedA);
  vec2 baseSpawn = vec2(fract(seedB + cycle * 0.37), fract(seedA * 2.73 + cycle * 0.53));
  vec2 curUv = mix(vec2(0.08), vec2(0.92), baseSpawn) + breezeDir * ((life - 0.5) * 0.20);
  vec2 tangentUv = breezeDir * 0.25;
  float avgSpeed = 0.0;

  for (int i = 0; i < 16; i++) {
    vec4 wc = textureLod(uWindCloud, clamp(curUv, 0.01, 0.99), 0.0);
    vec2 v = cleanVec2(wc.xy, 3.8);
    float sp = length(v);
    vec2 dir = (sp > 0.02) ? v : (breezeDir * 0.24);
    vec2 perp = safeNorm2(vec2(-dir.y, dir.x), vec2(-breezeDir.y, breezeDir.x));
    float wave = sin(float(i) * 0.40 - uTime * 2.7 + seedA * 20.0) * 0.005;
    if (i <= seg) {
      tangentUv = dir;
      avgSpeed = sp;
      if (i < seg) curUv += dir * 0.022 + perp * wave;
    }
  }

  float cloud = evalCloudMask(curUv, uCloudDrift);
  vec2 worldXZ = uvToFrustumXZ(curUv, uAspect);
  float hillY = evalHillHeight(worldXZ);
  vec2 stepDirUv = safeNorm2(tangentUv, breezeDir);
  vec2 worldNext = uvToFrustumXZ(curUv + stepDirUv * 0.01, uAspect);
  vec2 dirXZ = safeNorm2(worldNext - worldXZ, vec2(0.8, -0.6));
  vec2 perpXZ = vec2(-dirXZ.y, dirXZ.x);

  bool isMistVeil = (id < 16u);
  float baseW = isMistVeil ? 1.05 : 0.085;
  float width = baseW * sin(frac * 3.14159265) * (0.82 + 0.44 * clamp(avgSpeed, 0.0, 1.5));
  float alt = hillY + (isMistVeil ? 0.58 : 0.92) + 0.15 * sin(frac * 3.8 - uTime * 2.0 + seedB * 12.0);
  vec3 worldPos = vec3(worldXZ.x + perpXZ.x * side * width, alt, worldXZ.y + perpXZ.y * side * width);

  float lifeFade = sin(life * 3.14159265);
  float gustVis = smoothstep(0.12, 1.15, avgSpeed);
  vRibbonUv = vec2(frac, side * 0.5 + 0.5);
  vOpacity = lifeFade * (isMistVeil ? (0.010 + 0.024 * gustVis) : (0.014 + 0.095 * gustVis));
  vColor = mix(vec3(0.32, 0.44, 0.42), uAuraColor, cloud);

  gl_Position = uViewProj * vec4(worldPos, 1.0);
}`;

const RIBBON_FS = `#version 300 es
precision highp float;
in vec2 vRibbonUv;
in float vOpacity;
in vec3 vColor;
out vec4 fragColor;
void main() {
  float lenMask = sin(vRibbonUv.x * 3.14159265);
  float s = sin(vRibbonUv.y * 3.14159265);
  float a = lenMask * (s * s * s * s) * vOpacity;
  fragColor = vec4(vColor * a, a);
}`;

// ============================================================================
// 4. ENGINE INITIALIZATION & NATIVE RETINA 4x-MSAA 120HZ PIPELINE
// ============================================================================
function startMeadowEngine() {
  const canvas = document.getElementById('meadow-canvas');
  if (!canvas) return;

  // Resilient WebGL2 context acquisition cascade (handles multi-reload iframe pools cleanly)
  const ctxOptsList = [
    { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false },
    { antialias: true, alpha: false, depth: true, stencil: false },
    { antialias: false, alpha: false, depth: true, stencil: false }
  ];
  let gl = null;
  for (let i = 0; i < ctxOptsList.length; i++) {
    gl = canvas.getContext('webgl2', ctxOptsList[i]);
    if (gl && !gl.isContextLost()) break;
  }
  if (!gl) return;

  let isPaused = false;
  let rafId = 0;
  let engineReady = false;
  let cleanedUp = false;
  let lastTime = performance.now();

  const hasColorFloat = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  const timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  function makeProgram(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p));
    }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '');
      u[name] = gl.getUniformLocation(p, name);
    }
    return { prog: p, u };
  }

  function createSimFBO(w, h) {
    const useHF = hasColorFloat;
    const internalFmt = useHF ? gl.RGBA16F : gl.RGBA8;
    const type = useHF ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    const zeroData = useHF ? new Uint16Array(w * h * 4) : new Uint8Array(w * h * 4);

    // Explicitly zero-initialize RGBA16F memory (prevents recycled Metal VRAM NaN/Inf!)
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFmt, w, h, 0, gl.RGBA, type, zeroData);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

    if (!ok && useHF) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(w * h * 4));
    }

    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, w, h };
  }

  function createPingPong(w, h) {
    return {
      read: createSimFBO(w, h),
      write: createSimFBO(w, h),
      swap() { const t = this.read; this.read = this.write; this.write = t; }
    };
  }

  // Compile Shaders (Single unified wind/canopy physics pass — zero extra passes!)
  const progBakeStatic = makeProgram(FULLSCREEN_VS, BAKE_STATIC_FS);
  const progBakeShadow = makeProgram(FULLSCREEN_VS, BAKE_SHADOW_FS);
  const progWindSim    = makeProgram(FULLSCREEN_VS, WIND_SIM_FS);

  const progGround     = makeProgram(GROUND_VS, GROUND_FS);
  const progGrass      = makeProgram(GRASS_VS, GRASS_FS);
  const progRibbon     = makeProgram(RIBBON_VS, RIBBON_FS);

  const emptyVao = gl.createVertexArray();

  const LUT_RES = 512;
  const staticLUT = createSimFBO(LUT_RES, LUT_RES);
  const shadowLUT = createSimFBO(LUT_RES, LUT_RES);

  // Single 96x96 bilinear-filtered RGBA16F physics grid
  const SIM_RES = 96;
  const windSimFBO = createPingPong(SIM_RES, SIM_RES);

  // Release WebGL context slot cleanly on iframe reload / page teardown
  function cleanupWebGL() {
    if (cleanedUp) return;
    cleanedUp = true;
    isPaused = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    try {
      if (!gl.isContextLost()) {
        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();
      }
    } catch (_) {}
  }
  window.addEventListener('pagehide', (e) => { if (!e.persisted) cleanupWebGL(); });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  });

  // ==========================================================================
  // 5. FOUR DEEP, RICH BOTANICAL PALETTES (Significantly Darkened · Zero White Sheen)
  // ==========================================================================
  const PALETTES = [
    {
      // Deep Woodland Clover & Warm Morning Sunlight
      name: 'Morning Reverie',
      sunDir:   [0.48, 0.56, -0.67],
      ground:   [0.009, 0.025, 0.010],
      root:     [0.010, 0.028, 0.012],
      mid:      [0.026, 0.082, 0.024],
      tip:      [0.076, 0.168, 0.040],
      straw:    [0.165, 0.140, 0.052],
      shadow:   [0.020, 0.052, 0.068],
      specSun:  [0.52,  0.54,  0.34],
      specSky:  [0.18,  0.28,  0.22],
      aura:     [0.52,  0.58,  0.40],
      mist:     [0.18,  0.26,  0.18],
      edgeMist: [0.10,  0.16,  0.10]
    },
    {
      // Deep Burnished Olive-Cypress & Late-Afternoon Amber
      name: 'Golden Pastel',
      sunDir:   [0.64, 0.38, -0.66],
      ground:   [0.013, 0.022, 0.008],
      root:     [0.015, 0.026, 0.010],
      mid:      [0.044, 0.078, 0.021],
      tip:      [0.132, 0.148, 0.042],
      straw:    [0.215, 0.158, 0.052],
      shadow:   [0.028, 0.048, 0.072],
      specSun:  [0.62,  0.48,  0.26],
      specSky:  [0.18,  0.24,  0.28],
      aura:     [0.58,  0.48,  0.28],
      mist:     [0.24,  0.21,  0.14],
      edgeMist: [0.14,  0.12,  0.08]
    },
    {
      // Deep Kazuo Oga Forest Emerald & Viridian Shade
      name: 'Ghibli Spring',
      sunDir:   [-0.40, 0.62, -0.67],
      ground:   [0.007, 0.027, 0.013],
      root:     [0.008, 0.031, 0.015],
      mid:      [0.020, 0.088, 0.032],
      tip:      [0.064, 0.178, 0.052],
      straw:    [0.145, 0.148, 0.056],
      shadow:   [0.018, 0.056, 0.086],
      specSun:  [0.48,  0.56,  0.36],
      specSky:  [0.16,  0.28,  0.32],
      aura:     [0.46,  0.58,  0.44],
      mist:     [0.16,  0.26,  0.24],
      edgeMist: [0.09,  0.16,  0.14]
    },
    {
      // Deep Nocturnal Pine-Slate & Subtle Silver-Teal Dusk
      name: 'Moonlit Mist',
      sunDir:   [-0.46, 0.54, -0.70],
      ground:   [0.006, 0.016, 0.024],
      root:     [0.008, 0.020, 0.028],
      mid:      [0.018, 0.048, 0.058],
      tip:      [0.048, 0.108, 0.118],
      straw:    [0.088, 0.115, 0.128],
      shadow:   [0.014, 0.032, 0.062],
      specSun:  [0.34,  0.46,  0.54],
      specSky:  [0.14,  0.22,  0.30],
      aura:     [0.36,  0.48,  0.56],
      mist:     [0.11,  0.16,  0.22],
      edgeMist: [0.06,  0.10,  0.15]
    }
  ];

  let paletteIdx = 0;

  function bindTex(unit, tex, loc) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  function drawQuadToFBO(targetFbo, w, h) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function bakeMeadowMaps() {
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    const aspect = (canvas.width || window.innerWidth || 800) / Math.max(1, canvas.height || window.innerHeight || 600);

    gl.useProgram(progBakeStatic.prog);
    gl.uniform1f(progBakeStatic.u.uAspect, aspect);
    drawQuadToFBO(staticLUT.fbo, LUT_RES, LUT_RES);

    const sun = PALETTES[paletteIdx].sunDir;
    const sunLen = Math.hypot(sun[0], sun[2]) || 1;
    gl.useProgram(progBakeShadow.prog);
    bindTex(0, staticLUT.tex, progBakeShadow.u.uStaticLUT);
    gl.uniform2f(progBakeShadow.u.uSunDirUV, sun[0] / sunLen, -sun[2] / sunLen);
    drawQuadToFBO(shadowLUT.fbo, LUT_RES, LUT_RES);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  let lastCssW = 0, lastCssH = 0;

  function updateCanvasSize(force = false) {
    const cssW = canvas.clientWidth || window.innerWidth || 800;
    const cssH = canvas.clientHeight || window.innerHeight || 600;
    const hTol = isMobile ? 120 : 2;
    if (!force && Math.abs(cssW - lastCssW) < 2 && Math.abs(cssH - lastCssH) < hTol) return;
    lastCssW = cssW;
    lastCssH = cssH;

    // Crisp Retina DPR + 4x MSAA with smart IOSurface budget to hold 120Hz cleanly
    const rawDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.65 : 1.90);
    const maxDpr = Math.sqrt(4200000 / Math.max(1, cssW * cssH));
    const dpr = Math.min(rawDpr, maxDpr);
    canvas.width  = Math.max(4, Math.floor(cssW * dpr));
    canvas.height = Math.max(4, Math.floor(cssH * dpr));
    bakeMeadowMaps();

    if (engineReady && !isPaused && !cleanedUp && !rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(render);
    }
  }
  updateCanvasSize(true);
  window.addEventListener('resize', () => updateCanvasSize(false), { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => updateCanvasSize(false)).observe(canvas);
  }

  // ==========================================================================
  // 6. GRADUAL LAGGED BREEZE EMITTER + LOCALIZED WAVE POOL + WIND DIRECTOR
  // ==========================================================================
  const MAX_IMPULSES = 12;
  const impPosForce = new Float32Array(MAX_IMPULSES * 4);
  const impMeta     = new Float32Array(MAX_IMPULSES * 2);
  let queuedImpulses = 0;

  let windEnergy = 0;
  let flutterPhase = 0;
  let lastWheelWaveTime = 0;
  let lastSwipeWaveTime = 0;
  let isTouching = false, lastTX = 0, lastTY = 0, lastTT = 0;
  let lastPX = 0.5, lastPY = 0.5, lastPT = performance.now(), pointerInit = false;
  let smoothCamX = 0.5, smoothCamY = 0.5;
  let lastScrollY = window.scrollY;

  // Per-frame path-weighted finger/cursor motion accumulator
  let fingerMovedThisFrame = false;
  let fingerTargetU = 0.5, fingerTargetV = 0.5;
  let fingerFrameVxSum = 0, fingerFrameVySum = 0, fingerFrameWeight = 0;
  let fingerIsDrag = false;

  // Soft, lagged Breeze Emitter: treats your finger like a gentle wind breeze that swells
  // gradually and never flips grass blades abruptly when your finger reverses direction!
  let emitterU = 0.5, emitterV = 0.5;
  let emitterVx = 0, emitterVy = 0;
  let breezeSwell = 0;
  let breezePresence = 0;

  // Lagged two-finger trackpad / scroll breeze carrier
  let scrollTargetVx = 0, scrollTargetVy = 0;
  let scrollMomVx = 0, scrollMomVy = 0;

  function pushImpulse(x, y, dx, dy, radius, mode) {
    if (queuedImpulses >= MAX_IMPULSES) return;
    const i4 = queuedImpulses * 4;
    const i2 = queuedImpulses * 2;
    impPosForce[i4]     = x;
    impPosForce[i4 + 1] = y;
    impPosForce[i4 + 2] = dx;
    impPosForce[i4 + 3] = dy;
    impMeta[i2]         = radius;
    impMeta[i2 + 1]     = typeof mode === 'number' ? mode : (mode ? 1.0 : 0.0);
    queuedImpulses++;
  }

  // Dedicated Gesture Breeze Wave Pool (gradual sin^2 bell rise & long rolling tail)
  const gestureWavePool = [
    { active: false, x: 0.5, y: 0.5, dx: 1, dy: 0, speed: 0.34, rad: 0.36, strength: 0, age: 0, duration: 4.0 },
    { active: false, x: 0.5, y: 0.5, dx: 1, dy: 0, speed: 0.34, rad: 0.36, strength: 0, age: 0, duration: 4.0 },
    { active: false, x: 0.5, y: 0.5, dx: 1, dy: 0, speed: 0.34, rad: 0.36, strength: 0, age: 0, duration: 4.0 },
    { active: false, x: 0.5, y: 0.5, dx: 1, dy: 0, speed: 0.34, rad: 0.36, strength: 0, age: 0, duration: 4.0 }
  ];

  function spawnGestureMomentumWave(startX, startY, vx, vy, strength, rad, duration) {
    const mag = Math.hypot(vx, vy);
    if (mag < 1e-4) return;
    let slot = gestureWavePool[0];
    for (let i = 0; i < gestureWavePool.length; i++) {
      if (!gestureWavePool[i].active) { slot = gestureWavePool[i]; break; }
      if (gestureWavePool[i].age > slot.age) slot = gestureWavePool[i];
    }
    slot.active = true;
    slot.age = 0;
    slot.x = startX;
    slot.y = startY;
    slot.dx = vx / mag;
    slot.dy = vy / mag;
    slot.speed = 0.30 + Math.min(0.28, mag * 0.11);
    slot.rad = rad;
    slot.strength = strength;
    slot.duration = duration;
  }

  // Autonomous Wind & Natural Gust Director (rolling wind waves + localized gusts + direction shifts)
  let breezeAngle = 0.54 + (Math.random() - 0.5) * 0.55;
  let targetBreezeAngle = breezeAngle;
  let breezeAngVel = 0;
  let dirHoldTimer = 2.8 + Math.random() * 2.4;
  let windTravelX = 0, windTravelY = 0;
  let breezeWavePhase = Math.random() * 6.28;
  let cloudDriftX = 0, cloudDriftY = 0;
  let nextGustTimer = 0.25;

  const gustPool = [
    { active: false, mode: 3.0, baseAngle: 0, curve: 0, latOffset: 0, rad: 0.22, strength: 0, age: 0, duration: 3.2, x: 0.5, y: 0.5 },
    { active: false, mode: 3.0, baseAngle: 0, curve: 0, latOffset: 0, rad: 0.22, strength: 0, age: 0, duration: 3.2, x: 0.5, y: 0.5 },
    { active: false, mode: 3.0, baseAngle: 0, curve: 0, latOffset: 0, rad: 0.22, strength: 0, age: 0, duration: 3.2, x: 0.5, y: 0.5 },
    { active: false, mode: 3.0, baseAngle: 0, curve: 0, latOffset: 0, rad: 0.22, strength: 0, age: 0, duration: 3.2, x: 0.5, y: 0.5 },
    { active: false, mode: 3.0, baseAngle: 0, curve: 0, latOffset: 0, rad: 0.22, strength: 0, age: 0, duration: 3.2, x: 0.5, y: 0.5 }
  ];

  function spawnNaturalGust(boosted = false) {
    let slot = gustPool[0];
    for (let i = 0; i < gustPool.length; i++) {
      if (!gustPool[i].active) { slot = gustPool[i]; break; }
      if (gustPool[i].age > slot.age) slot = gustPool[i];
    }
    slot.active = true;
    slot.age = 0;

    if (boosted) {
      slot.mode = 3.0;
      slot.baseAngle = breezeAngle + (Math.random() - 0.5) * 0.85;
      slot.curve = (Math.random() - 0.5) * 0.55;
      slot.latOffset = (Math.random() - 0.5) * 0.52;
      slot.rad = 0.28;
      slot.strength = 3.10;
      slot.duration = 3.50;
      windEnergy = Math.min(1.25, windEnergy + 0.60);
      return;
    }

    if (Math.random() < 0.78) {
      const isShiftGust = Math.random() < 0.36;
      const spread = isShiftGust
        ? (0.75 + Math.random() * 1.25) * (Math.random() < 0.5 ? 1 : -1)
        : (Math.random() - 0.5) * 1.15;
      slot.mode = 3.0;
      slot.baseAngle = breezeAngle + spread;
      slot.curve = (Math.random() - 0.5) * 0.65;
      slot.latOffset = (Math.random() - 0.5) * 0.92;
      slot.rad = 0.17 + Math.random() * 0.11;
      slot.strength = 1.65 + Math.random() * 1.25;
      slot.duration = 2.60 + Math.random() * 1.45;
      if (isShiftGust) {
        targetBreezeAngle = breezeAngle + spread * 0.78;
        dirHoldTimer = 4.0 + Math.random() * 4.5;
      }
    } else {
      slot.mode = 0.0;
      slot.x = 0.14 + Math.random() * 0.72;
      slot.y = 0.14 + Math.random() * 0.72;
      slot.baseAngle = breezeAngle + (Math.random() - 0.5) * 1.95;
      slot.curve = (0.75 + Math.random() * 1.05) * (Math.random() < 0.5 ? 1 : -1);
      slot.rad = 0.18 + Math.random() * 0.11;
      slot.strength = 1.40 + Math.random() * 1.05;
      slot.duration = 2.10 + Math.random() * 1.20;
    }
  }

  // Lightweight 20-step 96x96 warm-start (<0.1ms GPU) so rolling wind waves are already mid-flight on frame 1!
  (function warmStartWind() {
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    const tx = 1.0 / SIM_RES;
    const aspect = Math.max(0.75, canvas.width / Math.max(1, canvas.height));
    const dtWarm = 0.12;
    const wx = Math.cos(breezeAngle) * 0.34;
    const wy = Math.sin(breezeAngle) * 0.34;
    gl.useProgram(progWindSim.prog);
    for (let i = 0; i < 20; i++) {
      windTravelX += (wx / aspect) * dtWarm * 0.82;
      windTravelY += wy * dtWarm * 0.82;
      breezeWavePhase += dtWarm * 1.95;
      cloudDriftX += (wx / aspect) * dtWarm * 0.085;
      cloudDriftY += wy * dtWarm * 0.085;

      bindTex(0, windSimFBO.read.tex, progWindSim.u.uPrevWind);
      gl.uniform2f(progWindSim.u.uTexel, tx, tx);
      gl.uniform1f(progWindSim.u.uDt, dtWarm);
      gl.uniform1f(progWindSim.u.uTime, i * dtWarm);
      gl.uniform1f(progWindSim.u.uAspect, aspect);
      gl.uniform2f(progWindSim.u.uAmbientWind, wx, wy);
      gl.uniform2f(progWindSim.u.uWindTravel, windTravelX, windTravelY);
      gl.uniform1f(progWindSim.u.uBreezeWavePhase, breezeWavePhase);
      gl.uniform1i(progWindSim.u.uNumImpulses, 0);
      drawQuadToFBO(windSimFBO.write.fbo, SIM_RES, SIM_RES);
      windSimFBO.swap();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    spawnNaturalGust(false);
    gustPool[0].age = gustPool[0].duration * 0.38;
    spawnNaturalGust(false);
    gustPool[1].age = gustPool[1].duration * 0.14;
  })();

  function recordPointerOrTouchSwipe(u, v, du, dv, dtSec, isDragOrTouch) {
    const dist = Math.hypot(du, dv);
    if (dist < 0.0003) return;

    const vScale = isDragOrTouch ? 2.25 : 1.65;
    const vx = Math.max(-3.6, Math.min(3.6, (du / Math.max(0.006, dtSec)) * vScale));
    const vy = Math.max(-3.6, Math.min(3.6, (dv / Math.max(0.006, dtSec)) * vScale));

    fingerMovedThisFrame = true;
    fingerTargetU = u;
    fingerTargetV = v;
    fingerFrameVxSum += vx * dist;
    fingerFrameVySum += vy * dist;
    fingerFrameWeight += dist;
    fingerIsDrag = fingerIsDrag || isDragOrTouch;
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    const scale = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1);
    const dx = Math.max(-160, Math.min(160, e.deltaX * scale));
    const dy = Math.max(-160, Math.min(160, e.deltaY * scale));
    const vx = Math.max(-3.4, Math.min(3.4, (-dx / 56) * 1.85));
    const vy = Math.max(-3.4, Math.min(3.4, ( dy / 56) * 2.05));
    const mag = Math.hypot(vx, vy);
    if (mag < 0.03) return;

    // Smoothly feed target breeze with stronger gust authority
    scrollTargetVx = Math.max(-3.4, Math.min(3.4, scrollTargetVx * 0.84 + vx * 0.58));
    scrollTargetVy = Math.max(-3.4, Math.min(3.4, scrollTargetVy * 0.84 + vy * 0.58));
    windEnergy = Math.min(1.3, windEnergy + mag * 0.24);
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (!e.touches.length) return;
    isTouching = true;
    lastTX = e.touches[0].clientX;
    lastTY = e.touches[0].clientY;
    lastTT = performance.now();
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isTouching || !e.touches.length) return;
    const t = e.touches[0];
    const now = performance.now();
    const dtSec = Math.max(0.004, Math.min(0.06, (now - lastTT) * 0.001));
    const du = (t.clientX - lastTX) / Math.max(1, window.innerWidth);
    const dv = -(t.clientY - lastTY) / Math.max(1, window.innerHeight);
    const u = t.clientX / Math.max(1, window.innerWidth);
    const v = 1.0 - t.clientY / Math.max(1, window.innerHeight);

    recordPointerOrTouchSwipe(u, v, du, dv, dtSec, true);
    lastTX = t.clientX; lastTY = t.clientY; lastTT = now;
  }, { passive: true });

  const endTouch = () => {
    isTouching = false;
    lastScrollY = window.scrollY;
    const spd = Math.hypot(emitterVx, emitterVy);
    const now = performance.now();
    if (spd > 0.34 && now - lastSwipeWaveTime > 140) {
      lastSwipeWaveTime = now;
      spawnGestureMomentumWave(
        emitterU, emitterV, emitterVx, emitterVy,
        Math.min(4.20, 1.65 + spd * 1.20),
        0.40,
        4.35
      );
    }
  };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    lastPX = e.clientX / Math.max(1, window.innerWidth);
    lastPY = 1.0 - e.clientY / Math.max(1, window.innerHeight);
    lastPT = performance.now();
    pointerInit = true;
  }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    const u = e.clientX / Math.max(1, window.innerWidth);
    const v = 1.0 - e.clientY / Math.max(1, window.innerHeight);
    if (pointerInit) {
      const dtSec = Math.max(0.004, Math.min(0.06, (now - lastPT) * 0.001));
      const du = u - lastPX, dv = v - lastPY;
      recordPointerOrTouchSwipe(u, v, du, dv, dtSec, e.buttons > 0);
    }
    lastPX = u; lastPY = v; lastPT = now; pointerInit = true;
  }, { passive: true });

  window.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') return;
    const spd = Math.hypot(emitterVx, emitterVy);
    const now = performance.now();
    if (spd > 0.34 && now - lastSwipeWaveTime > 140) {
      lastSwipeWaveTime = now;
      spawnGestureMomentumWave(
        emitterU, emitterV, emitterVx, emitterVy,
        Math.min(4.20, 1.65 + spd * 1.20),
        0.40,
        4.35
      );
    }
  }, { passive: true });

  // Bind UI Controls
  const audio = new MeadowSoundscape();
  const presetBtn = document.getElementById('aura-preset-btn');
  const presetNameEl = document.getElementById('aura-preset-name');
  const zenBtn = document.getElementById('zen-toggle-btn');
  const gustBtn = document.getElementById('gust-pulse-btn');
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundLabel = document.getElementById('sound-label');
  const soundWave = document.getElementById('sound-wave-path');
  const hzReadout = document.getElementById('hz-readout');

  if (presetBtn) {
    presetBtn.addEventListener('click', () => {
      paletteIdx = (paletteIdx + 1) % PALETTES.length;
      document.body.setAttribute('data-mood', String(paletteIdx));
      if (presetNameEl) presetNameEl.textContent = PALETTES[paletteIdx].name;
      bakeMeadowMaps();
      spawnNaturalGust(true);
    });
  }

  function toggleZen() {
    const on = document.body.classList.toggle('zen-mode');
    if (zenBtn) {
      zenBtn.setAttribute('aria-pressed', String(on));
      zenBtn.textContent = on ? 'Show Notes' : 'Pure Meadow';
    }
  }
  if (zenBtn) zenBtn.addEventListener('click', toggleZen);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') {
      const tag = document.activeElement?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') toggleZen();
    }
  });

  if (gustBtn) gustBtn.addEventListener('click', () => spawnNaturalGust(true));

  if (soundBtn) {
    soundBtn.addEventListener('click', async () => {
      const on = await audio.toggle();
      soundBtn.setAttribute('aria-pressed', String(on));
      if (soundLabel) soundLabel.textContent = on ? 'Sound On' : 'Sound';
    });
  }

  // ==========================================================================
  // 7. 120HZ PRO-MOTION RENDER LOOP + HARDWARE GPU TIMER GOVERNOR
  // ==========================================================================
  const refBlades  = isMobile ? 90000 : 185000;
  let activeBlades = refBlades;
  const minBlades  = isMobile ? 48000 : 75000;
  const maxBlades  = isMobile ? 130000 : 240000;

  let activeGpuQuery = null;
  let smoothGpuMs = 2.4;
  let highRefreshDetected = false;
  let wavePhase = 0;
  let fpsFrames = 0, fpsElapsed = 0, warmup = 20;

  if (hzReadout) {
    hzReadout.addEventListener('click', () => {
      isPaused = !isPaused;
      if (isPaused) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        hzReadout.textContent = 'Paused';
      } else {
        hzReadout.textContent = '120 Hz';
        lastTime = performance.now();
        fpsFrames = 0;
        fpsElapsed = 0;
        if (!rafId) rafId = requestAnimationFrame(render);
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && engineReady && !isPaused && !cleanedUp && !rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(render);
    }
  });

  const mProj = new Float32Array(16);
  const mView = new Float32Array(16);
  const mVP   = new Float32Array(16);
  const camEye = [0, 17.6, 10.0];
  const camCtr = [0, 0.0, -1.7];
  const camUp  = [0, 1, 0];

  function render(now) {
    rafId = 0;
    if (isPaused || cleanedUp || gl.isContextLost()) return;
    if (document.hidden) {
      lastTime = now;
      return;
    }
    rafId = requestAnimationFrame(render);

    const rawDtMs = now - lastTime;
    lastTime = now;
    const dt = Math.min(Math.max(rawDtMs * 0.001, 0.001), 0.033);
    const timeSec = now * 0.001;

    // Poll previous non-blocking GPU timer query
    if (timerExt && activeGpuQuery) {
      const avail = gl.getQueryParameter(activeGpuQuery, gl.QUERY_RESULT_AVAILABLE);
      const disjoint = gl.getParameter(timerExt.GPU_DISJOINT_EXT);
      if (avail) {
        if (!disjoint) {
          const ns = gl.getQueryParameter(activeGpuQuery, gl.QUERY_RESULT);
          smoothGpuMs += ((ns * 1e-6) - smoothGpuMs) * 0.20;
        }
        gl.deleteQuery(activeGpuQuery);
        activeGpuQuery = null;
      }
    }

    if (warmup > 0) {
      warmup--;
      if (rawDtMs > 2.0 && rawDtMs < 11.2) highRefreshDetected = true;
    } else if (rawDtMs > 1.5 && rawDtMs < 60) {
      if (rawDtMs < 11.2) highRefreshDetected = true;
      fpsFrames++;
      fpsElapsed += rawDtMs;
      if (fpsElapsed >= 500) {
        const fps = Math.round((fpsFrames * 1000) / fpsElapsed);
        if (hzReadout && !isPaused) hzReadout.textContent = `${fps} Hz`;
        const avgWallMs = fpsElapsed / fpsFrames;

        const gpuTooSlow = timerExt && smoothGpuMs > 5.6;
        const missed120  = highRefreshDetected && avgWallMs > 9.1;
        const missed60   = avgWallMs > 17.5;

        if ((gpuTooSlow || missed120 || missed60) && activeBlades > minBlades) {
          activeBlades = Math.max(minBlades, Math.floor(activeBlades * 0.85));
        } else if ((!timerExt || smoothGpuMs < 3.5) && avgWallMs < 8.6 && activeBlades < maxBlades) {
          activeBlades = Math.min(maxBlades, Math.floor(activeBlades * 1.05));
        }
        fpsFrames = 0;
        fpsElapsed = 0;
      }
    }

    const tx = 1.0 / SIM_RES;
    const W = canvas.width, H = canvas.height;
    const aspect = W / Math.max(1, H);
    const aspectClamped = Math.max(0.75, aspect);

    // Scrollbar / inertial page scroll fallback (feeds lagged scrollTargetVy)
    const sy = window.scrollY;
    const dScroll = sy - lastScrollY;
    lastScrollY = sy;
    if (!isTouching && Math.abs(dScroll) > 1.2) {
      const vy = Math.max(-2.2, Math.min(2.2, (dScroll / Math.max(260, window.innerHeight)) * 3.0));
      scrollTargetVy = Math.max(-2.4, Math.min(2.4, scrollTargetVy * 0.86 + vy * 0.40));
    }

    // 1. Update Reactive, Organic Finger/Cursor Breeze Emitter (shortened lag + magnified wind, zero snap on reversal!)
    if (fingerMovedThisFrame && fingerFrameWeight > 1e-5) {
      const targetVx = fingerFrameVxSum / fingerFrameWeight;
      const targetVy = fingerFrameVySum / fingerFrameWeight;
      const curSpd = Math.hypot(emitterVx, emitterVy);
      const tgtSpd = Math.hypot(targetVx, targetVy);
      const dotDir = emitterVx * targetVx + emitterVy * targetVy;

      // If your finger reverses against an active breeze, hand off the outgoing wave so the grass
      // keeps flowing forward smoothly while the new direction swells in with organic inertia!
      if (curSpd > 0.42 && dotDir < -0.12) {
        if (now - lastSwipeWaveTime > 180) {
          lastSwipeWaveTime = now;
          spawnGestureMomentumWave(
            emitterU, emitterV, emitterVx, emitterVy,
            Math.min(3.80, 1.35 + curSpd * 1.15),
            0.39,
            4.25
          );
        }
        breezeSwell *= 0.50;
      }

      if (breezePresence < 0.04) {
        emitterU = fingerTargetU;
        emitterV = fingerTargetV;
        emitterVx = targetVx * 0.34;
        emitterVy = targetVy * 0.34;
        breezePresence = Math.max(breezePresence, 0.46);
      } else {
        const posFollow = 1.0 - Math.exp(-7.8 * dt);
        emitterU += (fingerTargetU - emitterU) * posFollow;
        emitterV += (fingerTargetV - emitterV) * posFollow;
      }

      // Snappier wind pickup (~0.21s) when aligned, softly cushioned (~0.39s) when reversing direction
      const align = (curSpd > 0.08 && tgtSpd > 0.08) ? (dotDir / (curSpd * tgtSpd)) : 1.0;
      const opposeAmt = Math.max(0.0, -align);
      const dirRate = 4.65 - 2.10 * opposeAmt;
      const dirFollow = 1.0 - Math.exp(-dirRate * dt);
      emitterVx += (targetVx - emitterVx) * dirFollow;
      emitterVy += (targetVy - emitterVy) * dirFollow;

      const swellFollow = 1.0 - Math.exp(-(fingerIsDrag ? 4.8 : 3.8) * dt);
      breezeSwell += (1.0 - breezeSwell) * swellFollow;
      breezePresence = Math.min(1.0, breezePresence + dt * 5.5);

      const newSpd = Math.hypot(emitterVx, emitterVy);
      if (breezeSwell > 0.24 && newSpd > 0.32 && now - lastSwipeWaveTime > 190) {
        lastSwipeWaveTime = now;
        spawnGestureMomentumWave(
          emitterU, emitterV, emitterVx, emitterVy,
          Math.min(4.40, 1.80 + newSpd * 1.25),
          fingerIsDrag ? 0.41 : 0.37,
          4.35
        );
      }

      fingerMovedThisFrame = false;
      fingerFrameVxSum = 0;
      fingerFrameVySum = 0;
      fingerFrameWeight = 0;
      fingerIsDrag = false;
    } else {
      fingerMovedThisFrame = false;
      fingerFrameVxSum = 0;
      fingerFrameVySum = 0;
      fingerFrameWeight = 0;
      fingerIsDrag = false;
      breezeSwell *= Math.exp(-1.45 * dt);

      if (breezePresence > 0.012) {
        emitterU += (emitterVx / aspectClamped) * 0.32 * dt;
        emitterV += emitterVy * 0.32 * dt;
        const coast = Math.exp(-0.58 * dt);
        emitterVx *= coast;
        emitterVy *= coast;
        breezePresence *= Math.exp(-0.62 * dt);
      } else {
        breezePresence = 0;
      }
    }

    if (breezePresence > 0.012 && emitterU > -0.34 && emitterU < 1.34 && emitterV > -0.34 && emitterV < 1.34) {
      const bGain = (0.46 + 0.54 * breezeSwell) * breezePresence * 5.80 * dt;
      pushImpulse(emitterU, emitterV, emitterVx * bGain, emitterVy * bGain, 0.31, 0.0);
      windEnergy = Math.max(windEnergy, Math.min(1.25, Math.hypot(emitterVx, emitterVy) * breezePresence * 0.65));
    }

    // 2. Advance Lagged Trackpad / Scroll Breeze (localized rolling waves rather than uniform full-screen push)
    const tDecay = Math.exp(-1.45 * dt);
    scrollTargetVx *= tDecay;
    scrollTargetVy *= tDecay;
    const sLag = 1.0 - Math.exp(-3.65 * dt);
    scrollMomVx += (scrollTargetVx - scrollMomVx) * sLag;
    scrollMomVy += (scrollTargetVy - scrollMomVy) * sLag;

    const scrollMag = Math.hypot(scrollMomVx, scrollMomVy);
    if (scrollMag > 0.02) {
      const idleDrag = Math.exp(-0.44 * dt);
      scrollMomVx *= idleDrag;
      scrollMomVy *= idleDrag;
      pushImpulse(lastPX, lastPY, scrollMomVx * 3.80 * dt, scrollMomVy * 3.80 * dt, 0.42, 0.0);

      if (scrollMag > 0.26 && now - lastWheelWaveTime > 210) {
        lastWheelWaveTime = now;
        const dirX = scrollMomVx / scrollMag;
        const dirY = scrollMomVy / scrollMag;
        const perpX = -dirY, perpY = dirX;
        const lat = (Math.random() - 0.5) * 0.56;
        spawnGestureMomentumWave(
          0.5 - dirX * 0.46 + perpX * lat,
          0.5 - dirY * 0.46 + perpY * lat,
          scrollMomVx, scrollMomVy,
          Math.min(4.30, 1.75 + scrollMag * 1.18),
          0.34,
          4.35
        );
      }
    }

    // 3. Advance Traveling 2D Gesture Breeze Waves (smooth 0.65s Hermite swell + long 4.35s sweeping tail!)
    let gestureWaveEnergy = Math.max(breezePresence * 0.72, Math.min(1.0, scrollMag * 0.58));
    for (let i = 0; i < gestureWavePool.length; i++) {
      const gw = gestureWavePool[i];
      if (!gw.active) continue;
      gw.age += dt;
      if (gw.age >= gw.duration) {
        gw.active = false;
        continue;
      }
      const prog = gw.age / gw.duration;
      const uRise = Math.min(1.0, prog / 0.16);
      const rise = uRise * uRise * (3.0 - 2.0 * uRise);
      const rem = Math.max(0.0, 1.0 - prog);
      const env = rise * rem * Math.sqrt(rem);
      gw.x += (gw.dx / aspectClamped) * gw.speed * dt;
      gw.y += gw.dy * gw.speed * dt;
      const imp = gw.strength * env * dt;
      pushImpulse(gw.x, gw.y, gw.dx * imp, gw.dy * imp, gw.rad, 2.0);
      gestureWaveEnergy = Math.max(gestureWaveEnergy, env * (gw.strength / 3.2));
    }

    // 4. Autonomous rolling wind waves + organic direction shifts + localized crescent gusts
    dirHoldTimer -= dt;
    if (dirHoldTimer <= 0) {
      const bigShift = Math.random() < 0.40;
      const delta = (bigShift ? (1.45 + Math.random() * 1.45) : (0.55 + Math.random() * 0.95)) * (Math.random() < 0.5 ? 1 : -1);
      targetBreezeAngle = breezeAngle + delta;
      dirHoldTimer = 3.8 + Math.random() * 4.8;
    }
    const angDiff = targetBreezeAngle - breezeAngle;
    breezeAngVel += (angDiff * 1.35 - breezeAngVel * 2.35) * dt;
    breezeAngle += breezeAngVel * dt;

    nextGustTimer -= dt;
    if (nextGustTimer <= 0) {
      spawnNaturalGust(false);
      nextGustTimer = (Math.random() < 0.34)
        ? (0.55 + Math.random() * 0.70)
        : (1.25 + Math.random() * 2.15);
    }

    const wanderAngle = breezeAngle + 0.22 * Math.sin(timeSec * 0.29) + 0.14 * Math.sin(timeSec * 0.63 + 1.9);
    const breezeBreath = 0.5 + 0.30 * Math.sin(timeSec * 0.36) + 0.20 * Math.sin(timeSec * 0.81 + 2.3);
    const breezeSpeed = 0.26 + 0.16 * breezeBreath;
    const ambientWindX = Math.cos(wanderAngle) * breezeSpeed;
    const ambientWindY = Math.sin(wanderAngle) * breezeSpeed;

    windTravelX += (ambientWindX / aspectClamped) * dt * 0.82;
    windTravelY += ambientWindY * dt * 0.82;
    breezeWavePhase += dt * (1.15 + breezeSpeed * 2.85);
    cloudDriftX += (ambientWindX / aspectClamped) * dt * 0.085;
    cloudDriftY += ambientWindY * dt * 0.085;

    let ambientGustEnergy = breezeSpeed * 0.55;
    const halfDiagBase = Math.hypot(0.5 * aspectClamped, 0.5);
    for (let i = 0; i < gustPool.length; i++) {
      const g = gustPool[i];
      if (!g.active) continue;
      g.age += dt;
      if (g.age >= g.duration) {
        g.active = false;
        continue;
      }
      const prog = g.age / g.duration;
      const s = Math.sin(Math.PI * prog);
      const env = s * s;
      const curAngle = g.baseAngle + g.curve * (prog - 0.5);
      const dx = Math.cos(curAngle);
      const dy = Math.sin(curAngle);
      const impulseMag = g.strength * env * dt;

      if (g.mode > 1.5) {
        const span = halfDiagBase + g.rad * 1.55;
        const dist = (prog * 2.0 - 1.0) * span;
        const gx = 0.5 + (dx * dist - dy * g.latOffset) / aspectClamped;
        const gy = 0.5 + (dy * dist + dx * g.latOffset);
        pushImpulse(gx, gy, dx * impulseMag, dy * impulseMag, g.rad, g.mode);
      } else {
        g.x += (dx / aspectClamped) * 0.34 * dt;
        g.y += dy * 0.34 * dt;
        pushImpulse(g.x, g.y, dx * impulseMag, dy * impulseMag, g.rad, 0.0);
      }
      ambientGustEnergy = Math.max(ambientGustEnergy, env * (g.strength / 2.8) * 0.72);
    }

    windEnergy *= Math.exp(-0.72 * dt);
    const effectiveEnergy = Math.max(windEnergy, ambientGustEnergy, gestureWaveEnergy);
    flutterPhase += dt * (3.2 + effectiveEnergy * 5.8);

    const sAudio = audio.update(Math.min(1, Math.max(windEnergy * 0.78, ambientGustEnergy * 0.80, gestureWaveEnergy * 0.85)));
    if (soundWave) {
      if (audio.enabled) {
        wavePhase += dt * (3.4 + sAudio * 5.0);
        const amp = 1.6 + sAudio * 3.2;
        let d = '';
        for (let i = 0; i <= 14; i++) {
          const t = i / 14;
          const x = (1 + t * 20).toFixed(1);
          const y = (7 + Math.sin(t * Math.PI * 2.5 - wavePhase) * amp * Math.sin(t * Math.PI)).toFixed(1);
          d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
        }
        soundWave.setAttribute('d', d);
      } else {
        soundWave.setAttribute('d', 'M 1 7 L 21 7');
      }
    }

    if (timerExt && !activeGpuQuery) {
      activeGpuQuery = gl.createQuery();
      gl.beginQuery(timerExt.TIME_ELAPSED_EXT, activeGpuQuery);
    }

    // --- PASS 1: SINGLE UNIFIED 96x96 BREEZE (.xy) + LAGGED CANOPY (.zw) PASS ---
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    gl.useProgram(progWindSim.prog);
    bindTex(0, windSimFBO.read.tex, progWindSim.u.uPrevWind);
    gl.uniform2f(progWindSim.u.uTexel, tx, tx);
    gl.uniform1f(progWindSim.u.uDt, dt);
    gl.uniform1f(progWindSim.u.uTime, timeSec);
    gl.uniform1f(progWindSim.u.uAspect, aspect);
    gl.uniform2f(progWindSim.u.uAmbientWind, ambientWindX, ambientWindY);
    gl.uniform2f(progWindSim.u.uWindTravel, windTravelX, windTravelY);
    gl.uniform1f(progWindSim.u.uBreezeWavePhase, breezeWavePhase);
    gl.uniform1i(progWindSim.u.uNumImpulses, queuedImpulses);
    if (queuedImpulses > 0) {
      gl.uniform4fv(progWindSim.u.uImpPosForce, impPosForce);
      gl.uniform2fv(progWindSim.u.uImpMeta, impMeta);
    }
    drawQuadToFBO(windSimFBO.write.fbo, SIM_RES, SIM_RES);
    windSimFBO.swap();
    queuedImpulses = 0;

    // --- PASS 2: DIRECT NATIVE RETINA + 4x HARDWARE MSAA MEADOW RENDER ---
    const p = PALETTES[paletteIdx];
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProg = Math.max(0, Math.min(1, sy / scrollMax));

    const camLerp = 1.0 - Math.exp(-3.2 * dt);
    smoothCamX += (lastPX - smoothCamX) * camLerp;
    smoothCamY += (lastPY - smoothCamY) * camLerp;

    camEye[0] = (smoothCamX - 0.5) * 0.58;
    camEye[1] = 17.6 - scrollProg * 0.60;
    camEye[2] = 10.0 + (smoothCamY - 0.5) * 0.40 - scrollProg * 0.50;
    camCtr[2] = -1.7 - scrollProg * 0.50;

    mat4Perspective(mProj, 27 * Math.PI / 180, aspect, 2.0, 52.0);
    mat4LookAt(mView, camEye, camCtr, camUp);
    mat4Multiply(mVP, mProj, mView);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clearColor(p.ground[0], p.ground[1], p.ground[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 2a. Dark Velvety Moss & Thatch Hillside
    gl.useProgram(progGround.prog);
    gl.uniformMatrix4fv(progGround.u.uViewProj, false, mVP);
    gl.uniform1f(progGround.u.uAspect, aspect);
    gl.uniform2f(progGround.u.uCloudDrift, cloudDriftX, cloudDriftY);
    gl.uniform2f(progGround.u.uResolution, W, H);
    gl.uniform3fv(progGround.u.uColorGround, p.ground);
    gl.uniform3fv(progGround.u.uColorStraw, p.straw);
    gl.uniform3fv(progGround.u.uColorShadowTint, p.shadow);
    gl.uniform3fv(progGround.u.uHorizonMistTint, p.mist);
    gl.uniform3fv(progGround.u.uEdgeMistTint, p.edgeMist);
    bindTex(0, staticLUT.tex, progGround.u.uStaticLUT);
    bindTex(1, shadowLUT.tex, progGround.u.uShadowLUT);
    gl.bindVertexArray(emptyVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 784);

    // 2b. 3-Segment (7-Vertex) Dark Supple Silk Grass (Early-Z + 4x MSAA!)
    const widthScale = Math.min(1.68, Math.max(0.90, Math.sqrt(refBlades / Math.max(1, activeBlades))));
    gl.useProgram(progGrass.prog);
    gl.uniformMatrix4fv(progGrass.u.uViewProj, false, mVP);
    gl.uniform3fv(progGrass.u.uCamPos, camEye);
    gl.uniform1f(progGrass.u.uAspect, aspect);
    gl.uniform2f(progGrass.u.uResolution, W, H);
    gl.uniform1f(progGrass.u.uFlutterPhase, flutterPhase);
    gl.uniform1f(progGrass.u.uActiveBlades, activeBlades);
    gl.uniform1f(progGrass.u.uWidthScale, widthScale);
    gl.uniform2f(progGrass.u.uCloudDrift, cloudDriftX, cloudDriftY);
    gl.uniform3fv(progGrass.u.uSunDir, p.sunDir);
    gl.uniform3fv(progGrass.u.uColorRoot, p.root);
    gl.uniform3fv(progGrass.u.uColorMid, p.mid);
    gl.uniform3fv(progGrass.u.uColorTip, p.tip);
    gl.uniform3fv(progGrass.u.uColorStraw, p.straw);
    gl.uniform3fv(progGrass.u.uColorShadowTint, p.shadow);
    gl.uniform3fv(progGrass.u.uColorSpecSun, p.specSun);
    gl.uniform3fv(progGrass.u.uColorSpecSky, p.specSky);
    gl.uniform3fv(progGrass.u.uHorizonMistTint, p.mist);
    gl.uniform3fv(progGrass.u.uEdgeMistTint, p.edgeMist);
    bindTex(0, staticLUT.tex, progGrass.u.uStaticLUT);
    bindTex(1, shadowLUT.tex, progGrass.u.uShadowLUT);
    bindTex(2, windSimFBO.read.tex, progGrass.u.uWindCloud);
    gl.bindVertexArray(emptyVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 7, activeBlades);

    // 2c. Whisper-Soft Wind-Aura Streamlines & Drifting Mist Veils (Zero flowers!)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.useProgram(progRibbon.prog);
    gl.uniformMatrix4fv(progRibbon.u.uViewProj, false, mVP);
    gl.uniform1f(progRibbon.u.uAspect, aspect);
    gl.uniform1f(progRibbon.u.uTime, timeSec);
    gl.uniform2f(progRibbon.u.uAmbientWind, ambientWindX, ambientWindY);
    gl.uniform2f(progRibbon.u.uCloudDrift, cloudDriftX, cloudDriftY);
    gl.uniform3fv(progRibbon.u.uAuraColor, p.aura);
    bindTex(0, windSimFBO.read.tex, progRibbon.u.uWindCloud);
    gl.bindVertexArray(emptyVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 32, 40);

    gl.depthMask(true);
    gl.disable(gl.BLEND);

    if (timerExt && activeGpuQuery) {
      gl.endQuery(timerExt.TIME_ELAPSED_EXT);
    }
  }

  engineReady = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(render);
}

startMeadowEngine();
})();
