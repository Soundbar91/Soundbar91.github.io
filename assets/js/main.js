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

  var snapScrollLinks = Array.prototype.slice.call(document.querySelectorAll('.home-snap .portfolio-scroll'));
  if (snapScrollLinks.length > 0) {
    var snapScrollContainer = document.querySelector('.home-snap .site-content');
    var revealScrollControlsTimer;

    function hideScrollControls() {
      document.body.classList.add('scroll-control-hidden');
    }

    function revealScrollControls() {
      window.clearTimeout(revealScrollControlsTimer);
      revealScrollControlsTimer = window.setTimeout(function() {
        document.body.classList.remove('scroll-control-hidden');
      }, 120);
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
      ['wheel', 'touchmove'].forEach(function(eventName) {
        snapScrollContainer.addEventListener(eventName, hideScrollControls, { passive: true });
      });

      window.addEventListener('keydown', function(event) {
        var scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
        if (scrollKeys.indexOf(event.key) !== -1) {
          hideScrollControls();
        }
      });

      snapScrollContainer.addEventListener('scroll', function() {
        hideScrollControls();
        revealScrollControls();
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
