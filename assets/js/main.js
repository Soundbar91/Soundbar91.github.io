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

  var postList = document.getElementById('post-list');
  if (postList) {
    var items = Array.prototype.slice.call(postList.querySelectorAll('.post-item'));
    var categoryLinks = Array.prototype.slice.call(document.querySelectorAll('[data-category-filter]'));
    var allPostsLink = document.querySelector('.category-link[href$="/posts/"]');

    function setActiveCategory(category) {
      categoryLinks.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('data-category-filter') === category);
      });
      if (allPostsLink) {
        allPostsLink.classList.toggle('active', !category);
      }
    }

    function filterPosts(category) {
      items.forEach(function(item) {
        var categories = item.getAttribute('data-categories').split(',');
        var isVisible = !category || categories.indexOf(category) !== -1;
        item.hidden = !isVisible;
      });
      setActiveCategory(category);
    }

    function categoryFromUrl() {
      return new URLSearchParams(window.location.search).get('category') || '';
    }

    categoryLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        var category = link.getAttribute('data-category-filter');
        if (window.location.pathname === link.pathname) {
          event.preventDefault();
          var nextUrl = category ? '/posts/?category=' + encodeURIComponent(category) : '/posts/';
          window.history.pushState({}, '', nextUrl);
          filterPosts(category);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    window.addEventListener('popstate', function() {
      filterPosts(categoryFromUrl());
    });

    filterPosts(categoryFromUrl());
  }
})();
