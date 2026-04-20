/* =========================================================
   TSNM Website JS
   - Mobile nav toggle
   - Smooth scroll + close nav on click
   - Form validation + success message (front-end only)
   - Reviews slider (10 slides) with dots + autoplay
   - Footer year
========================================================= */

(function () {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  function setNav(open) {
    if (!navMenu || !navToggle) return;
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = !navMenu.classList.contains("is-open");
      setNav(open);
    });

    // Close menu when clicking a nav link (mobile)
    navMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setNav(false));
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const isClickInside = navMenu.contains(e.target) || navToggle.contains(e.target);
      if (!isClickInside) setNav(false);
    });
  }

  // Smooth scroll offset (accounts for sticky header)
  const header = document.querySelector(".navbar");
  function getHeaderOffset() {
    return header ? header.getBoundingClientRect().height + 10 : 80;
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  /* -------------------------
     Simple form validation
     (Front-end only. Hook into Formspree/Supabase later.)
  ------------------------- */

  function showError(inputId, message) {
    const err = document.querySelector(`[data-error-for="${inputId}"]`);
    if (err) err.textContent = message || "";
  }

  function clearErrors(form) {
    form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  }

  function isValidEmail(email) {
    // simple, practical
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function normalizePhone(phone) {
    return String(phone || "").replace(/[^\d]/g, "");
  }

  function validateHeroForm(form) {
    clearErrors(form);
    let ok = true;

    const first = form.querySelector("#heroFirst");
    const last = form.querySelector("#heroLast");
    const phone = form.querySelector("#heroPhone");
    const email = form.querySelector("#heroEmail");
    const service = form.querySelector("#heroService");

    if (!first.value.trim()) { showError("heroFirst", "First name is required."); ok = false; }
    if (!last.value.trim()) { showError("heroLast", "Last name is required."); ok = false; }

    const p = normalizePhone(phone.value);
    if (p.length < 10) { showError("heroPhone", "Please enter a valid phone number."); ok = false; }

    if (!email.value.trim() || !isValidEmail(email.value.trim())) {
      showError("heroEmail", "Please enter a valid email.");
      ok = false;
    }

    if (!service.value) { showError("heroService", "Please select a service."); ok = false; }

    return ok;
  }

  function validateEstimateForm(form) {
    clearErrors(form);
    let ok = true;

    const requiredIds = ["firstName", "lastName", "street", "city", "state", "zip", "phone", "email"];
    requiredIds.forEach((id) => {
      const el = form.querySelector(`#${id}`);
      if (!el || !el.value.trim()) {
        showError(id, "This field is required.");
        ok = false;
      }
    });

    const phoneEl = form.querySelector("#phone");
    const emailEl = form.querySelector("#email");
    const zipEl = form.querySelector("#zip");
    const stateEl = form.querySelector("#state");

    if (phoneEl) {
      const p = normalizePhone(phoneEl.value);
      if (p.length < 10) { showError("phone", "Please enter a valid phone number."); ok = false; }
    }

    if (emailEl && (!emailEl.value.trim() || !isValidEmail(emailEl.value.trim()))) {
      showError("email", "Please enter a valid email.");
      ok = false;
    }

    if (zipEl) {
      const z = String(zipEl.value || "").trim();
      if (!/^\d{5}(-\d{4})?$/.test(z)) { showError("zip", "Please enter a valid zip code."); ok = false; }
    }

    if (stateEl) {
      const s = String(stateEl.value || "").trim();
      if (s.length < 2) { showError("state", "Use a 2-letter state code (ex: IN)."); ok = false; }
    }

    // radio groups
    const homeowner = form.querySelector('input[name="homeowner"]:checked');
    const spouse = form.querySelector('input[name="spouse"]:checked');

    if (!homeowner) { showError("homeowner", "Please select an option."); ok = false; }
    if (!spouse) { showError("spouse", "Please select an option."); ok = false; }

    return ok;
  }

  function fakeSubmitSuccess(form, successEl, message) {
    // Replace later with real POST to backend.
    successEl.textContent = message;
    form.reset();
    setTimeout(() => { successEl.textContent = ""; }, 8000);
  }

  const heroLeadForm = document.getElementById("heroLeadForm");
  const heroSuccess = document.getElementById("heroFormSuccess");

  if (heroLeadForm && heroSuccess) {
    heroLeadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateHeroForm(heroLeadForm)) return;
      fakeSubmitSuccess(
        heroLeadForm,
        heroSuccess,
        "Thanks — your request was received. We’ll contact you shortly to schedule your free inspection."
      );
    });
  }

  const estimateForm = document.getElementById("estimateForm");
  const estimateSuccess = document.getElementById("estimateFormSuccess");

  if (estimateForm && estimateSuccess) {
    estimateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateEstimateForm(estimateForm)) return;
      fakeSubmitSuccess(
        estimateForm,
        estimateSuccess,
        "Submitted — we’ll reach out soon to confirm details and schedule your free inspection."
      );
    });
  }

  /* -------------------------
     Reviews slider
  ------------------------- */
  const track = document.getElementById("reviewTrack");
  const prevBtn = document.getElementById("prevReview");
  const nextBtn = document.getElementById("nextReview");
  const dotsWrap = document.getElementById("sliderDots");

  if (track && prevBtn && nextBtn && dotsWrap) {
    const slides = Array.from(track.querySelectorAll(".review"));
    const total = slides.length;
    let index = 0;
    let timer = null;

    // build dots
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dotBtn" + (i === 0 ? " is-active" : "");
      b.setAttribute("aria-label", `Go to review ${i + 1}`);
      b.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(b);
      return b;
    });

    function update() {
      track.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }

    function goTo(i, userAction = false) {
      index = (i + total) % total;
      update();
      if (userAction) restartAuto();
    }

    function next(userAction = false) { goTo(index + 1, userAction); }
    function prev(userAction = false) { goTo(index - 1, userAction); }

    prevBtn.addEventListener("click", () => prev(true));
    nextBtn.addEventListener("click", () => next(true));

    // autoplay
    function startAuto() {
      stopAuto();
      timer = setInterval(() => next(false), 6500);
    }
    function stopAuto() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function restartAuto() {
      startAuto();
    }

    // pause on hover/focus
    const viewport = track.closest(".reviewViewport");
    if (viewport) {
      viewport.addEventListener("mouseenter", stopAuto);
      viewport.addEventListener("mouseleave", startAuto);
      viewport.addEventListener("focusin", stopAuto);
      viewport.addEventListener("focusout", startAuto);
    }

    update();
    startAuto();
  }
})();
