/* ══════════════════════════════════════════════════════════════
   ROCHA & QUEIROZ — interações (vanilla, sem dependências, ~9KB)
   Tudo aqui é progressivo: sem JS o site continua legível e navegável.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const doc = document, win = window;
  const reduce = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = win.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));

  /* ---------- Header: fundo ao rolar + esconde ao descer / mostra ao subir ---------- */
  const head = $("#siteHead");
  let lastY = win.scrollY, ticking = false;
  const onScroll = () => {
    const y = win.scrollY;
    if (head) {
      head.classList.toggle("is-stuck", y > 24);
      if (y > 320 && y > lastY + 6 && !doc.body.classList.contains("menu-open")) head.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 320) head.classList.remove("is-hidden");
    }
    lastY = y;
    ticking = false;
  };
  win.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger"), mm = $("#mobileMenu");
  let menuTimer;
  const setMenu = (open) => {
    if (!burger || !mm) return;
    clearTimeout(menuTimer);
    // fechado, o menu fica com [hidden] (fora do layout); ao abrir, aparece e só então anima
    if (open) { mm.hidden = false; void mm.offsetWidth; }
    else menuTimer = setTimeout(() => { if (!mm.classList.contains("is-open")) mm.hidden = true; }, 750);
    burger.classList.toggle("is-open", open);
    mm.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    doc.body.classList.toggle("menu-open", open);
    doc.body.style.overflow = open ? "hidden" : "";
    if (open) { const first = $("a", mm); first && first.focus({ preventScroll: true }); }
  };
  if (burger) burger.addEventListener("click", () => setMenu(!burger.classList.contains("is-open")));
  if (mm) $$("a", mm).forEach(a => a.addEventListener("click", () => setMenu(false)));
  doc.addEventListener("keydown", e => { if (e.key === "Escape" && burger && burger.classList.contains("is-open")) { setMenu(false); burger.focus(); } });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal, .stagger, .mask-lines");
  if ("IntersectionObserver" in win && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(el => io.observe(el));
    // rede de segurança: nada fica invisível por mais de 4s
    // rede de segurança: o que já ficou para trás (acima da dobra atual) e não foi revelado aparece sem animação
    setTimeout(() => revealEls.forEach(el => { if (!el.classList.contains("in") && el.getBoundingClientRect().top < win.innerHeight) el.classList.add("in", "in-now"); }), 4000);
  } else revealEls.forEach(el => el.classList.add("in"));

  /* ---------- Hero: título entra assim que a página carrega ---------- */
  const heroTitle = $(".hero .mask-lines");
  if (heroTitle) requestAnimationFrame(() => setTimeout(() => heroTitle.classList.add("in"), 80));

  /* ---------- Vídeo ambiente do hero (só quando faz sentido) ---------- */
  const heroVideo = $("#heroVideo");
  if (heroVideo && !reduce) {
    const conn = navigator.connection || {};
    const okNet = !conn.saveData && !/2g/.test(conn.effectiveType || "");
    if (okNet && win.innerWidth >= 700) {
      const tryPlay = () => heroVideo.play().then(() => heroVideo.classList.add("is-on")).catch(() => {});
      const start = () => {
        heroVideo.querySelectorAll("source[data-src]").forEach(s => { s.src = s.dataset.src; });
        heroVideo.muted = true;
        heroVideo.load();
        tryPlay();
        // política de autoplay restritiva: tenta de novo no primeiro gesto do usuário
        const retry = () => { if (heroVideo.paused) tryPlay(); };
        ["pointerdown", "touchstart", "keydown", "scroll"].forEach(ev => win.addEventListener(ev, retry, { once: true, passive: true }));
      };
      if (doc.readyState === "complete") setTimeout(start, 400); else win.addEventListener("load", () => setTimeout(start, 400), { once: true });
      // pausa quando sai da tela (economia de bateria)
      if ("IntersectionObserver" in win) new IntersectionObserver(([e]) => { if (!heroVideo.src && !heroVideo.querySelector("source[src]")) return; e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(); }, { threshold: 0 }).observe(heroVideo);
    }
  }

  /* ---------- Rotador de palavras (hero) ---------- */
  const rot = $("#rotator");
  if (rot) {
    const words = (rot.dataset.words || "").split("|").filter(Boolean);
    let i = 0;
    if (words.length > 1 && !reduce) {
      setInterval(() => {
        rot.classList.add("is-out");
        setTimeout(() => { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove("is-out"); }, 420);
      }, 3600);
    }
  }

  /* ---------- Contadores ---------- */
  const counters = $$("[data-count-to]");
  if (counters.length) {
    const run = el => {
      const to = parseFloat(el.dataset.countTo), dur = 1400, t0 = performance.now();
      const suffix = el.dataset.suffix || "";
      const step = now => {
        const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      if (reduce) el.textContent = to + suffix; else requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }), { threshold: .5 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Magnético (desktop) ---------- */
  if (fine && !reduce) {
    $$("[data-magnetic]").forEach(el => {
      const k = 14;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * k}px, ${((e.clientY - r.top) / r.height - .5) * k}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
    $$(".card, [data-tilt]").forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%"); card.style.setProperty("--my", py * 100 + "%");
        if (card.hasAttribute("data-tilt")) card.style.transform = `perspective(1200px) rotateX(${(.5 - py) * 2.5}deg) rotateY(${(px - .5) * 2.5}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Barra de progresso ---------- */
  const prog = $("#progress");
  if (prog) {
    const upd = () => { const max = doc.documentElement.scrollHeight - win.innerHeight; prog.style.transform = `scaleX(${max > 0 ? Math.min(win.scrollY / max, 1) : 0})`; };
    win.addEventListener("scroll", upd, { passive: true }); win.addEventListener("resize", upd); upd();
  }

  /* ---------- Filme institucional ---------- */
  const stage = $("#filmeStage"), video = $("#videoHome"), playBtn = $("#filmePlay");
  if (stage && video) {
    const play = () => { video.play().catch(() => {}); };
    if (playBtn) playBtn.addEventListener("click", play);
    video.addEventListener("play", () => stage.classList.add("is-playing"));
    video.addEventListener("pause", () => stage.classList.remove("is-playing"));
    video.addEventListener("ended", () => stage.classList.remove("is-playing"));
  }

  /* ---------- Filtro da equipe ---------- */
  const teamFilter = $("#teamFilter");
  if (teamFilter) {
    const groups = $$(".team-group"), chips = $$(".chip", teamFilter), search = $("#teamSearch");
    const countEl = $("#teamCount"), emptyEl = $("#teamEmpty"), resetBtn = $("#teamReset");
    let area = "todos";
    const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    let debounce;
    const apply = () => {
      const q = norm(search ? search.value : "");
      let total = 0;
      groups.forEach(g => {
        let vis = 0;
        $$(".tm", g).forEach(c => {
          const okArea = area === "todos" || (c.dataset.area || "").split(" ").includes(area);
          const okText = !q || (c.dataset.search || "").includes(q);
          const show = okArea && okText;
          c.classList.toggle("is-hidden", !show);
          if (show) { c.classList.add("in"); vis++; total++; }
        });
        g.classList.toggle("is-hidden", vis === 0);
        const gc = $("[data-count]", g); if (gc) gc.textContent = vis;
      });
      if (countEl) countEl.textContent = total + (total === 1 ? " profissional" : " profissionais");
      if (emptyEl) emptyEl.hidden = total > 0;
      const url = new URL(win.location.href);
      area === "todos" ? url.searchParams.delete("area") : url.searchParams.set("area", area);
      q ? url.searchParams.set("q", q) : url.searchParams.delete("q");
      history.replaceState(null, "", url);
    };
    chips.forEach(ch => ch.addEventListener("click", () => {
      chips.forEach(c => { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
      ch.classList.add("is-active"); ch.setAttribute("aria-pressed", "true");
      area = ch.dataset.filter; apply();
    }));
    if (search) search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(apply, 120); });
    if (resetBtn) resetBtn.addEventListener("click", () => {
      area = "todos"; if (search) search.value = "";
      chips.forEach(c => { const on = c.dataset.filter === "todos"; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      apply(); search && search.focus();
    });
    // estado inicial via URL (?area=tributario&q=nome)
    const params = new URL(win.location.href).searchParams;
    const a0 = params.get("area"), q0 = params.get("q");
    if (a0) { const ch = chips.find(c => c.dataset.filter === a0); if (ch) { chips.forEach(c => { const on = c === ch; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); }); area = a0; } }
    if (q0 && search) search.value = q0;
    apply();
  }

  /* ---------- Formulários (validação + envio sem back-end via mailto / Formspree) ---------- */
  $$("form[data-form]").forEach(form => {
    const status = $(".form__status", form);
    const setStatus = (msg, state) => { if (status) { status.textContent = msg; status.dataset.state = state || ""; } };
    const isBad = f => f.type === "checkbox" ? !f.checked : !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
    // reavalia o campo enquanto o usuário corrige, e limpa o aviso quando tudo estiver certo
    const recheck = e => {
      const f = e.target; if (!f.hasAttribute || f.getAttribute("aria-invalid") !== "true") return;
      f.setAttribute("aria-invalid", String(isBad(f)));
      if (!$$("[aria-invalid=\"true\"]", form).length && status && status.dataset.state === "error") setStatus("", "");
    };
    form.addEventListener("input", recheck); form.addEventListener("change", recheck);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach(f => {
        const bad = isBad(f);
        f.setAttribute("aria-invalid", String(bad));
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) { setStatus("Confira os campos destacados.", "error"); return; }
      if ($(".hp input", form) && $(".hp input", form).value) return; // honeypot
      const data = Object.fromEntries(new FormData(form).entries());
      const endpoint = form.dataset.endpoint; // ex.: https://formspree.io/f/xxxx
      if (endpoint) {
        setStatus("Enviando…");
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error();
          form.reset(); setStatus("Mensagem enviada. Retornaremos em breve.", "ok");
        } catch { setStatus("Não foi possível enviar agora. Tente pelo WhatsApp ou e-mail.", "error"); }
      } else {
        // sem back-end configurado: abre o e-mail do cliente já preenchido
        const to = form.dataset.mailto || "rq@rochaqueiroz.adv.br";
        const subject = encodeURIComponent(form.dataset.subject || "Contato pelo site");
        const body = encodeURIComponent(Object.entries(data).filter(([k]) => !/^(consent|_)/.test(k)).map(([k, v]) => `${k}: ${v}`).join("\n"));
        win.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        setStatus("Abrindo seu aplicativo de e-mail…", "ok");
      }
    });
  });

  /* ---------- WhatsApp flutuante ---------- */
  const wa = $("#waFloat");
  if (wa) {
    setTimeout(() => wa.classList.add("is-in"), 1200);
    // recolhe enquanto o topo da página (que já tem CTA) ou o rodapé (que já tem o WhatsApp) estão visíveis
    const zones = $$(".hero, .page-hero, #rodape");
    if (zones.length && "IntersectionObserver" in win) {
      const seen = new Set();
      const upd = es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); wa.classList.toggle("is-away", seen.size > 0); };
      const ioTop = new IntersectionObserver(upd, { threshold: 0.35 }), ioFoot = new IntersectionObserver(upd, { threshold: 0.05 });
      zones.forEach(z => (z.id === "rodape" ? ioFoot : ioTop).observe(z));
    }
  }

  /* ---------- Índice lateral dos textos longos: marca a seção em leitura ---------- */
  const tocLinks = $$(".legal-toc__list a[href^=\"#\"], .art-toc a[href^=\"#\"]");
  if (tocLinks.length && "IntersectionObserver" in win) {
    const map = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const a = map.get(e.target.id); if (!a) return;
      tocLinks.forEach(l => l.removeAttribute("aria-current")); a.setAttribute("aria-current", "true");
      const box = a.closest("ol, ul"); if (box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
    }), { rootMargin: "-25% 0px -65% 0px" });
    map.forEach((a, id) => { const h = doc.getElementById(id); if (h) spy.observe(h); });
  }

  /* ---------- Âncoras suaves com offset do header ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault();
      const bar = $(".atu-subnav, .team-filter");
      const off = (head ? head.offsetHeight : 72) + (bar && !bar.contains(t) ? bar.offsetHeight : 0) + 12;
      const y = t.getBoundingClientRect().top + win.scrollY - off;
      win.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true });
    });
  });

  /* ---------- Ano corrente onde marcado ---------- */
  $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
})();
