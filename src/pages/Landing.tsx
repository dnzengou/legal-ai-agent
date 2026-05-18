import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Scale,
  Brain,
  FileSignature,
  Search,
  ShieldCheck,
  Gavel,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react";

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

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  uv.x *= aspect;

  vec3 NAVY = vec3(0.0, 0.10, 0.20);
  vec3 TEAL = vec3(0.0, 0.75, 0.75);
  vec3 GOLD = vec3(0.1, 0.4, 0.4);
  vec3 INK = vec3(0.0, 0.17, 0.32);

  vec3 col = vec3(0.0);
  float time = u_time * u_dripSpeed;
  float tectonic = tectonicFold(uv, time);
  float flow = neuralFlow(uv, time);

  float membrane = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float freq = 2.5 + fi * 1.5;
    float amp = 0.15 / (1.0 + fi * 0.4);
    float phase = time * (0.3 + fi * 0.15);
    membrane += cos(uv.x * freq + phase + fi * 1.7) * amp;
    membrane += sin((uv.x + uv.y) * (freq * 0.7) - phase * 0.8 + fi * 2.3) * amp * 0.6;
  }
  membrane += fbm(vec2(uv.x * 3.0, uv.y * 2.0 - time * 0.2)) * 0.1;
  membrane = clamp(membrane, 0.0, 1.0);

  vec3 baseCol = mix(NAVY, INK, tectonic);
  baseCol = mix(baseCol, GOLD, membrane * 1.2 * 0.5);
  baseCol = mix(baseCol, TEAL * 0.3, flow * 1.5);
  col += baseCol * 0.6;

  float veins = smoothstep(0.35, 0.45, membrane) - smoothstep(0.45, 0.55, membrane);
  vec3 membraneCol = vec3(TEAL) * veins * 1.2;
  membraneCol += vec3(TEAL) * smoothstep(0.5, 0.8, membrane) * 0.2;
  membraneCol += vec3(0.8, 0.9, 0.9) * smoothstep(0.7, 1.0, membrane) * 0.4;
  col += membraneCol * 1.2;

  float flowMask = smoothstep(0.5, 0.8, flow);
  vec3 flowCol = vec3(TEAL) * flowMask * 0.5;
  flowCol += vec3(0.8, 0.9, 0.9) * pow(flow, 4.0) * 0.6;
  col += flowCol * 1.5;

  col += (hash(gl_FragCoord.xy + fract(u_time * 43.0) * 1000.0) - 0.5) * 0.03;
  col *= 0.7 + (1.0 - smoothstep(0.5, 1.5, length((uv - vec2(aspect * 0.5, 0.5))))) * 0.3;
  col = pow(col / (1.0 + col * 0.2), vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;

const features = [
  {
    icon: Brain,
    title: "CoT Multi-Agent Analysis",
    description: "Chain of Thought reasoning with 8 specialized AI agents parsing, identifying, assessing, and summarizing legal documents in a coordinated pipeline.",
  },
  {
    icon: FileSignature,
    title: "Contract Generation & Review",
    description: "Draft contracts from templates with intelligent parameter filling. Deep clause analysis identifies risks across liability, termination, indemnification, and IP.",
  },
  {
    icon: Search,
    title: "Intelligent Precedent Search",
    description: "Search across thousands of case precedents with relevance scoring, jurisdiction filtering, and AI-powered semantic matching.",
  },
  {
    icon: Gavel,
    title: "Judgment Analysis",
    description: "Automated summarization of judicial opinions with rhetorical role labeling — identifying facts, holdings, reasoning, and disposition.",
  },
  {
    icon: ShieldCheck,
    title: "Ethical AI Auditing",
    description: "Comprehensive bias detection, fairness scoring, transparency analysis, and privacy assessment to ensure responsible AI deployment.",
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    description: "Risk scoring, compliance checking, sentiment analysis, and trend identification across your entire legal document corpus.",
  },
];

const stats = [
  { value: "8", label: "AI Agents" },
  { value: "6", label: "Contract Templates" },
  { value: "8", label: "Analysis Types" },
  { value: "99.9%", label: "Uptime" },
];

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    function compileShader(type: number, source: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_res");
    const uDripSpeed = gl.getUniformLocation(program, "u_dripSpeed");
    gl.uniform1f(uDripSpeed, 0.5);

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
    <div className="relative min-h-screen bg-[#001A33]">
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled ? "bg-[#001A33]/90 backdrop-blur-xl border-b border-[#00BFBF]/10" : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Scale className="w-7 h-7 text-[#00BFBF]" />
              <span className="text-lg font-semibold text-[#E0F2F1]">Nexus Legal</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-[#7A8B99] hover:text-[#00BFBF] transition-colors">Features</a>
              <a href="#capabilities" className="text-sm text-[#7A8B99] hover:text-[#00BFBF] transition-colors">Capabilities</a>
              <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all glow-teal-hover">
                Launch Platform <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-16">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00BFBF]/10 border border-[#00BFBF]/20 text-[#00BFBF] text-xs font-mono-data mb-8 animate-fade-in">
              <Sparkles size={14} />
              AI-POWERED LEGAL INTELLIGENCE PLATFORM
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold text-[#E0F2F1] tracking-tight leading-tight mb-6 animate-fade-in">
              Intelligence-Driven
              <br />
              <span className="text-[#00BFBF]">Legal Workflow</span>
            </h1>

            <p className="text-lg md:text-xl text-[#7A8B99] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
              Combine the power of AI and NLP to automate contract analysis,
              summarize judgments, identify statutes, and search precedents —
              making law more accessible, efficient, and transparent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#00BFBF] text-[#001A33] text-base font-semibold hover:brightness-110 transition-all glow-teal-hover"
              >
                <Zap size={18} />
                Initialize Session
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#002B52]/60 border border-[#00BFBF]/20 text-[#E0F2F1] text-base font-medium hover:bg-[#002B52] transition-all"
              >
                Explore Features <ChevronRight size={18} />
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-semibold text-[#00BFBF]">{s.value}</p>
                  <p className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-mono-data text-[#00BFBF] uppercase tracking-widest mb-3">Platform Features</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#E0F2F1]">
                CoT Multi-Agent Architecture
              </h2>
              <p className="text-[#7A8B99] mt-3 max-w-xl mx-auto">
                Eight specialized AI agents work in a coordinated chain to parse,
                analyze, and synthesize legal intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="glass-card rounded-2xl p-6 glow-teal-hover transition-all duration-300 group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#00BFBF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00BFBF]/20 transition-colors">
                      <Icon size={22} className="text-[#00BFBF]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#E0F2F1] mb-2">{f.title}</h3>
                    <p className="text-sm text-[#7A8B99] leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CoT Pipeline */}
        <section id="capabilities" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-mono-data text-[#00BFBF] uppercase tracking-widest mb-3">Processing Pipeline</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#E0F2F1]">
                How It Works
              </h2>
            </div>

            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {[
                  { icon: FileText, label: "Document Input", desc: "Upload legal text" },
                  { icon: Brain, label: "Parser Agent", desc: "Structure extraction" },
                  { icon: Search, label: "Precedent Finder", desc: "Case law search" },
                  { icon: ShieldCheck, label: "Risk Analyst", desc: "Risk assessment" },
                  { icon: Sparkles, label: "Summarizer", desc: "Synthesize output" },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 flex items-center justify-center mb-3">
                        <Icon size={24} className="text-[#00BFBF]" />
                      </div>
                      <p className="text-sm font-medium text-[#E0F2F1]">{step.label}</p>
                      <p className="text-xs text-[#7A8B99]">{step.desc}</p>
                      {i < 4 && (
                        <div className="hidden md:block absolute translate-x-20">
                          <ArrowRight size={16} className="text-[#00BFBF]/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/10 flex items-center justify-center mb-4">
                    <Lock size={24} className="text-[#00BFBF]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#E0F2F1] mb-2">End-to-End Encryption</h3>
                  <p className="text-sm text-[#7A8B99]">AES-256 at rest, TLS 1.3 in transit. Your legal documents are protected with military-grade encryption.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/10 flex items-center justify-center mb-4">
                    <Globe size={24} className="text-[#00BFBF]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#E0F2F1] mb-2">OAuth 2.0 Security</h3>
                  <p className="text-sm text-[#7A8B99]">Enterprise-grade authentication with JWT sessions and role-based access control.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/10 flex items-center justify-center mb-4">
                    <ShieldCheck size={24} className="text-[#00BFBF]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#E0F2F1] mb-2">Ethical AI</h3>
                  <p className="text-sm text-[#7A8B99]">Built-in bias detection, fairness auditing, and transparency reporting for responsible AI.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#E0F2F1] mb-4">
              Ready to Redefine Your Legal Practice?
            </h2>
            <p className="text-[#7A8B99] mb-8">
              Start analyzing legal documents with AI-powered intelligence today.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#00BFBF] text-[#001A33] text-base font-semibold hover:brightness-110 transition-all glow-teal-hover"
            >
              <Zap size={18} />
              Start Free Trial
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#00BFBF]/10 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Scale className="w-6 h-6 text-[#00BFBF]" />
                <span className="text-sm font-semibold text-[#E0F2F1]">Nexus Legal</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-[#7A8B99]">
                <Link to="/dashboard" className="hover:text-[#00BFBF] transition-colors">Dashboard</Link>
                <a href="#features" className="hover:text-[#00BFBF] transition-colors">Features</a>
                <a href="#capabilities" className="hover:text-[#00BFBF] transition-colors">Capabilities</a>
              </div>
              <p className="text-xs text-[#7A8B99]"> Nexus Legal. AI-powered legal intelligence.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
