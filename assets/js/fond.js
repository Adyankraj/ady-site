/* Ady Ankraj : fond animé (brume, lumière, étoiles, éclipse). Aucun réglage à faire ici. */
/* ---------- Fond 3D (WebGL) : brume volumétrique, rayons de lumière, 3 plans d'étoiles, parallaxe ---------- */
(function () {
  var cvs = document.getElementById("bg");
  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gl = null;
  try {
    gl =
      cvs.getContext("webgl", {
        antialias: false,
        premultipliedAlpha: false,
      }) || cvs.getContext("experimental-webgl");
  } catch (e) {}
  if (!gl) return; /* sans WebGL, le fond reste simplement sombre */

  var hp =
    gl.getShaderPrecisionFormat &&
    gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  var prec = hp && hp.precision > 0 ? "highp" : "mediump";
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision " + prec + " float;",
    "uniform vec2 u_res;uniform float u_time;uniform vec2 u_light;uniform float u_rad;uniform vec2 u_par;uniform float u_cam;",
    "uniform vec2 u_sh0;uniform vec2 u_sh1;uniform float u_sha;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}",
    "float fbm2(vec2 p){return .62*noise(p)+.38*noise(mat2(1.6,1.2,-1.2,1.6)*p);}",
    "float stars(vec2 uv,float sc,float thr,float t,float sz,float ta){",
    " vec2 q=uv*sc;vec2 id=floor(q);vec2 f=fract(q)-.5;float h=hash(id);",
    " if(h<thr) return 0.;",
    " vec2 off=(vec2(hash(id+3.1),hash(id+7.7))-.5)*.7;float d=length(f-off);",
    " float tw=1.-ta*(.45-.45*sin(t*(.8+h*2.5)+h*40.));",
    " float b=(1.-smoothstep(0.,sz,d))*tw*(.35+.65*(h-thr)/(1.-thr));",
    " b+=.25*exp(-d*d*120.)*step(.985,h)*tw;",
    " return b;}",
    "void main(){",
    " vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;float t=u_time;",
    " vec2 L=u_light;float R=u_rad;vec2 par=u_par;",
    " vec2 drift=vec2(t*.008,t*.003);",
    " vec2 fp=(uv+par*.04+vec2(u_cam*.25,0.))*1.3+drift;",
    " float fogA=fbm(fp*1.6);",
    " float fogB=fbm((uv+par*.09)*4.+vec2(5.2,1.3)-vec2(t*.016,0.));",
    " float fog=smoothstep(.38,.9,fogA*.62+fogB*.45);",
    " float dL=length(uv-L);",
    /* rayons : on remonte vers la source en lisant la brume */
    " float rays=0.;vec2 dir=(L-uv)/10.;vec2 sp=uv;float dec=1.;",
    " for(int i=0;i<10;i++){sp+=dir;float dn=fbm2(((sp+par*.04)*1.3+drift)*1.6);rays+=smoothstep(.3,.82,dn)*dec;dec*=.88;}",
    " rays/=5.;",
    " float fall=exp(-dL*dL/(R*R)*2.);",
    " float core=exp(-dL*dL/(R*R)*16.);",
    " vec3 warm=vec3(1.,.64,.36);",
    " vec3 col=vec3(.022,.014,.010);",
    " col+=vec3(.11,.06,.04)*fog*(.2+.8*fall);",
    " col+=warm*rays*fall*.55;",
    " col+=warm*core*.30+vec3(1.,.84,.62)*exp(-dL*dL/(R*R)*70.)*.12;",
    /* trois plans d'étoiles : plus proche = plus gros, plus de parallaxe */
    " float st=stars(uv+par*.012+vec2(u_cam*.15+t*.0006,0.),90.,.86,t,.13,1.)*.45",
    "   +stars(uv+par*.025+vec2(u_cam*.5+t*.0012,0.),46.,.9,t,.085,.4)*.7",
    "   +stars(uv+par*.045+vec2(u_cam*1.6+t*.002,0.),20.,.945,t,.05,.05);",
    " st*=(1.-.75*fall)*(1.-.55*fog);",
    " col+=vec3(1.,.95,.88)*st;",
    /* étoile filante */
    " if(u_sha>0.){vec2 pa=uv-u_sh0,ba=u_sh1-u_sh0;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);float d=length(pa-ba*h);",
    "  float occ=1.-.6*fog;col+=vec3(1.,.9,.8)*u_sha*occ*(1.-smoothstep(0.,.0018,d))*h*h;",
    "  float dh=length(uv-u_sh1);col+=vec3(1.,.9,.8)*u_sha*occ*.5*exp(-dh*dh*20000.);}",
    " float v=1.-smoothstep(.25,1.15,length(uv*vec2(.9,1.1)-vec2(0.,.05)));",
    " col*=mix(.06,1.,v);",
    " col+=(hash(gl_FragCoord.xy+fract(t*.37)*311.)-.5)*.016;",
    " gl_FragColor=vec4(max(col,0.),1.);",
    "}",
  ].join("\n");

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS),
    fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var pr = gl.createProgram();
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  var loc = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  [
    "u_res",
    "u_time",
    "u_light",
    "u_rad",
    "u_par",
    "u_cam",
    "u_sh0",
    "u_sh1",
    "u_sha",
  ].forEach(function (n) {
    U[n] = gl.getUniformLocation(pr, n);
  });

  var W = 0,
    H = 0,
    scale = 1,
    boot = true,
    running = true,
    mx = 0,
    my = 0,
    tx = 0,
    ty = 0,
    lastPointer = -1e9,
    lastT = 0,
    star = null,
    nextStar = null;
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    var small =
      W < 750 || (window.matchMedia && matchMedia("(pointer:coarse)").matches);
    var px = W * H * scale * scale,
      cap = boot ? 160000 : small ? 300000 : 650000;
    if (px > cap) scale *= Math.sqrt(cap / px);
    cvs.width = Math.round(W * scale);
    cvs.height = Math.round(H * scale);
    gl.viewport(0, 0, cvs.width, cvs.height);
    if (reduce) draw(0);
  }
  function toUV(x, y) {
    return [(x - W / 2) / H, (H / 2 - y) / H];
  }
  function draw(t) {
    var dt = Math.min(64, Math.max(0, t - lastT));
    lastT = t;
    if (t - lastPointer > 3000) {
      tx = Math.sin(t * 0.00004) * 0.2;
      ty = Math.cos(t * 0.00003) * 0.1;
    }
    /* lévitation : la caméra flotte doucement de haut en bas, les plans proches bougent plus que les lointains */
    var bob = reduce
      ? 0
      : Math.sin(t * 0.00034) * 0.16 +
        Math.sin(t * 0.00013) *
          0.08; /* lévitation très lente et très ample, sans secousse */
    var e = reduce ? 1 : Math.min(1, dt * 0.0025);
    mx += (tx - mx) * e;
    my += (ty - my) * e;
    var s = t * 0.00006;
    /* dérive continue vers la droite : forte au début, puis lente mais jamais arrêtée */
    var sC =
      window.__introStart != null
        ? Math.max(0, (t - window.__introStart - 1000) / 1000)
        : 0;
    if (reduce) sC = 40;
    var camPx =
      9 *
      (sC -
        4 *
          (1 -
            Math.exp(
              -sC / 4,
            ))); /* démarre en douceur, puis avance à vitesse lente et constante */
    /* la lumière est très loin : elle glisse aussi vers la gauche, mais lentement, et reste dans le cadre */
    var lightX =
      W * 0.62 -
      camPx *
        0.13; /* elle continue de glisser très lentement vers la gauche, sans s'arrêter */
    /* une fois l'éclipse arrivée, on s'en éloigne peu à peu : la lumière et l'éclipse rapetissent doucement */
    var rec =
      1 -
      0.5 *
        (1 -
          Math.exp(
            -Math.max(0, sC - 14) / 40,
          )); /* on s'éloigne un peu plus vite après l'arrivée de l'éclipse */
    window.__cam = camPx;
    window.__bob = bob;
    var px = lightX + W * 0.01 * Math.sin(s * 1.6),
      py = H * (0.24 + 0.015 * Math.cos(s * 1.1));
    var since = window.__introStart != null ? t - window.__introStart : 1e9;
    var k = Math.min(1, Math.max(0, (since - 1100) / 1800));
    k = k * k * (3 - 2 * k);
    var cx = W * 0.5 + (px - W * 0.5) * k,
      cy = H * 0.5 + (py - H * 0.5) * k + bob * H * 0.006;
    var R =
      ((Math.min(W, H) * 0.2 +
        (Math.max(W, H) * 0.42 - Math.min(W, H) * 0.2) * k) /
        H) *
      rec;
    var flick = 0.95 + 0.05 * Math.sin(t * 0.0012) * Math.sin(t * 0.00068);
    var L = toUV(cx, cy);
    window.__glow = { x: cx, y: cy, k: k };
    /* l'éclipse est plus proche que la lumière : notre dérive la fait glisser devant elle ;
       arrivée devant, elle ralentit et ne la découvre jamais entièrement */
    var rcE = Math.min(W, H) * (W < 560 ? 0.15 : 0.12),
      rel0 = W + rcE * 2.4 - W * 0.62;
    var camArrive = 9 * (12 - 4 * (1 - Math.exp(-12 / 4))),
      zr = rel0 / camArrive; /* arrivée devant la lumière vers 12 s */
    var rel = rel0 - camPx * zr,
      lim = -0.3 * rcE;
    if (rel < lim)
      rel = lim - 0.3 * rcE * (1 - Math.exp((rel - lim) / (0.3 * rcE)));
    window.__ecl = {
      dx: rel * rec,
      rc: rcE * rec,
      a: Math.min(1, camPx / camArrive),
    };
    /* étoile filante en courbe, toutes les 10 s */
    var sha = 0,
      h0 = [0, 0],
      h1 = [0, 0];
    if (!reduce) {
      /* étoiles filantes lointaines : petites, brèves, à un endroit et dans une direction différents à chaque fois */
      if (nextStar === null) nextStar = t + rnd(5000, 8000);
      if (!star && t >= nextStar) {
        var m = Math.min(W, H),
          x0 = W * rnd(0.05, 0.95),
          y0 = H * rnd(0.03, 0.55),
          ang =
            Math.PI * (Math.random() < 0.5 ? rnd(0.18, 0.38) : rnd(0.62, 0.82)),
          len = m * rnd(0.07, 0.14);
        var x2 = x0 + Math.cos(ang) * len,
          y2 = y0 + Math.sin(ang) * len;
        star = {
          x0: x0,
          y0: y0,
          x2: x2,
          y2: y2,
          x1: (x0 + x2) / 2 + rnd(-0.04, 0.04) * len,
          y1: (y0 + y2) / 2 - rnd(0, 0.06) * len,
          t0: t,
          dur: rnd(650, 1000),
        };
        nextStar = t + rnd(6000, 14000);
      }
      if (star) {
        var sp = (t - star.t0) / star.dur;
        if (sp >= 1) {
          star = null;
        } else {
          var bz = function (u) {
            var v = 1 - u;
            return [
              v * v * star.x0 + 2 * v * u * star.x1 + u * u * star.x2,
              v * v * star.y0 + 2 * v * u * star.y1 + u * u * star.y2,
            ];
          };
          var head = sp * (2 - sp) * 0.9 + 0.05,
            tail = Math.max(0, head - 0.35),
            a = bz(tail),
            b = bz(head);
          h0 = toUV(a[0], a[1]);
          h1 = toUV(b[0], b[1]);
          sha = Math.sin(Math.PI * sp) * 0.42;
        }
      }
    }
    gl.uniform2f(U.u_res, cvs.width, cvs.height);
    gl.uniform1f(U.u_time, reduce ? 20 : t / 1000);
    gl.uniform2f(U.u_light, L[0], L[1]);
    gl.uniform1f(U.u_rad, R * flick);
    gl.uniform2f(U.u_par, mx, -(my + bob));
    gl.uniform1f(U.u_cam, (camPx / H) % 400);
    gl.uniform2f(U.u_sh0, h0[0], h0[1]);
    gl.uniform2f(U.u_sh1, h1[0], h1[1]);
    gl.uniform1f(U.u_sha, sha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(t) {
    if (!running) return;
    draw(t);
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", resize);
  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / W - 0.5) * 2;
      ty = (e.clientY / H - 0.5) * 2;
      lastPointer = performance.now();
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  });
  resize();
  /* démarrage rapide en basse définition, puis pleine qualité */
  setTimeout(function () {
    boot = false;
    resize();
  }, 1400);
  if (reduce) draw(0);
  else requestAnimationFrame(loop);
})();

/* ---------- Éclipse : on dérive lentement vers la droite et elle passe devant la lumière, sans jamais la cacher ni la libérer entièrement ---------- */
(function () {
  var c = document.getElementById("orbit");
  if (!c) return;
  var x = c.getContext("2d");
  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0,
    H = 0,
    dpr = 1,
    running = true;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeRocks();
  }
  var rocks = [];
  /* débris de roche en suspension : quelques fragments sombres, à différentes distances, éclairés par la lumière */
  function makeRocks() {
    rocks = [];
    var n = W < 560 ? 7 : 10,
      zs = [
        0.25, 0.4, 0.55, 1.4, 0.65, 0.35, 0.75, 0.5, 0.3, 0.6,
      ]; /* un seul débris assez proche pour passer devant l'éclipse */
    for (var i = 0; i < n; i++) {
      var z = zs[i % zs.length] * (0.85 + Math.random() * 0.3),
        r = (2.2 + z * 7) * (0.7 + Math.random() * 0.7) * (W < 560 ? 0.9 : 1.1);
      var pts = [],
        m = 9 + Math.floor(Math.random() * 4);
      for (var k = 0; k < m; k++) {
        var an = (k / m) * 6.283 + Math.random() * 0.35,
          rr = r * (0.68 + Math.random() * 0.45);
        pts.push([Math.cos(an) * rr, Math.sin(an) * rr * 0.85]);
      }
      rocks.push({
        z: z,
        r: r,
        pts: pts,
        x: Math.random(),
        y: 0.06 + Math.random() * 0.88,
        rot: Math.random() * 6.283,
        vr: (Math.random() - 0.5) * 0.00016,
        ph: Math.random() * 6.28,
      });
    }
    /* un débris lointain, en haut, visible dès l'ouverture : il montre tout de suite qu'on dérive */
    var rf = W < 560 ? 4.2 : 5.6,
      pf = [];
    for (var k = 0; k < 11; k++) {
      var an = (k / 11) * 6.283 + Math.random() * 0.3,
        rr = rf * (0.7 + Math.random() * 0.4);
      pf.push([Math.cos(an) * rr, Math.sin(an) * rr * 0.8]);
    }
    rocks.push({
      z: 0.16,
      r: rf,
      pts: pf,
      x: 0.66,
      y: 0.17,
      rot: 0.4,
      vr: 0.00007,
      ph: 1,
      vis: 0.72,
    });
    rocks.sort(function (a, b) {
      return a.z - b.z;
    });
  }
  function drawRock(o, t, g, cam, bob, ex, ey, er) {
    var span = W + 120,
      px = ((((o.x * span - cam * o.z * 1.1) % span) + span) % span) - 60,
      py = o.y * H - bob * o.z * 14 + Math.sin(t * 0.00018 + o.ph) * 3 * o.z;
    if (!reduce) o.rot += o.vr * 16;
    var lx = g.x - px,
      ly = g.y - py,
      ld = Math.sqrt(lx * lx + ly * ly) || 1;
    lx /= ld;
    ly /= ld;
    var near = 1 / (1 + Math.pow(ld / (Math.min(W, H) * 0.45), 2));
    var depthA = o.vis ? o.vis : Math.min(1, 0.35 + o.z * 0.45);
    x.save();
    x.translate(px, py);
    x.rotate(o.rot);
    var cr = Math.cos(-o.rot),
      sr = Math.sin(-o.rot),
      llx = lx * cr - ly * sr,
      lly = lx * sr + ly * cr;
    var gr = x.createLinearGradient(
      -llx * o.r,
      -lly * o.r,
      llx * o.r,
      lly * o.r,
    );
    gr.addColorStop(0, "rgba(8,5,3," + (0.95 * depthA).toFixed(3) + ")");
    gr.addColorStop(0.62, "rgba(22,14,9," + (0.95 * depthA).toFixed(3) + ")");
    gr.addColorStop(
      1,
      "rgba(" +
        Math.round(70 + 120 * near) +
        "," +
        Math.round(44 + 76 * near) +
        "," +
        Math.round(26 + 40 * near) +
        "," +
        (0.95 * depthA).toFixed(3) +
        ")",
    );
    x.fillStyle = gr;
    x.beginPath();
    x.moveTo(o.pts[0][0], o.pts[0][1]);
    for (var k = 1; k < o.pts.length; k++) x.lineTo(o.pts[k][0], o.pts[k][1]);
    x.closePath();
    x.fill();
    /* devant l'éclipse ou la lumière, on ne voit que sa silhouette : elle devient entièrement noire */
    if (er) {
      var edx = px - ex,
        edy = py - ey,
        ed = Math.sqrt(edx * edx + edy * edy),
        sil = 1 - Math.min(1, Math.max(0, (ed - er * 0.9) / (er * 1.1)));
      var gdx = px - g.x,
        gdy = py - g.y,
        gd = Math.sqrt(gdx * gdx + gdy * gdy),
        sil2 = 1 - Math.min(1, Math.max(0, (gd - er * 0.9) / (er * 1.4)));
      sil = Math.max(sil, sil2);
      sil = sil * sil * (3 - 2 * sil);
      if (sil > 0.01) {
        x.fillStyle = "rgba(3,2,1," + (sil * 0.98).toFixed(3) + ")";
        x.fill();
      }
    }
    x.restore();
  }
  function clamp(v) {
    return Math.min(1, Math.max(0, v));
  }
  function ease(t) {
    t = clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function draw(t) {
    var t0 = window.__introStart,
      since = reduce ? 60000 : t0 == null ? 0 : t - t0;
    var g = window.__glow || { x: W / 2, y: H / 2 };
    /* l'éclipse ne bouge presque pas d'elle-même : c'est notre dérive qui la fait passer devant la lumière */
    var e = window.__ecl || { dx: 0, rc: Math.min(W, H) * 0.13, a: 1 };
    var a = e.a,
      sc = 0.88 + 0.12 * a;
    sc *=
      1 -
      0.05 *
        (0.5 - 0.5 * Math.cos((Math.max(0, since - 13500) / 18000) * 6.283));
    var rc = e.rc * sc;
    var ox = g.x + e.dx,
      oy = g.y - rc * 0.12;
    var fin = 1;
    x.clearRect(0, 0, W, H);
    var cam = window.__cam || 0,
      bob = window.__bob || 0,
      ri;
    for (ri = 0; ri < rocks.length; ri++)
      if (rocks[ri].z < 0.9) drawRock(rocks[ri], t, g, cam, bob);
    /* la couronne n'existe que si le disque est devant la lumière : loin d'elle, l'éclipse n'est qu'une silhouette sombre */
    var ddx = g.x - ox,
      ddy = g.y - oy,
      dd = Math.sqrt(ddx * ddx + ddy * ddy);
    var ov = Math.max(0, 1 - dd / (rc * 2.2));
    ov = ov * ov * (3 - 2 * ov);
    var cg = x.createRadialGradient(ox, oy, rc * 0.9, ox, oy, rc * 1.8);
    var ca = 0.5 * fin * ov;
    cg.addColorStop(0, "rgba(255,220,168," + ca.toFixed(3) + ")");
    cg.addColorStop(0.16, "rgba(236,168,100," + (ca * 0.42).toFixed(3) + ")");
    cg.addColorStop(1, "rgba(236,168,100,0)");
    x.globalCompositeOperation = "lighter";
    x.fillStyle = cg;
    x.beginPath();
    x.arc(ox, oy, rc * 1.8, 0, 6.283);
    x.fill();
    x.globalCompositeOperation = "source-over";
    /* le disque, un noir profond légèrement modelé */
    var dg = x.createRadialGradient(
      ox - rc * 0.3,
      oy - rc * 0.3,
      0,
      ox,
      oy,
      rc,
    );
    dg.addColorStop(0, "rgba(12,7,5," + fin + ")");
    dg.addColorStop(0.93, "rgba(4,2,1," + fin + ")");
    dg.addColorStop(1, "rgba(4,2,1,0)");
    x.fillStyle = dg;
    x.beginPath();
    x.arc(ox, oy, rc, 0, 6.283);
    x.fill();
    /* un fin liseré de lumière, seulement du côté tourné vers la lumière, qui grandit en s'en approchant */
    /* liseré doux et flou : invisible au loin, il apparaît tard et grandit en approchant de la lumière */
    var prox = Math.max(0, 1 - dd / (rc * 5));
    prox = prox * prox * prox;
    var phi = Math.atan2(ddy, ddx);
    if (prox > 0.005) {
      x.lineCap = "round";
      var ws = [9, 5, 2.4],
        as = [0.05, 0.09, 0.16],
        sp = 0.7 + 0.5 * prox;
      for (var q = 0; q < 3; q++) {
        x.strokeStyle =
          "rgba(255,214,160," + (as[q] * prox * fin).toFixed(3) + ")";
        x.lineWidth = ws[q] * (0.5 + 0.5 * prox);
        x.beginPath();
        x.arc(ox, oy, rc * 0.985, phi - sp, phi + sp);
        x.stroke();
      }
    }
    for (ri = 0; ri < rocks.length; ri++)
      if (rocks[ri].z >= 0.9) drawRock(rocks[ri], t, g, cam, bob, ox, oy, rc);
  }
  function loop(t) {
    if (!running) return;
    draw(t);
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", function () {
    resize();
    if (reduce)
      setTimeout(function () {
        draw(0);
      }, 50);
  });
  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  });
  resize();
  if (reduce)
    setTimeout(function () {
      draw(0);
    }, 50);
  else requestAnimationFrame(loop);
})();
