(function() {
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  var posts = [];

  fetch('/assets/search.json')
    .then(function(response) { return response.json(); })
    .then(function(data) { posts = data; });

  searchInput.addEventListener('input', function() {
    var query = this.value.toLowerCase().trim();
    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    var results = posts.filter(function(post) {
      return post.title.toLowerCase().indexOf(query) !== -1 ||
             post.content.toLowerCase().indexOf(query) !== -1 ||
             post.tags.some(function(tag) { return tag.toLowerCase().indexOf(query) !== -1; }) ||
             post.categories.some(function(cat) { return cat.toLowerCase().indexOf(query) !== -1; });
    });

    if (results.length === 0) {
      searchResults.innerHTML = '<p style="color: var(--text-muted);">No results found.</p>';
      return;
    }

    var html = results.map(function(post) {
      return '<div class="search-result-item">' +
        '<h3><a href="' + post.url + '">' + post.title + '</a></h3>' +
        '<p>' + post.date + '</p>' +
        '</div>';
    }).join('');

    searchResults.innerHTML = html;
  });
})();
