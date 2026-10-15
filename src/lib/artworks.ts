// Three original generative works. Each one is a fragment shader rendered live,
// so the "image" is never the same twice and answers the visitor's pointer.

const COMMON = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_hover;

const vec3 INK = vec3(0.02, 0.02, 0.02);
const vec3 BONE = vec3(0.945, 0.933, 0.902);
const vec3 ACID = vec3(0.776, 1.0, 0.102);

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return v;
}
// centred coords where the short side spans [-0.5, 0.5]
vec2 centred(vec2 frag) { return (frag - 0.5 * u_res) / min(u_res.x, u_res.y); }
vec2 mouseCentred() { return centred(u_mouse * u_res); }
float vignette(vec2 uv) {
  uv *= 1.0 - uv.yx;
  return pow(uv.x * uv.y * 16.0, 0.22);
}
`

const SIGNAL = /* glsl */ `
${COMMON}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time;
  float row = floor(uv.y * 160.0);
  float tear = step(0.985 - u_hover * 0.04, hash(row * 1.7 + floor(t * 9.0)));
  vec2 frag = gl_FragCoord.xy + vec2(tear * (hash(row + t) - 0.5) * 80.0, 0.0);
  vec2 p = centred(frag);

  vec2 a = vec2(sin(t * 0.31) * 0.34, cos(t * 0.23) * 0.22);
  vec2 drift = vec2(-a.x, -a.y * 1.3) + vec2(cos(t * 0.17), sin(t * 0.13)) * 0.08;
  vec2 b = mix(drift, mouseCentred(), u_hover);

  float d1 = length(p - a);
  float d2 = length(p - b);
  float w = sin(d1 * 74.0 - t * 2.2) + sin(d2 * 74.0 - t * 2.6);
  float s = w * 0.25 + 0.5;
  float v = smoothstep(0.42, 0.86, s);

  float scan = 0.62 + 0.38 * step(0.5, fract(gl_FragCoord.y * 0.25));
  vec3 col = mix(INK, ACID * 0.9, v) * scan;
  col = mix(col, BONE, smoothstep(0.93, 0.995, s) * 0.85);
  col += ACID * 0.25 * tear;
  float pulse = exp(-d2 * 18.0) * (0.25 + 0.6 * u_hover);
  col += BONE * pulse;
  col *= vignette(uv);
  col += (hash21(gl_FragCoord.xy + t) - 0.5) * 0.05;
  gl_FragColor = vec4(col, 1.0);
}
`

const TIDE = /* glsl */ `
${COMMON}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = centred(gl_FragCoord.xy) * 1.7;
  float t = u_time * 0.6;
  vec2 m = mouseCentred() * 1.7;
  float pull = u_hover * exp(-length(p - m) * 2.2);
  p += (m - p) * pull * 0.35;

  vec2 q = vec2(fbm(p + t * 0.08), fbm(p + vec2(5.2, 1.3) - t * 0.06));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.12),
                fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.1));
  float f = fbm(p + 3.4 * r);

  float phase = f * 5.0 + length(q) * 2.0 - t * 0.35;
  float bands = 0.5 + 0.5 * cos(6.2831 * phase);
  float steel = smoothstep(0.05, 0.95, bands);
  vec3 col = mix(vec3(0.015), vec3(0.58, 0.58, 0.56), steel);
  col = mix(col, vec3(0.16, 0.16, 0.15), smoothstep(0.55, 0.0, f) * 0.6);
  col += BONE * pow(bands, 22.0) * 1.15;
  float crevice = smoothstep(0.62, 0.95, length(r)) * (1.0 - steel);
  col = mix(col, ACID, crevice * (0.45 + 0.4 * u_hover));
  col += ACID * pull * 0.25 * pow(bands, 6.0);
  col *= vignette(uv);
  col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`

const GARDEN = /* glsl */ `
${COMMON}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time;
  vec2 base = centred(gl_FragCoord.xy);
  vec2 m = mouseCentred();
  float near = exp(-length(base - m) * 5.0) * u_hover;
  vec2 p = base * 6.0;
  p += normalize(base - m + 0.0001) * near * 0.9;

  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float md = 8.0;
  float md2 = 8.0;
  vec2 cell = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(ip + g);
      o = 0.5 + 0.42 * sin(t * 0.55 + 6.2831 * o);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < md) { md2 = md; md = d; cell = ip + g; }
      else if (d < md2) { md2 = d; }
    }
  }
  float d1 = sqrt(md);
  float edge = sqrt(md2) - d1;
  float id = hash21(cell);
  float life = 0.5 + 0.5 * sin(t * (0.6 + id) + id * 40.0);

  vec3 col = mix(INK, vec3(0.07, 0.07, 0.065), id);
  col += vec3(0.06) * fbm(p * 3.0 + id * 9.0);
  float wall = 1.0 - smoothstep(0.0, 0.035 + near * 0.05, edge);
  col = mix(col, BONE * 0.88, wall);
  float nucleus = smoothstep(0.11 * life + near * 0.12, 0.0, d1);
  col = mix(col, ACID, nucleus * step(0.42, id));
  col = mix(col, BONE, nucleus * (1.0 - step(0.42, id)) * 0.7);
  col += ACID * wall * near * 1.2;
  col *= vignette(uv);
  col += (hash21(gl_FragCoord.xy + t) - 0.5) * 0.045;
  gl_FragColor = vec4(col, 1.0);
}
`

export type Artwork = {
  id: string
  code: string
  title: string
  aside: string
  year: string
  medium: string
  format: string
  duration: string
  statement: string
  gesture: string
  shader: string
}

export const ARTWORKS: Artwork[] = [
  {
    id: 'signal',
    code: 'FR—001',
    title: 'Signal',
    aside: 'décroissance',
    year: '2026',
    medium: 'Shader génératif, interférence à deux sources',
    format: 'Variable · 160 lignes de balayage',
    duration: 'Perpétuelle',
    statement:
      "Deux ondes se croisent et s'annulent. Là où elles s'accordent, la lumière acide déchire le noir. Le moniteur n'affiche rien : il écoute.",
    gesture: 'Votre pointeur devient la seconde source.',
    shader: SIGNAL,
  },
  {
    id: 'tide',
    code: 'FR—002',
    title: 'Marée',
    aside: 'chromée',
    year: '2026',
    medium: 'Champ de bruit replié sur lui-même, rendu métal',
    format: 'Variable · trois niveaux de distorsion',
    duration: 'Perpétuelle',
    statement:
      "Un métal liquide qui n'a jamais été coulé. Chaque reflet est calculé à l'instant puis oublié. Rien n'est enregistré, tout est rejoué.",
    gesture: 'Approchez : la surface se plie vers vous.',
    shader: TIDE,
  },
  {
    id: 'garden',
    code: 'FR—003',
    title: 'Jardin',
    aside: 'nul',
    year: '2026',
    medium: 'Partition cellulaire de Voronoï, croissance lente',
    format: 'Variable · environ 60 cellules visibles',
    duration: 'Perpétuelle',
    statement:
      "Des cellules naissent, respirent et se repoussent. Un jardin sans terre ni saison, cultivé par un calcul qui ne connaît pas l'hiver.",
    gesture: 'Les cellules fuient votre présence.',
    shader: GARDEN,
  },
]
