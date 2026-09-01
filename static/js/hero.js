document.addEventListener('DOMContentLoaded', () => {
    // 1. Logo and Title Animation
    const titleEl = document.querySelector('.letter-title');
    let letterEls = [];
    if (titleEl) {
        const word = titleEl.textContent.trim();
        titleEl.textContent = '';
        letterEls = [...word].map((ch) => {
            const span = document.createElement('span');
            span.textContent = ch;
            titleEl.appendChild(span);
            return span;
        });
    }

    // Magnetic buttons
    document.querySelectorAll('.hero-actions a, header a.bg-molten').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    const logo = document.querySelector('.logo-drop');
    const splash = document.querySelector('.gold-splash');
    const taglines = document.querySelectorAll('.fade-tagline');

    if (logo && splash) {
        let landed = false;
        const revealHero = () => {
            if (landed) return;
            landed = true;
            splash.classList.add('is-open');

            setTimeout(() => {
                letterEls.forEach((span, i) => {
                    setTimeout(() => span.classList.add('is-visible'), i * 70);
                });

                // Show taglines after letters finish
                setTimeout(() => {
                    taglines.forEach((el, i) => {
                        setTimeout(() => el.classList.add('is-visible'), i * 150);
                    });
                }, letterEls.length * 70 + 200);

            }, 500);
        };
        logo.addEventListener('animationend', revealHero, { once: true });
        // Safety net: reveal regardless, in case the animation event never fires
        // (interrupted paint, reduced-motion timing quirks, screenshot tools, etc.)
        setTimeout(revealHero, 1400);
    } else if (taglines.length) {
        // No logo element found at all — still reveal taglines so content isn't stuck hidden
        taglines.forEach((el) => el.classList.add('is-visible'));
    }

    // 1b. Hero rotating slides (tagline crossfade + dots + background images)
    const slidesWrap = document.getElementById('heroSlides');
    if (slidesWrap) {
        const slides = [...slidesWrap.querySelectorAll('.hero-slide')];
        const dots = [...document.querySelectorAll('.hero-dot')];
        const bgSlides = [...document.querySelectorAll('.hero-bg-slide')];
        let current = 0;
        let timer = null;
        const AUTOPLAY_MS = 5500;

        const goTo = (index) => {
            if (index === current) return;
            slides[current].classList.remove('is-active');
            dots[current] && dots[current].classList.remove('is-active');
            dots[current] && dots[current].setAttribute('aria-selected', 'false');
            bgSlides[current] && bgSlides[current].classList.remove('is-active');

            current = index;
            slides[current].classList.add('is-active');
            dots[current] && dots[current].classList.add('is-active');
            dots[current] && dots[current].setAttribute('aria-selected', 'true');
            bgSlides[current] && bgSlides[current].classList.add('is-active');
        };

        const next = () => goTo((current + 1) % slides.length);

        const start = () => {
            stop();
            timer = setInterval(next, AUTOPLAY_MS);
        };
        const stop = () => { if (timer) clearInterval(timer); };

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { goTo(i); start(); });
        });

        slidesWrap.addEventListener('mouseenter', stop);
        slidesWrap.addEventListener('mouseleave', start);

        // Wait until the initial hero reveal has finished before autoplaying
        setTimeout(start, 2600);
    }

    // 2. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .process-ring-wrap');
    revealElements.forEach(el => observer.observe(el));

    // 3. Mobile Nav Toggle
    const navToggle = document.getElementById('navToggle');
    const nav = document.querySelector('nav');
    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('hidden');
            nav.classList.toggle('absolute');
            nav.classList.toggle('top-20');
            nav.classList.toggle('left-0');
            nav.classList.toggle('w-full');
            nav.classList.toggle('bg-black');
            nav.classList.toggle('p-6');
            nav.classList.toggle('border-b');
            nav.classList.toggle('border-white/10');
            const ul = nav.querySelector('ul');
            if (ul) {
                ul.classList.toggle('flex-col');
                ul.classList.toggle('items-start');
            }
        });
    }

    document.querySelectorAll('#products .group').forEach((card, i) => {
        card.classList.add('reveal');
        card.style.transitionDelay = `${i * 90}ms`;
    });

    // 3D tilt on product cards
    document.querySelectorAll('#products .group').forEach((card) => {
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateZ(6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
});