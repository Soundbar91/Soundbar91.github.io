(function() {
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  var menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      document.body.classList.toggle('menu-open');
    });
  }

  var profileLink = document.querySelector('.home-snap .profile');
  if (profileLink) {
    profileLink.addEventListener('click', function(event) {
      if (!window.matchMedia('(max-width: 900px)').matches) return;

      var profileUrl = new URL(profileLink.href, window.location.href);
      if (profileUrl.pathname !== window.location.pathname) return;

      event.preventDefault();
      document.body.classList.remove('menu-open');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    });
  }

  var snapScrollLinks = Array.prototype.slice.call(document.querySelectorAll('.home-snap .portfolio-scroll'));
  if (snapScrollLinks.length > 0) {
    var snapScrollContainer = document.querySelector('.home-snap .site-content');
    var revealScrollControlsTimer;
    var snapMediaQuery = window.matchMedia('(min-width: 901px)');

    function hideScrollControls() {
      if (!snapMediaQuery.matches) return;
      document.body.classList.add('scroll-control-hidden');
    }

    function revealScrollControls() {
      window.clearTimeout(revealScrollControlsTimer);
      revealScrollControlsTimer = window.setTimeout(function() {
        document.body.classList.remove('scroll-control-hidden');
      }, 120);
    }

    function hideThenRevealScrollControls() {
      hideScrollControls();
      revealScrollControls();
    }

    snapScrollLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        hideScrollControls();
        window.clearTimeout(revealScrollControlsTimer);
        revealScrollControlsTimer = window.setTimeout(function() {
          document.body.classList.remove('scroll-control-hidden');
        }, 850);
      });
    });

    if (snapScrollContainer) {
      var snapSections = Array.prototype.slice.call(document.querySelectorAll('.home-snap .portfolio-hero, .home-snap .portfolio-section'));
      var activeSection = null;

      function isSnapScrollEnabled() {
        return snapMediaQuery.matches;
      }

      function replaceHash(section) {
        if (!isSnapScrollEnabled()) return;
        if (!section || !section.id || window.location.hash === '#' + section.id) return;
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + section.id);
      }

      function activateSectionNav(section) {
        if (!section || activeSection === section) return;
        activeSection = section;
        replaceHash(section);
        snapSections.forEach(function(item) {
          var nav = item.querySelector('.portfolio-section-nav');
          if (nav) nav.classList.toggle('is-active', item === section);
        });
      }

      function scrollToHashSection(behavior) {
        if (!isSnapScrollEnabled()) return;
        if (!window.location.hash) return;
        var targetId = window.location.hash.slice(1);
        if (!targetId) return;
        var targetSection = document.getElementById(targetId);
        if (!targetSection || snapSections.indexOf(targetSection) === -1) return;

        snapScrollContainer.scrollTo({
          top: targetSection.offsetTop,
          behavior: behavior || 'auto'
        });
        activateSectionNav(targetSection);
      }

      function resetToInitialSection() {
        if (!isSnapScrollEnabled()) return;
        var initialSection = document.getElementById('introduce') || snapSections[0];
        if (!initialSection) return;

        if (window.location.hash !== '#' + initialSection.id) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + initialSection.id);
        }

        snapScrollContainer.scrollTo({
          top: initialSection.offsetTop,
          behavior: 'auto'
        });
        activateSectionNav(initialSection);
      }

      if (snapSections.length > 0) {
        if (isSnapScrollEnabled()) {
          activateSectionNav(snapSections[0]);
          window.requestAnimationFrame(resetToInitialSection);
        }

        if (isSnapScrollEnabled() && 'IntersectionObserver' in window) {
          var sectionObserver = new IntersectionObserver(function(entries) {
            var visibleEntries = entries
              .filter(function(entry) { return entry.isIntersecting; })
              .sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; });

            if (visibleEntries.length > 0) {
              activateSectionNav(visibleEntries[0].target);
            }
          }, {
            root: snapScrollContainer,
            threshold: [0.45, 0.6, 0.75]
          });

          snapSections.forEach(function(section) {
            sectionObserver.observe(section);
          });
        }
      }

      window.addEventListener('hashchange', function() {
        scrollToHashSection('smooth');
      });

      snapMediaQuery.addEventListener('change', function(event) {
        if (event.matches) resetToInitialSection();
      });

      ['wheel', 'touchmove'].forEach(function(eventName) {
        snapScrollContainer.addEventListener(eventName, hideThenRevealScrollControls, { passive: true });
      });

      window.addEventListener('keydown', function(event) {
        var scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
        if (scrollKeys.indexOf(event.key) !== -1) {
          hideThenRevealScrollControls();
        }
      });

      snapScrollContainer.addEventListener('scroll', function() {
        hideThenRevealScrollControls();
      });

      snapScrollContainer.addEventListener('scrollend', revealScrollControls);
    }
  }

  var postList = document.getElementById('post-list');
  if (postList) {
    var items = Array.prototype.slice.call(postList.querySelectorAll('.post-item'));
    var pageSize = parseInt(postList.getAttribute('data-page-size'), 10) || 10;
    var pagination = document.getElementById('post-pagination');
    var categoryLinks = Array.prototype.slice.call(document.querySelectorAll('[data-category-filter]'));
    var allPostsLink = document.querySelector('[data-category-filter=""]');

    function setActiveCategory(category) {
      categoryLinks.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('data-category-filter') === category);
      });
      if (allPostsLink) allPostsLink.classList.toggle('active', !category);
    }

    function filteredItems(category) {
      return items.filter(function(item) {
        var categories = item.getAttribute('data-categories').split(',');
        return !category || categories.indexOf(category) !== -1;
      });
    }

    function pageFromUrl() {
      var page = parseInt(new URLSearchParams(window.location.search).get('page'), 10);
      return page > 0 ? page : 1;
    }

    function categoryFromUrl() {
      return new URLSearchParams(window.location.search).get('category') || '';
    }

    function updateUrl(category, page, shouldReplace) {
      var url = new URL(window.location.href);
      if (category) {
        url.searchParams.set('category', category);
      } else {
        url.searchParams.delete('category');
      }

      if (page > 1) {
        url.searchParams.set('page', page);
      } else {
        url.searchParams.delete('page');
      }

      window.history[shouldReplace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search);
    }

    function paginationPages(currentPage, totalPages) {
      var pages = [];
      for (var page = 1; page <= totalPages; page += 1) {
        var isEdge = page === 1 || page === totalPages;
        var isStartRange = currentPage <= 3 && page <= 4;
        var isEndRange = currentPage >= totalPages - 2 && page >= totalPages - 3;
        var isMiddleRange = Math.abs(page - currentPage) <= 1;

        if (isEdge || isStartRange || isEndRange || isMiddleRange) {
          pages.push(page);
        } else if (pages[pages.length - 1] !== 'ellipsis') {
          pages.push('ellipsis');
        }
      }
      return pages;
    }

    function renderPagination(currentPage, totalPages, totalItems) {
      if (!pagination) return;
      pagination.innerHTML = '';
      pagination.hidden = totalItems === 0;

      if (totalItems === 0) return;

      paginationPages(currentPage, totalPages).forEach(function(page) {
        if (page === 'ellipsis') {
          var ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          pagination.appendChild(ellipsis);
          return;
        }

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'pagination-page';
        button.textContent = page;
        button.setAttribute('data-page', page);
        button.setAttribute('aria-label', page + '페이지');

        if (page === currentPage) {
          button.classList.add('current');
          button.setAttribute('aria-current', 'page');
        }

        pagination.appendChild(button);
      });
    }

    function filterPosts(category, page, shouldReplace) {
      var visibleItems = filteredItems(category);
      var totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
      var currentPage = Math.min(Math.max(page || 1, 1), totalPages);
      var start = (currentPage - 1) * pageSize;
      var end = start + pageSize;

      items.forEach(function(item) {
        item.hidden = true;
      });

      visibleItems.slice(start, end).forEach(function(item) {
        item.hidden = false;
      });

      setActiveCategory(category);
      renderPagination(currentPage, totalPages, visibleItems.length);
      updateUrl(category, currentPage, shouldReplace);
    }

    function scrollToPostList() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    categoryLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        var category = link.getAttribute('data-category-filter');
        if (window.location.pathname === link.pathname) {
          event.preventDefault();
          filterPosts(category, 1, false);
          scrollToPostList();
        }
      });
    });

    if (pagination) {
      pagination.addEventListener('click', function(event) {
        var button = event.target.closest('[data-page]');
        if (!button || button.classList.contains('current')) return;

        filterPosts(categoryFromUrl(), parseInt(button.getAttribute('data-page'), 10), false);
        scrollToPostList();
      });
    }

    window.addEventListener('popstate', function() {
      filterPosts(categoryFromUrl(), pageFromUrl(), true);
    });

    filterPosts(categoryFromUrl(), pageFromUrl(), true);
  }
})();
