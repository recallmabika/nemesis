// mobile nav toggle
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  if(navToggle){
    navToggle.addEventListener('click', function(){
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true':'false');
    });
    siteNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ siteNav.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); });
    });
  }

  // trace path is now animated continuously in the ECG block below

  // generic reveal-on-scroll + ring/dial triggers
  var revealEls = document.querySelectorAll('.reveal');
  var revealIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, {threshold:.15});
  revealEls.forEach(function(el){ revealIO.observe(el); });

  var ringWrap = document.getElementById('ringWrap');
  var ringIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ ringWrap.classList.add('in'); ringIO.disconnect(); } });
  }, {threshold:.4});
  ringIO.observe(ringWrap);

  document.querySelectorAll('.dial').forEach(function(d){
    var dIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ d.classList.add('in'); dIO.disconnect(); } });
    }, {threshold:.6});
    dIO.observe(d);
  });

  // scrub interaction on the signal trace
  (function(){
    var frame = document.getElementById('signalFrame');
    var svg = document.getElementById('signalSvg');
    var scrubLine = document.getElementById('scrubLine');
    var scrubDot = document.getElementById('scrubDot');
    var readout = document.getElementById('scrubReadout');

    // sample points parsed from the path 'd' attribute (x,y pairs)
    var raw = tracePath.getAttribute('d').trim().replace(/M|L/g,'').split(/\s+/).filter(Boolean);
    var pts = raw.map(function(p){ var xy = p.split(','); return {x:parseFloat(xy[0]), y:parseFloat(xy[1])}; });

    function yAt(x){
      for(var i=0;i<pts.length-1;i++){
        if(x>=pts[i].x && x<=pts[i+1].x){
          var t = (x-pts[i].x)/(pts[i+1].x-pts[i].x || 1);
          return pts[i].y + t*(pts[i+1].y-pts[i].y);
        }
      }
      return pts[pts.length-1].y;
    }

    function move(clientX){
      var rect = svg.getBoundingClientRect();
      var relX = (clientX - rect.left) / rect.width;
      var svgX = Math.max(0, Math.min(1100, relX*1100));
      var svgY = yAt(svgX);
      scrubLine.setAttribute('x1', svgX); scrubLine.setAttribute('x2', svgX);
      scrubDot.setAttribute('cx', svgX); scrubDot.setAttribute('cy', svgY);
      var state = svgX < 540 ? 'noise, unmanaged' : (svgX < 600 ? 'stabilizing' : 'steady, held');
      readout.style.left = (relX*100) + '%';
      readout.textContent = 'x=' + Math.round(svgX/11)/1 + '  ·  ' + state;
    }

    frame.addEventListener('mousemove', function(ev){ frame.classList.add('active'); move(ev.clientX); });
    frame.addEventListener('mouseleave', function(){ frame.classList.remove('active'); });
    frame.addEventListener('touchmove', function(ev){
      if(ev.touches[0]){ frame.classList.add('active'); move(ev.touches[0].clientX); }
    }, {passive:true});
    frame.addEventListener('touchend', function(){ frame.classList.remove('active'); });
  })();

  // contact form — no backend wired up in this concept, confirm locally
  var form = document.getElementById('contactForm');
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var btn = form.querySelector('.submit');
    var original = btn.textContent;
    btn.textContent = 'Logged — we\'ll reply by email';
    setTimeout(function(){ btn.textContent = original; }, 2600);
  });

  // keep hero height in sync with actual header height
  (function(){
    var header = document.querySelector('header');
    if(!header) return;
    function setH(){ document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px'); }
    setH();
    window.addEventListener('resize', setH);
  })();

  // hero background slideshow
  (function(){
    var slides = document.querySelectorAll('#heroBg .hero-bg-slide');
    if(!slides.length) return;
    var i = 0;
    setInterval(function(){
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 5000);
  })();

  // wave trace: hospital monitor effect
  (function(){
    var grad = document.getElementById('waveGradient');
    var path = document.getElementById('tracePath');
    var frame = document.getElementById('signalSvg');
    if(!grad || !path || !frame) return;

    // Create a faint background path so the full wave is always visible
    var bgPath = path.cloneNode(true);
    bgPath.removeAttribute('id');
    bgPath.style.stroke = 'var(--line-strong)';
    bgPath.style.strokeDasharray = 'none';
    bgPath.style.animation = 'none';
    path.parentNode.insertBefore(bgPath, path);

    // Disable CSS animation on main path
    path.style.animation = 'none';

    // Create leading dot
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4');
    frame.appendChild(dot);

    var len = path.getTotalLength() || 2200;
    var tailLen = 350; // length of the moving line segment

    path.style.strokeDasharray = tailLen + ' ' + (len * 2);

    var palette = ['#2b5fd9', '#c23b3b', '#f5f5f3', '#10b981', '#0a0a0a'];
    
    function updateGradient() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var steadyColor = isDark ? '#f5f5f3' : '#2b5fd9'; // White in dark, Blue in light
      
      var stopsHTML = '';
      var numRandomStops = 6;
      for (var i = 0; i < numRandomStops; i++) {
        var c = palette[Math.floor(Math.random() * palette.length)];
        var offset = (i / (numRandomStops - 1)) * 50.9;
        stopsHTML += '<stop offset="' + offset + '%" stop-color="' + c + '"/>';
      }
      stopsHTML += '<stop offset="50.9%" stop-color="' + steadyColor + '"/>';
      stopsHTML += '<stop offset="100%" stop-color="' + steadyColor + '"/>';
      
      grad.innerHTML = stopsHTML;
      path.style.stroke = 'url(#waveGradient)';
      return steadyColor;
    }

    var steadyColor = updateGradient();
    
    // Watch for theme changes to update the steady color
    var themeObserver = new MutationObserver(function() {
      steadyColor = updateGradient();
    });
    themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});

    var startTime = null;
    var lastRandomize = 0;

    function drawECG(t) {
      if(!startTime) startTime = t;
      var prog = ((t - startTime) % 8000) / 8000; // 8s loop
      
      var offset = tailLen - (prog * (len + tailLen));
      path.style.strokeDashoffset = offset;
      
      var currentPos = tailLen - offset;
      var dotPos = currentPos;
      if(dotPos < 0) dotPos = 0;
      if(dotPos > len) dotPos = len;
      
      var pt = path.getPointAtLength(dotPos);
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      
      if (pt.x > 560) {
        dot.setAttribute('fill', steadyColor);
        dot.style.filter = 'drop-shadow(0 0 5px ' + steadyColor + ')';
      } else {
        if (t - lastRandomize > 150) {
          var rc = palette[Math.floor(Math.random() * palette.length)];
          dot.setAttribute('fill', rc);
          dot.style.filter = 'drop-shadow(0 0 5px ' + rc + ')';
          lastRandomize = t;
        }
      }
      
      requestAnimationFrame(drawECG);
    }
    
    requestAnimationFrame(drawECG);
  })();

  // shrink header on scroll
  (function(){
    var header = document.querySelector('header');
    if(!header) return;
    function onScroll(){
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    document.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  })();

  // theme toggle — manual override persists; otherwise follows system setting
  (function(){
    var btn = document.getElementById('themeToggle');
    var mq = window.matchMedia('(prefers-color-scheme: dark)');

    function apply(theme){
      document.documentElement.setAttribute('data-theme', theme);
    }
    if(btn){
      btn.addEventListener('click', function(){
        var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        apply(next);
        try{ localStorage.setItem('nemesis-theme', next); }catch(e){}
      });
    }
    mq.addEventListener('change', function(ev){
      var stored = null;
      try{ stored = localStorage.getItem('nemesis-theme'); }catch(e){}
      if(!stored){ apply(ev.matches ? 'dark' : 'light'); }
    });
  })();

  // nav active link on scroll
  (function(){
    var links = document.querySelectorAll('#siteNav a');
    var sections = Array.prototype.map.call(links, function(a){
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);
    if(!sections.length) return;

    function setActive(){
      var pos = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function(sec){ if(sec.offsetTop <= pos) current = sec; });
      
      // If we are at the bottom of the page, force the last section to be active
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
        current = sections[sections.length - 1];
      }
      
      links.forEach(function(a){
        a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
      });
    }
    document.addEventListener('scroll', setActive, {passive:true});
    setActive();
  })();

