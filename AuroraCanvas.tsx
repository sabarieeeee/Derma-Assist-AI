import React, { useEffect, useRef } from 'react';

export const AuroraCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }

    const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fsSrc = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    float band(float x,float c,float w){float d=(x-c)/w;return exp(-d*d);}
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float t = u_time*0.12;
      vec3 base = mix(vec3(0.035,0.16,0.065), vec3(0.05,0.22,0.09), uv.y);
      float x = uv.x + (1.0-uv.y)*(-0.35);
      float topFade = pow(uv.y, 1.7);
      
      vec3 lime = vec3(0.72, 0.94, 0.29);
      vec3 glow = vec3(0.30, 0.62, 0.22);
      
      float r = 0.0;
      r += 0.85*band(x, 0.30 + 0.06*sin(t*1.3), 0.055 + 0.015*sin(t*0.7));
      r += 0.55*band(x, 0.44 + 0.05*sin(t*0.9+2.0), 0.10);
      r += 0.40*band(x, 0.62 + 0.07*sin(t*1.1+4.0), 0.16);
      r += 0.30*band(x, 0.16 + 0.04*sin(t*0.8+1.0), 0.09);
      r += 0.25*band(x, 0.85 + 0.05*sin(t*1.4+3.0), 0.14);
      
      float shimmer = 0.5 + 0.5*sin(u_time*0.4 + uv.x*6.0);
      vec3 col = base + glow*r*topFade*1.2 + lime*r*r*topFade*0.60*(0.7+0.3*shimmer);
      col += lime*0.08*pow(max(0.0, uv.y - 0.75)*4.0, 2.0)*band(x, 0.35+0.05*sin(t), 0.25);
      
      float vg = smoothstep(1.35, 0.35, distance(uv, vec2(0.5, 0.55)));
      col *= mix(0.75, 1.0, vg);
      gl_FragColor = vec4(col, 1.0);
    }`;

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vertShader = createShader(gl.VERTEX_SHADER, vsSrc);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    function resize() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener('resize', resize);
    resize();

    let animFrameId: number;
    function frame(t: number) {
      if (!gl) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animFrameId = requestAnimationFrame(frame);
    }
    animFrameId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="glCanvas" 
      className="absolute inset-x-0 top-0 w-full" 
      style={{ opacity: 0.85, height: '100vh' }} 
      aria-hidden="true" 
    />
  );
};

export default AuroraCanvas;
