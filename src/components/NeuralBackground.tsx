import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_dripSpeed;
uniform float u_foldDepth;
uniform float u_turbulence;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    val += amp * noise(p * freq);
    freq *= 2.03;
    amp *= 0.49;
    p += vec2(1.7, 9.2);
  }
  return val;
}

float tectonicFold(vec2 p, float time) {
  float angle = 0.9;
  float ca = cos(angle);
  float sa = sin(angle);
  vec2 rot = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);
  float baseFold = sin(rot.x * 1.5 + time * 0.3) * cos(rot.y * 0.8);
  float secondary = sin(rot.x * 3.1 - time * 0.2) * 0.3;
  float fracture = fbm(vec2(rot.x * 2.0, rot.y * 1.5)) * 0.4;
  return smoothstep(-0.5, 0.5, baseFold + secondary + fracture);
}

float neuralFlow(vec2 p, float time) {
  float u = p.x * 1.5 + time * 0.4;
  float v = p.y * 1.5 - time * 0.3;
  float branch1 = sin(u + fbm(vec2(v * 0.5, time * 0.1)) * 1.5);
  float branch2 = cos(v * 1.2 + fbm(vec2(u * 0.5, time * 0.15)) * 1.2);
  float branch3 = sin((u + v) * 0.8 + time * 0.2);
  return clamp((branch1 * 0.4 + branch2 * 0.35 + branch3 * 0.25 + 1.0) * 0.5, 0.0, 1.0);
}

float dripSource(vec2 uv, float time) {
  float dropY = fract(time * 0.08) * 1.6 - 0.3;
  float dropX = sin(time * 0.15) * 0.15;
  float d = length(vec2(uv.x - dropX, (uv.y - dropY) * 0.7));
  float drop = exp(-d * d * 80.0);
  float ripples = pow(max(0.0, sin(d * 30.0 - time * 2.0)), 3.0) * exp(-d * 6.0);
  return drop + ripples * 0.3;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  uv.x *= aspect;

  vec3 NAVY = vec3(0.0, 0.10, 0.20);
  vec3 TEAL = vec3(0.0, 0.75, 0.75);
  vec3 GOLD = vec3(0.1, 0.4, 0.4);
  vec3 INK = vec3(0.0, 0.17, 0.32);

  vec3 col = vec3(0.0);
  float tectonic = tectonicFold(uv, u_time * u_dripSpeed);

  float membrane = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float freq = 2.5 + fi * 1.5;
    float amp = 0.15 / (1.0 + fi * 0.4);
    float phase = u_time * u_dripSpeed * (0.3 + fi * 0.15);
    membrane += cos(uv.x * freq + phase + fi * 1.7) * amp;
    membrane += sin((uv.x + uv.y) * (freq * 0.7) - phase * 0.8 + fi * 2.3) * amp * 0.6;
  }
  membrane += fbm(vec2(uv.x * 3.0, uv.y * 2.0 - u_time * u_dripSpeed * 0.2)) * 0.1;
  membrane = clamp(membrane, 0.0, 1.0);

  float flow = neuralFlow(uv, u_time * u_dripSpeed);

  vec3 baseCol = mix(NAVY, INK, tectonic);
  baseCol = mix(baseCol, GOLD, membrane * u_foldDepth * 0.5);
  baseCol = mix(baseCol, TEAL * 0.3, flow * u_turbulence);
  col += baseCol * 0.6;

  float veins = smoothstep(0.35, 0.45, membrane) - smoothstep(0.45, 0.55, membrane);
  vec3 membraneCol = vec3(TEAL) * veins * 1.2;
  membraneCol += vec3(TEAL) * smoothstep(0.5, 0.8, membrane) * 0.2;
  membraneCol += vec3(0.8, 0.9, 0.9) * smoothstep(0.7, 1.0, membrane) * 0.4;
  col += membraneCol * u_foldDepth;

  float flowMask = smoothstep(0.5, 0.8, flow);
  vec3 flowCol = vec3(TEAL) * flowMask * 0.5;
  flowCol += vec3(0.8, 0.9, 0.9) * pow(flow, 4.0) * 0.6;
  col += flowCol * u_turbulence;

  col += vec3(0.0, 0.75, 0.75) * dripSource(uv, u_time * u_dripSpeed) * 0.4;
  col += (hash(gl_FragCoord.xy + fract(u_time * 43.0) * 1000.0) - 0.5) * 0.03;
  col *= 0.7 + (1.0 - smoothstep(0.5, 1.5, length((uv - vec2(aspect * 0.5, 0.5))))) * 0.3;
  col = pow(col / (1.0 + col * 0.2), vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen triangle
    const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_res");
    const uDripSpeed = gl.getUniformLocation(program, "u_dripSpeed");
    const uFoldDepth = gl.getUniformLocation(program, "u_foldDepth");
    const uTurbulence = gl.getUniformLocation(program, "u_turbulence");

    gl.uniform1f(uDripSpeed, 0.5);
    gl.uniform1f(uFoldDepth, 1.2);
    gl.uniform1f(uTurbulence, 1.5);

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    function render() {
      if (!gl || !canvas) return;
      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
