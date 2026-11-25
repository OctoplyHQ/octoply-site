/* Octoply site script. No dependencies.
 *
 *  1. Staff log in link (Robin's Hood, Octoply organisation, with tracking)
 *  2. Header: transparent over the homepage hero, solid once you scroll past
 *  3. Hero: three photographs that cross-fade as you scroll
 *  4. Scroll reveals (adds .in to .reveal elements as they come into view)
 *  5. Menu: open/close with animation, backdrop, Escape, focus handling
 *  6. Highlight the menu link for the section you're in
 *  7. Robin's Hood screenshot sliders
 *  8. Robin's Hood feature gallery (buttons that auto-advance, with a pause button)
 */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Staff log in ------------------------------------------------------
   * https://app.r-hood.co/login?org=octoply&utm_source=octoply.co
   *   &utm_medium=website&utm_campaign=staff-login&utm_content=<where>&utm_term=<page>
   * As of Nov 2026 the Robin's Hood login only reads ?view=forgot; the other
   * parameters arrive but are ignored until the app is updated to use them. */
  const RH_LOGIN = "https://app.r-hood.co/login";
  document.querySelectorAll("a[data-rh-link]").forEach((a) => {
    const url = new URL(RH_LOGIN);
    url.searchParams.set("org", "octoply");
    url.searchParams.set("utm_source", "octoply.co");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", "staff-login");
    url.searchParams.set("utm_content", a.dataset.rhLink || "link");
    url.searchParams.set("utm_term", location.pathname);
    a.href = url.toString();
  });

  /* 2 + 3. Header over the hero, and the hero cross-fade ----------------- */
  const header = document.querySelector("[data-header]");
  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const media = hero.querySelector(".hero-media");
    const l1 = hero.querySelector(".l1");
    const l2 = hero.querySelector(".l2");
    // The hero's height comes from a ResizeObserver rather than reading
    // offsetHeight here, which would force the browser to lay out the page
    // before it has finished loading.
    let h = 0;
    let target = 0;   // where the page has scrolled to (within the hero)
    let shown = 0;    // where the animation currently is; eases towards target
    let running = false;
    const paint = (y) => {
      // Paced to the hero's height:
      // the top photo fades over its first third, the middle over the second.
      const step = h / 3;
      l1.style.opacity = (1 - Math.min(Math.max(y / step, 0), 1)).toFixed(3);
      l2.style.opacity = (1 - Math.min(Math.max((y - step) / step, 0), 1)).toFixed(3);
      media.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
    };
    // A mouse wheel scrolls in jumps of ~100px; easing towards the scroll
    // position turns those jumps into a smooth glide.
    let last = 0;
    const tick = (now) => {
      // Time-based easing: the same feel at 60 Hz, 120 Hz or on a slow phone.
      const dt = last ? Math.min(now - last, 100) : 16.7;
      last = now;
      shown += (target - shown) * (1 - Math.pow(0.86, dt / 16.7));
      if (Math.abs(target - shown) < 0.5) shown = target;
      paint(shown);
      running = shown !== target;
      if (running) requestAnimationFrame(tick); else last = 0;
    };
    const onScroll = () => {
      const y = window.scrollY;
      // Transparent only while the page is at the very top; as soon as you scroll,
      // the header turns solid so the hero text never slides under the logo and menu.
      header.classList.toggle("over-hero", y < 8);
      if (reduceMotion) return;
      target = Math.min(y, h);
      if (!running && target !== shown) { running = true; requestAnimationFrame(tick); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // This also sets the header's starting state: a ResizeObserver runs right
    // after layout, so reading the scroll position here costs nothing.
    new ResizeObserver(([entry]) => {
      h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      onScroll();
    }).observe(hero);
    // Photos 2 and 3 are hidden until you scroll, so fetch them only after
    // everything else on the page has loaded.
    const loadLayers = () => hero.querySelectorAll("[data-srcset]").forEach((el) => {
      el.srcset = el.dataset.srcset;
      el.removeAttribute("data-srcset");
    });
    if (!reduceMotion) {
      if (document.readyState === "complete") loadLayers();
      else window.addEventListener("load", loadLayers, { once: true });
    }
  }

  /* 4. Scroll reveals ---------------------------------------------------- */
  const revealables = document.querySelectorAll(".reveal, .venn, .flow, [data-timeline]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* 5. Menu ---------------------------------------------------------------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const scrim = document.querySelector("[data-scrim]");
  if (toggle && nav) {
    const setOpen = (open, { focus = true } = {}) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("menu-open", open);
      scrim?.classList.toggle("show", open);
      // Everything behind the open menu is taken out of the tab order.
      document.querySelectorAll("main, footer").forEach((el) => { el.inert = open; });
      if (open && focus) nav.querySelector("a")?.focus({ preventScroll: true });
      if (!open && focus) toggle.focus({ preventScroll: true });
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    scrim?.addEventListener("click", () => setOpen(false));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false, { focus: false }); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) setOpen(false);
    });
    // Close it if the window grows past the phone layout.
    window.matchMedia("(min-width: 861px)").addEventListener("change", (m) => { if (m.matches) setOpen(false, { focus: false }); });
  }

  /* 6. Highlight the section you're in ------------------------------------ */
  const spyLinks = [...document.querySelectorAll(".nav a[data-spy]")];
  const spySections = spyLinks.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);
  if (spySections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        spyLinks.forEach((a) => a.classList.toggle("is-current", a.dataset.spy === e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spySections.forEach((s) => spy.observe(s));
    if (hero) {
      new IntersectionObserver((es) => {
        if (es[0].isIntersecting) spyLinks.forEach((a) => a.classList.remove("is-current"));
      }, { threshold: 0.5 }).observe(hero);
    }
  }

  /* 7. Screenshot sliders -------------------------------------------------- */
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const slides = [...slider.querySelectorAll(".slide")];
    if (slides.length < 2 || reduceMotion) return;
    const host = slider.closest("a, .project-hero-visual") || slider;
    let i = 0;
    let paused = false;
    let onScreen = false;
    ["mouseenter", "focusin"].forEach((ev) => host.addEventListener(ev, () => { paused = true; }));
    ["mouseleave", "focusout"].forEach((ev) => host.addEventListener(ev, () => { paused = false; }));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; }).observe(slider);
    } else {
      onScreen = true;
    }
    setInterval(() => {
      if (paused || !onScreen || document.hidden) return;
      slides[i].classList.remove("active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("active");
    }, Number(slider.dataset.interval) || 4000);
  });

  /* 8. Feature gallery ------------------------------------------------------ */
  document.querySelectorAll("[data-gallery]").forEach((g) => {
    const row = g.querySelector(".gallery-tabs");
    const tabs = [...row.querySelectorAll("button")];
    const img = g.querySelector("[data-gallery-img]");
    const title = g.querySelector("[data-gallery-title]");
    const text = g.querySelector("[data-gallery-text]");
    const bar = g.querySelector("[data-gallery-progress]");
    const pause = g.querySelector("[data-gallery-pause]");
    const dur = Number(g.dataset.interval) || 6000;
    let current = 0;
    let timer = null;
    let auto = !reduceMotion;

    const setAuto = (on) => {
      auto = on;
      if (pause) { pause.textContent = on ? "Pause" : "Play"; pause.setAttribute("aria-pressed", String(!on)); }
      clearTimeout(timer);
      bar?.classList.remove("run");
      if (on) show(current + 1);
    };
    const show = (n) => {
      current = (n + tabs.length) % tabs.length;
      const t = tabs[current];
      tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      // Keep the active button visible in the sideways-scrolling row (phones) without moving the page.
      if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: t.offsetLeft - 20, behavior: reduceMotion ? "auto" : "smooth" });
      img.classList.add("fading");
      setTimeout(() => {
        img.src = t.dataset.src;
        img.alt = `Robin's Hood: ${t.dataset.title}`;
        title.textContent = t.dataset.title;
        text.textContent = t.dataset.text;
        img.classList.remove("fading");
      }, 200);
      if (bar) { bar.classList.remove("run"); void bar.offsetWidth; if (auto) bar.classList.add("run"); }
      clearTimeout(timer);
      if (auto) timer = setTimeout(() => show(current + 1), dur);
    };
    if (bar) bar.style.setProperty("--dur", `${dur}ms`);
    if (pause) { if (reduceMotion) pause.hidden = true; pause.addEventListener("click", () => setAuto(!auto)); }
    tabs.forEach((t, n) => t.addEventListener("click", () => { if (auto) setAuto(false); show(n); }));
    row.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      if (auto) setAuto(false);
      show(keys[e.key]);
      tabs[current].focus();
    });
    // Fetch the other screenshots and start cycling only once the gallery is on screen.
    const start = () => {
      tabs.forEach((t) => { const pre = new Image(); pre.src = t.dataset.src; });
      if (auto) show(0);
    };
    if ("IntersectionObserver" in window) {
      const go = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { start(); go.disconnect(); }
      }, { threshold: 0.3 });
      go.observe(g);
    } else {
      start();
    }
  });
})();
