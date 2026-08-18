(function() {
  'use strict';

  /* Mobile menu */
  var sidebar = document.getElementById('sidebar');
  var menuBtn = document.getElementById('mobile-menu-btn');
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }
  overlay.addEventListener('click', closeSidebar);

  /* Close sidebar on nav click (mobile) */
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  /* Sidebar collapse toggle (desktop) */
  var sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
  var sidebarExpandBtn = document.getElementById('sidebar-expand-btn');
  var SIDEBAR_KEY = 'dawn-sidebar-collapsed';

  function collapseSidebar() {
    sidebar.classList.add('collapsed');
    document.querySelector('.site-wrapper').classList.add('sidebar-collapsed');
    if (sidebarExpandBtn) sidebarExpandBtn.classList.add('visible');
    localStorage.setItem(SIDEBAR_KEY, 'collapsed');
  }

  function expandSidebar() {
    sidebar.classList.remove('collapsed');
    document.querySelector('.site-wrapper').classList.remove('sidebar-collapsed');
    if (sidebarExpandBtn) sidebarExpandBtn.classList.remove('visible');
    localStorage.setItem(SIDEBAR_KEY, 'expanded');
  }

  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', collapseSidebar);
  }
  if (sidebarExpandBtn) {
    sidebarExpandBtn.addEventListener('click', expandSidebar);
  }

  /* Highlight active nav based on current path */
  var currentPath = window.location.pathname;
  var navLinks = sidebar.querySelectorAll('.sidebar-nav-item');
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    } else if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    }
  });

  /* TOC scroll spy */
  var headings = document.querySelectorAll('.post-content h1[id], .post-content h2[id], .post-content h3[id]');
  if (headings.length && window.IntersectionObserver) {
    var tocLinks = document.querySelectorAll('.sidebar-toc-content a');
    if (tocLinks.length) {
      var tocAllExpanded = false;

      function expandTocForLink(activeLink) {
        // If expand-all mode is on, don't interfere
        if (tocAllExpanded) return;

        // Collapse all previously expanded sub-lists (only .toc-child .toc-child,
        // i.e. nested children, since top-level .toc-child is always visible)
        var allExpanded = document.querySelectorAll('.sidebar-toc-content .toc-child .toc-child.toc-expanded');
        for (var i = 0; i < allExpanded.length; i++) {
          allExpanded[i].classList.remove('toc-expanded');
        }

        // Walk up from the active link, expanding ancestor .toc-child elements
        var currentLi = activeLink.closest('li');
        while (currentLi) {
          var parentOl = currentLi.parentElement;
          if (parentOl && parentOl.classList.contains('toc-child')) {
            parentOl.classList.add('toc-expanded');
          }
          // Move up to the parent li, if any
          if (parentOl && parentOl.parentElement && parentOl.parentElement.tagName === 'LI') {
            currentLi = parentOl.parentElement;
          } else {
            break;
          }
        }
      }

      var scrollSpyTimer = null;
      var observer = new IntersectionObserver(function(entries) {
        var headingInView = null;
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            // Pick the first heading that just entered view (closest to top)
            if (!headingInView || entry.target.offsetTop < headingInView.offsetTop) {
              headingInView = entry.target;
            }
          }
        });
        if (headingInView) {
          // Debounce: delay before updating to avoid flicker during fast scroll
          if (scrollSpyTimer) clearTimeout(scrollSpyTimer);
          scrollSpyTimer = setTimeout(function() {
            tocLinks.forEach(function(link) {
              link.classList.remove('active-toc');
            });
            var targetId = headingInView.id;
            var active = null;
            tocLinks.forEach(function(link) {
              var href = link.getAttribute('href');
              if (href === '#' + targetId || decodeURIComponent(href) === '#' + targetId) {
                active = link;
              }
            });
            if (active) {
              active.classList.add('active-toc');
              expandTocForLink(active);
            }
          }, 150);
        }
      }, { rootMargin: '-80px 0px -70% 0px' });
      headings.forEach(function(h) { observer.observe(h); });
    }
  }

  /* TOC expand-all toggle */
  var tocExpandBtn = document.getElementById('toc-expand-all-btn');
  if (tocExpandBtn) {
    tocExpandBtn.addEventListener('click', function() {
      tocAllExpanded = !tocAllExpanded;
      var allChildren = document.querySelectorAll('.sidebar-toc-content .toc-child .toc-child');
      for (var i = 0; i < allChildren.length; i++) {
        if (tocAllExpanded) {
          allChildren[i].classList.add('toc-expanded');
        } else {
          allChildren[i].classList.remove('toc-expanded');
        }
      }
      if (tocAllExpanded) {
        tocExpandBtn.classList.add('expanded');
        tocExpandBtn.setAttribute('title', '折叠全部目录');
        tocExpandBtn.setAttribute('aria-label', '折叠全部目录');
      } else {
        tocExpandBtn.classList.remove('expanded');
        tocExpandBtn.setAttribute('title', '展开全部目录');
        tocExpandBtn.setAttribute('aria-label', '展开全部目录');
      }
    });
  }

  /* Back to top button */
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    var scrollThreshold = 400;
    var ticking = false;
    var progressRing = document.getElementById('progress-ring-fill');
    var circumference = 0;

    if (progressRing) {
      var radius = 23;
      circumference = 2 * Math.PI * radius;
      progressRing.style.strokeDasharray = circumference;
      progressRing.style.strokeDashoffset = circumference;
    }

    function updateBackToTop() {
      var scrollY = window.scrollY;

      if (scrollY > scrollThreshold) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }

      if (progressRing) {
        var article = document.querySelector('.post-content');
        if (article) {
          var articleTop = article.getBoundingClientRect().top + scrollY;
          var articleHeight = article.offsetHeight;
          var viewportHeight = window.innerHeight;
          var scrollable = articleHeight - viewportHeight;
          var progress = 0;
          if (scrollable > 0) {
            progress = Math.max(0, Math.min(1, (scrollY - articleTop) / scrollable));
          }
          progressRing.style.strokeDashoffset = circumference - progress * circumference;
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateBackToTop);
        ticking = true;
      }
    }, { passive: true });

    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    updateBackToTop();
  }

  /* Code block wrapper + header + copy */
  var COPY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var X_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  document.querySelectorAll('.post-content pre').forEach(function(pre) {
    // Skip if already wrapped
    if (pre.parentElement.classList.contains('code-block-wrapper')) return;

    // Detect language from code element class (hljs language-xxx or lang-xxx)
    var code = pre.querySelector('code');
    var lang = '';
    if (code) {
      var cls = code.className || '';
      var match = cls.match(/(?:lang|language)-(\S+)/);
      if (match) lang = match[1];
      // If no match, try highlight.js format (hljs python)
      if (!lang) {
        var hljsMatch = cls.match(/\bhljs\s+(\S+)/);
        if (hljsMatch) lang = hljsMatch[1];
      }
      // If no match, try data-language attribute
      if (!lang) lang = code.getAttribute('data-language') || '';
    }

    // Map common abbreviations to readable names
    var langMap = {
      js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
      py: 'Python', rb: 'Ruby', rs: 'Rust', go: 'Go',
      sh: 'Shell', bash: 'Bash', zsh: 'Zsh',
      yml: 'YAML', yaml: 'YAML', json: 'JSON',
      md: 'Markdown', html: 'HTML', css: 'CSS', scss: 'SCSS',
      sql: 'SQL', graphql: 'GraphQL',
      cpp: 'C++', cc: 'C++', cxx: 'C++',
      cs: 'C#', fs: 'F#',
      kt: 'Kotlin', swift: 'Swift',
      dockerfile: 'Docker', docker: 'Docker',
      tex: 'LaTeX', latex: 'LaTeX',
      makefile: 'Makefile', cmake: 'CMake',
      plaintext: 'Text', txt: 'Text', text: 'Text', plain: 'Text',
      diff: 'Diff', patch: 'Patch'
    };
    var displayLang = langMap[lang.toLowerCase()] || lang;

    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    // Create header
    var header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML =
      '<span class="code-dots">' +
        '<span class="code-dot code-dot-red"></span>' +
        '<span class="code-dot code-dot-yellow"></span>' +
        '<span class="code-dot code-dot-green"></span>' +
      '</span>' +
      '<span class="code-lang">' + (displayLang || 'code') + '</span>';

    // Create copy button
    var btn = document.createElement('button');
    btn.className = 'code-header-copy';
    btn.innerHTML = COPY_ICON + ' <span>复制</span>';
    btn.title = '复制代码';
    btn.addEventListener('click', function() {
      var text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text).then(function() {
        btn.innerHTML = CHECK_ICON + ' <span>已复制</span>';
        setTimeout(function() { btn.innerHTML = COPY_ICON + ' <span>复制</span>'; }, 1500);
      }).catch(function() {
        btn.innerHTML = X_ICON + ' <span>失败</span>';
        setTimeout(function() { btn.innerHTML = COPY_ICON + ' <span>复制</span>'; }, 1500);
      });
    });
    header.appendChild(btn);

    // Wrap pre
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });

  /* Sync highlight.js theme with dark mode toggle */
  var hlLight = document.querySelector('link[media*="prefers-color-scheme: light"]');
  var hlDark = document.querySelector('link[media*="prefers-color-scheme: dark"]');
  function updateHlTheme() {
    if (!hlLight || !hlDark) return;
    var isDark = document.documentElement.classList.contains('dark');
    hlLight.media = isDark ? 'not all' : 'all';
    hlDark.media = isDark ? 'all' : 'not all';
  }

  // Watch for theme changes from dark mode toggle
  var darkObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mu) {
      if (mu.attributeName === 'class') updateHlTheme();
    });
  });
  darkObserver.observe(document.documentElement, { attributes: true });
  updateHlTheme();

  /* Image lazy loading */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('.post-content img').forEach(function(img) {
      img.loading = 'lazy';
    });
  }

  /* External links open in new tab */
  document.querySelectorAll('.post-content a[href^="http"]').forEach(function(a) {
    if (!a.href.includes(window.location.hostname)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* Heading collapse/expand */
  var CHEVRON_SVG = '<svg class="heading-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var postContent = document.querySelector('.post-content');

  function setupCollapsibleHeadings() {
    if (!postContent) return;
    var headings = postContent.querySelectorAll('h1, h2, h3');
    if (!headings.length) return;

    // Process in reverse: child headings wrap first, then parents collect
    // everything (including already-wrapped children).
    for (var i = headings.length - 1; i >= 0; i--) {
      (function() {
        var heading = headings[i];
        heading.insertAdjacentHTML('afterbegin', CHEVRON_SVG);

        // h1: collect until next h1 (includes child h2/h3)
        // h2: collect until next h2 or h1 (includes child h3s)
        // h3: collect until next h3, h2, or h1
        var stopTags;
        if (heading.tagName === 'H1') {
          stopTags = ['H1'];
        } else if (heading.tagName === 'H2') {
          stopTags = ['H2', 'H1'];
        } else {
          stopTags = ['H3', 'H2', 'H1'];
        }

        var siblings = [];
        var next = heading.nextElementSibling;
        while (next) {
          if (stopTags.indexOf(next.tagName) !== -1) break;
          siblings.push(next);
          next = next.nextElementSibling;
        }

        if (siblings.length) {
          var wrapper = document.createElement('div');
          wrapper.className = 'collapse-section' + (heading.tagName === 'H3' ? ' collapsed' : '');
          siblings.forEach(function(el) { wrapper.appendChild(el); });
          heading.insertAdjacentElement('afterend', wrapper);
          if (heading.tagName === 'H3') heading.classList.add('collapsed');
        }

        heading.addEventListener('click', function() {
          heading.classList.toggle('collapsed');
          var section = heading.nextElementSibling;
          if (section && section.classList.contains('collapse-section')) {
            section.classList.toggle('collapsed');
          }
        });
      })();
    }
  }

  setupCollapsibleHeadings();

  /* Auto-hide header: hide on scroll down, show on mouse near top (skip home page) */
  var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader && !isHome) {
    var lastScrollY = window.scrollY;
    var headerHidden = false;
    var headerThreshold = 300;

    function hideHeader() {
      if (!headerHidden) {
        siteHeader.classList.add('header-hidden');
        headerHidden = true;
      }
    }

    function showHeader() {
      if (headerHidden) {
        siteHeader.classList.remove('header-hidden');
        headerHidden = false;
      }
    }

    window.addEventListener('scroll', function() {
      var currentScrollY = window.scrollY;
      if (currentScrollY > headerThreshold && currentScrollY > lastScrollY) {
        hideHeader();
      }
      lastScrollY = currentScrollY;
    }, { passive: true });

    document.addEventListener('mousemove', function(e) {
      if (e.clientY < 80) {
        showHeader();
      }
    });
  }

  /* Search overlay */
  var searchToggleBtn = document.getElementById('search-toggle-btn');
  var searchOverlay = document.getElementById('search-overlay');
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchCloseBtn = document.getElementById('search-close-btn');
  var searchData = null;

  if (searchToggleBtn && searchOverlay && searchInput && searchResults) {
    // Load search index
    fetch('/search.json')
      .then(function(res) { return res.json(); })
      .then(function(data) { searchData = data; })
      .catch(function() {});

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function highlightMatch(text, query) {
      var escaped = escapeHtml(text);
      if (!query) return escaped;
      var words = query.trim().split(/\s+/);
      words.forEach(function(word) {
        var re = new RegExp('(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        escaped = escaped.replace(re, '<mark class="search-mark">$1</mark>');
      });
      return escaped;
    }

    function performSearch(query) {
      searchResults.innerHTML = '';
      if (!query || !searchData) {
        searchResults.classList.remove('active');
        return;
      }

      var results = [];
      var lowerQuery = query.toLowerCase();
      searchData.forEach(function(post) {
        var score = 0;
        var title = post.title || '';
        var content = post.text || '';
        if (title.toLowerCase().indexOf(lowerQuery) !== -1) score += 2;
        if (content.toLowerCase().indexOf(lowerQuery) !== -1) score += 1;
        if (score > 0) results.push({ post: post, score: score });
      });

      results.sort(function(a, b) { return b.score - a.score || new Date(b.post.date) - new Date(a.post.date); });

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-empty">未找到相关文章</div>';
      } else {
        results.slice(0, 8).forEach(function(item) {
          var el = document.createElement('a');
          el.className = 'search-result-item';
          el.href = item.post.url;
          el.innerHTML = '<div class="search-result-title">' + highlightMatch(item.post.title, query) + '</div>' +
            '<div class="search-result-date">' + escapeHtml(item.post.date || '') + '</div>';
          searchResults.appendChild(el);
        });
      }
      searchResults.classList.add('active');
    }

    function openSearch() {
      searchOverlay.classList.add('active');
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      searchInput.focus();
    }

    function closeSearch() {
      searchOverlay.classList.remove('active');
      searchResults.classList.remove('active');
    }

    searchToggleBtn.addEventListener('click', openSearch);

    searchCloseBtn.addEventListener('click', closeSearch);

    searchOverlay.addEventListener('click', function(e) {
      if (e.target === searchOverlay) closeSearch();
    });

    searchInput.addEventListener('input', function() {
      performSearch(this.value.trim());
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        closeSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  /* Image lightbox */
  var lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.innerHTML = '<div class="lightbox-backdrop"></div><button class="lightbox-close" aria-label="关闭"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button><img class="lightbox-img" src="" alt="">';
  document.body.appendChild(lightbox);

  var lightboxImg = lightbox.querySelector('.lightbox-img');
  var lightboxVisible = false;

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('visible');
    lightboxVisible = true;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('visible');
    lightboxVisible = false;
    document.body.style.overflow = '';
    setTimeout(function() { lightboxImg.src = ''; }, 300);
  }

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop') || e.target.classList.contains('lightbox-close') || e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightboxVisible) closeLightbox();
  });

  if (postContent) {
    postContent.addEventListener('click', function(e) {
      var img = e.target.closest('img');
      if (!img) return;
      // Don't trigger lightbox if image is inside a link
      if (e.target.closest('a')) return;
      var src = img.getAttribute('src') || img.currentSrc;
      if (src) openLightbox(src, img.alt);
    });
  }

  /* Entrance Animations — only for template-hardcoded elements (not post body) */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {

    function isInViewport(el) {
      var rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight + 50 && rect.bottom > -50;
    }

    function initAnimations() {
      var allEntries = document.querySelectorAll('.animate-entry:not(.animate-in)');
      var aboveFold = [];
      var belowFold = [];

      for (var i = 0; i < allEntries.length; i++) {
        var el = allEntries[i];
        if (el.offsetParent === null && el.tagName !== 'BODY') continue;
        if (isInViewport(el)) {
          aboveFold.push(el);
        } else {
          belowFold.push(el);
        }
      }

      aboveFold.forEach(function(el) {
        el.classList.add('animate-in');
      });

      if (belowFold.length && window.IntersectionObserver) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '0px 0px -50px 0px',
          threshold: 0.05
        });

        belowFold.forEach(function(el) {
          observer.observe(el);
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
      initAnimations();
    }
  }

  /* Immersive reading mode */
  var immersiveToggleBtn = document.getElementById('immersive-toggle-btn');
  if (immersiveToggleBtn) {
    function enterImmersive() {
      document.body.classList.add('immersive-mode');
    }

    function exitImmersive() {
      document.body.classList.remove('immersive-mode');
    }

    function toggleImmersive() {
      if (document.body.classList.contains('immersive-mode')) {
        exitImmersive();
      } else {
        enterImmersive();
      }
    }

    immersiveToggleBtn.addEventListener('click', toggleImmersive);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.body.classList.contains('immersive-mode')) {
        exitImmersive();
      }
    });
  }
})();
