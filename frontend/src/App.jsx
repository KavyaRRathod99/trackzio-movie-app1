import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

let searchController = null;

function App() {
  // ==========================================
  // STATE
  // ==========================================

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [sortBy, setSortBy] = useState("default");

  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [showWishlist, setShowWishlist] = useState(false);

  // Browse state
  const [browseShows, setBrowseShows] = useState([]);
  const [browsePage, setBrowsePage] = useState(0);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState("");
  const [browseStarted, setBrowseStarted] = useState(false);
  const [browseHasMore, setBrowseHasMore] = useState(true);

  // ==========================================
  // WISHLIST
  // ==========================================

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("trackzio-wishlist");

      if (saved) {
        return JSON.parse(saved);
      }

      return [];
    } catch (err) {
      console.error("Wishlist loading error:", err);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "trackzio-wishlist",
        JSON.stringify(wishlist)
      );
    } catch (err) {
      console.error("Wishlist saving error:", err);
    }
  }, [wishlist]);

  // ==========================================
  // SEARCH
  // ==========================================

  const fetchMovies = async (searchTerm) => {
    const cleanSearch = searchTerm.trim();

    if (!cleanSearch) {
      setMovies([]);
      setError("");
      return;
    }

    if (searchController) {
      searchController.abort();
    }

    searchController = new AbortController();

    try {
      setLoading(true);
      setError("");
      setSelectedMovie(null);

      const response = await axios.get(
        API_URL + "/movies",
        {
          params: {
            search: cleanSearch
          },
          timeout: 12000,
          signal: searchController.signal
        }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to load shows."
        );
      }

      const results = response.data.results || [];

      setMovies(results);

      if (results.length === 0) {
        setError("");
      }

    } catch (err) {

      if (err.code === "ERR_CANCELED") {
        return;
      }

      console.error("Search error:", err);

      setMovies([]);

      if (err.response?.status === 429) {
        setError(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else {
        setError(
          "Unable to load shows. Please make sure the backend server is running."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH BUTTON
  // ==========================================

  const handleSearch = () => {
    setShowWishlist(false);
    setSelectedMovie(null);

    setSortBy("default");
    setGenreFilter("all");
    setStatusFilter("all");
    setLanguageFilter("all");
    setRatingFilter("all");

    fetchMovies(search);
  };

  // ==========================================
  // CLEAR SEARCH
  // ==========================================

  const handleClearSearch = () => {
    if (searchController) {
      searchController.abort();
      searchController = null;
    }

    setSearch("");
    setMovies([]);
    setError("");
    setSelectedMovie(null);

    setSortBy("default");
    setGenreFilter("all");
    setStatusFilter("all");
    setLanguageFilter("all");
    setRatingFilter("all");

    setShowWishlist(false);
    setLoading(false);
  };

  // ==========================================
  // BROWSE SHOWS
  // ==========================================

  const fetchBrowseShows = async (
    page = 0,
    append = false
  ) => {
    try {
      setBrowseLoading(true);
      setBrowseError("");
      setSelectedMovie(null);

      const response = await axios.get(
        API_URL + "/movies/browse",
        {
          params: {
            page: page
          },
          timeout: 12000
        }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to browse shows."
        );
      }

      const results =
        response.data.results || [];

      if (append) {
        setBrowseShows((currentShows) => [
          ...currentShows,
          ...results
        ]);
      } else {
        setBrowseShows(results);
      }

      setBrowsePage(page);
      setBrowseHasMore(
        response.data.hasMore === true
      );
      setBrowseStarted(true);

    } catch (err) {
      console.error(
        "Browse shows error:",
        err
      );

      if (err.response?.status === 429) {
        setBrowseError(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (
        err.code === "ECONNABORTED"
      ) {
        setBrowseError(
          "The server is taking too long to respond. Please try again."
        );
      } else {
        setBrowseError(
          "Unable to browse shows right now. Please try again."
        );
      }

    } finally {
      setBrowseLoading(false);
    }
  };

  const handleBrowseShows = () => {
    setShowWishlist(false);
    setSelectedMovie(null);
    setSearch("");
    setMovies([]);
    setError("");

    setSortBy("default");
    setGenreFilter("all");
    setStatusFilter("all");
    setLanguageFilter("all");
    setRatingFilter("all");

    setBrowseShows([]);
    setBrowsePage(0);
    setBrowseHasMore(true);

    fetchBrowseShows(0, false);
  };

  const handleLoadMore = () => {
    if (
      browseLoading ||
      !browseHasMore
    ) {
      return;
    }

    fetchBrowseShows(
      browsePage + 1,
      true
    );
  };

  // ==========================================
  // VIEW DETAILS
  // ==========================================

  const handleViewDetails = async (movie) => {
    try {
      setDetailsLoading(true);
      setError("");

      const response = await axios.get(
        API_URL + "/movies/" + movie.id,
        {
          timeout: 15000
        }
      );

      if (
        response.data.success === false ||
        !response.data.movie
      ) {
        throw new Error(
          response.data.message ||
            "Unable to load show details."
        );
      }

      setSelectedMovie(
        response.data.movie
      );

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
      }, 100);

    } catch (err) {
      console.error(
        "Details error:",
        err
      );

      if (err.response?.status === 404) {
        setError(
          "Show details were not found."
        );
      } else if (
        err.code === "ECONNABORTED"
      ) {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else {
        setError(
          "Unable to load show details. Please try again."
        );
      }

    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // WISHLIST FUNCTIONS
  // ==========================================

  const addToWishlist = (movie) => {
    setWishlist((currentWishlist) => {
      const alreadyAdded =
        currentWishlist.some(
          (item) => item.id === movie.id
        );

      if (alreadyAdded) {
        return currentWishlist;
      }

      return [
        ...currentWishlist,
        movie
      ];
    });
  };

  const removeFromWishlist = (movieId) => {
    setWishlist((currentWishlist) =>
      currentWishlist.filter(
        (movie) =>
          movie.id !== movieId
      )
    );

    if (
      selectedMovie &&
      selectedMovie.id === movieId
    ) {
      setSelectedMovie(null);
    }
  };

  const isInWishlist = (movieId) => {
    return wishlist.some(
      (movie) =>
        movie.id === movieId
    );
  };

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const availableGenres = [
    ...new Set(
      movies.flatMap(
        (movie) =>
          movie.genres || []
      )
    )
  ].sort();

  const availableStatuses = [
    ...new Set(
      movies
        .map(
          (movie) =>
            movie.status
        )
        .filter(Boolean)
    )
  ].sort();

  const availableLanguages = [
    ...new Set(
      movies
        .map(
          (movie) =>
            movie.language
        )
        .filter(Boolean)
    )
  ].sort();

  // ==========================================
  // FILTER
  // ==========================================

  const getFilteredMovies = (
    movieList
  ) => {
    return movieList.filter(
      (movie) => {

        if (
          genreFilter !== "all" &&
          !(movie.genres || []).includes(
            genreFilter
          )
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          movie.status !==
            statusFilter
        ) {
          return false;
        }

        if (
          languageFilter !== "all" &&
          movie.language !==
            languageFilter
        ) {
          return false;
        }

        if (
          ratingFilter !== "all"
        ) {
          const rating =
            Number(movie.rating) ||
            0;

          if (
            rating <
            Number(ratingFilter)
          ) {
            return false;
          }
        }

        return true;
      }
    );
  };

  // ==========================================
  // SORT
  // ==========================================

  const getSortedMovies = (
    movieList
  ) => {
    const sortedMovies = [
      ...movieList
    ];

    if (
      sortBy === "rating"
    ) {
      sortedMovies.sort(
        (a, b) =>
          (Number(b.rating) ||
            0) -
          (Number(a.rating) ||
            0)
      );
    }

    if (
      sortBy === "release"
    ) {
      sortedMovies.sort(
        (a, b) =>
          (Number(b.year) ||
            0) -
          (Number(a.year) ||
            0)
      );
    }

    if (
      sortBy === "title"
    ) {
      sortedMovies.sort(
        (a, b) =>
          (a.title || "").localeCompare(
            b.title || ""
          )
      );
    }

    return sortedMovies;
  };

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredMovies =
    getFilteredMovies(movies);

  const moviesToDisplay =
    showWishlist
      ? wishlist
      : getSortedMovies(
          filteredMovies
        );

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setGenreFilter("all");
    setStatusFilter("all");
    setLanguageFilter("all");
    setRatingFilter("all");
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goHome = () => {
    setShowWishlist(false);
    setSelectedMovie(null);
    setError("");
  };

  const openWishlist = () => {
    setShowWishlist(true);
    setSelectedMovie(null);
    setError("");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">

        <div className="navbar-inner">

          <button
            className="brand-button"
            onClick={goHome}
          >
            <span className="brand-icon">
              🎬
            </span>

            <span>
              Show Discovery
            </span>
          </button>

          <nav className="nav-buttons">

            <button
              className={
                !showWishlist
                  ? "active"
                  : ""
              }
              onClick={goHome}
            >
              Home
            </button>

            <button
              className={
                showWishlist
                  ? "active"
                  : ""
              }
              onClick={
                openWishlist
              }
            >
              Wishlist (
              {wishlist.length})
            </button>

          </nav>

        </div>

      </header>

      <main>

        {/* HERO / SEARCH */}

        {!showWishlist && (
          <section className="hero">

            <div className="hero-content">

              <p className="hero-label">
                TV SHOW DISCOVERY
              </p>

              <h2>
                Discover Your Next Show
              </h2>

              <p className="hero-description">
                Search, filter and
                explore TV shows
                you would love to
                watch.
              </p>

              <div className="search-box">

                <input
                  type="text"
                  placeholder="Search for a show..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                />

                <button
                  onClick={
                    handleSearch
                  }
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Searching..."
                    : "Search"}
                </button>

                {search &&
                  !loading && (
                    <button
                      className="clear-button"
                      onClick={
                        handleClearSearch
                      }
                    >
                      Clear
                    </button>
                  )}

              </div>

              {/* BROWSE BUTTON */}

              <button
                className="browse-button"
                onClick={
                  handleBrowseShows
                }
                disabled={
                  browseLoading
                }
              >
                {browseLoading &&
                !browseStarted
                  ? "Loading Shows..."
                  : "Browse Shows"}
              </button>

            </div>

          </section>
        )}

        {/* SHOW SECTION */}

        <section className="movies-section">

          <div className="section-header">

            <div>

              <h2>
                {showWishlist
                  ? "My Wishlist"
                  : browseStarted &&
                    !search
                  ? "Explore Shows"
                  : search
                  ? `Results for "${search}"`
                  : "Search Shows"}
              </h2>

              {!showWishlist &&
                movies.length > 0 && (
                  <p className="result-count">
                    {filteredMovies.length}{" "}
                    of{" "}
                    {movies.length}{" "}
                    shows
                  </p>
                )}

              {browseStarted &&
                !showWishlist &&
                !search &&
                browseShows.length >
                  0 && (
                  <p className="result-count">
                    Showing{" "}
                    {browseShows.length}{" "}
                    shows
                  </p>
                )}

              {showWishlist && (
                <p className="result-count">
                  {wishlist.length} saved
                  show
                  {wishlist.length !==
                  1
                    ? "s"
                    : ""}
                </p>
              )}

            </div>

            {!showWishlist &&
              movies.length > 0 && (

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                >

                  <option value="default">
                    Sort By
                  </option>

                  <option value="rating">
                    Highest Rating
                  </option>

                  <option value="release">
                    Newest Release
                  </option>

                  <option value="title">
                    Title A-Z
                  </option>

                </select>

              )}

          </div>

          {/* FILTERS */}

          {!showWishlist &&
            movies.length > 0 && (

              <div className="filters">

                <select
                  value={
                    genreFilter
                  }
                  onChange={(e) =>
                    setGenreFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Genres
                  </option>

                  {availableGenres.map(
                    (genre) => (
                      <option
                        key={genre}
                        value={genre}
                      >
                        {genre}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Status
                  </option>

                  {availableStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    languageFilter
                  }
                  onChange={(e) =>
                    setLanguageFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Languages
                  </option>

                  {availableLanguages.map(
                    (language) => (
                      <option
                        key={language}
                        value={language}
                      >
                        {language}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    ratingFilter
                  }
                  onChange={(e) =>
                    setRatingFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    Any Rating
                  </option>

                  <option value="8">
                    8+ Rating
                  </option>

                  <option value="7">
                    7+ Rating
                  </option>

                  <option value="6">
                    6+ Rating
                  </option>

                </select>

                <button
                  className="filter-clear-button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>

              </div>

            )}

          {/* ERROR */}

          {!loading &&
            error && (

              <div className="status-message error-message">

                <div className="status-icon">
                  !
                </div>

                <h3>
                  Something went wrong
                </h3>

                <p>
                  {error}
                </p>

                <button
                  onClick={() =>
                    fetchMovies(
                      search
                    )
                  }
                >
                  Try Again
                </button>

              </div>

            )}

          {/* BROWSE ERROR */}

          {!browseLoading &&
            browseError &&
            !search &&
            !showWishlist && (

              <div className="status-message error-message">

                <div className="status-icon">
                  !
                </div>

                <h3>
                  Browse failed
                </h3>

                <p>
                  {browseError}
                </p>

                <button
                  onClick={
                    handleBrowseShows
                  }
                >
                  Try Again
                </button>

              </div>

            )}

          {/* LOADING */}

          {loading && (

            <div className="status-message">

              <div className="loading-spinner"></div>

              <h3>
                Searching for shows...
              </h3>

              <p>
                Please wait while we
                find matching shows.
              </p>

            </div>

          )}

          {/* BROWSE LOADING */}

          {browseLoading &&
            !loading &&
            !showWishlist && (

              <div className="status-message">

                <div className="loading-spinner"></div>

                <h3>
                  Exploring shows...
                </h3>

                <p>
                  Loading more shows
                  for you.
                </p>

              </div>

            )}

          {/* NO SEARCH */}

          {!showWishlist &&
            !loading &&
            !browseLoading &&
            !error &&
            !browseError &&
            !search &&
            !browseStarted && (

              <div className="status-message">

                <div className="status-icon">
                  🔎
                </div>

                <h3>
                  Start discovering
                </h3>

                <p>
                  Search for a show or
                  browse our collection
                  to explore more.
                </p>

              </div>

            )}

          {/* NO RESULTS */}

          {!showWishlist &&
            !loading &&
            !browseLoading &&
            !error &&
            search &&
            movies.length === 0 && (

              <div className="status-message">

                <div className="status-icon">
                  🔎
                </div>

                <h3>
                  No shows found
                </h3>

                <p>
                  We couldn't find a
                  show matching "{search}".
                  Try another search.
                </p>

              </div>

            )}

          {/* NO FILTER RESULTS */}

          {!showWishlist &&
            !loading &&
            !error &&
            movies.length > 0 &&
            filteredMovies.length ===
              0 && (

              <div className="status-message">

                <div className="status-icon">
                  🔎
                </div>

                <h3>
                  No matching shows
                </h3>

                <p>
                  Try changing or
                  clearing your filters.
                </p>

                <button
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>

              </div>

            )}

          {/* EMPTY WISHLIST */}

          {showWishlist &&
            wishlist.length ===
              0 && (

              <div className="status-message">

                <div className="status-icon">
                  ♡
                </div>

                <h3>
                  Your wishlist is
                  empty
                </h3>

                <p>
                  Search for shows and
                  add your favorites to
                  your wishlist.
                </p>

                <button
                  onClick={goHome}
                >
                  Discover Shows
                </button>

              </div>

            )}

          {/* SEARCH SHOW GRID */}

          {moviesToDisplay.length >
            0 && (

            <div className="movies-grid">

              {moviesToDisplay.map(
                (movie) => (

                  <article
                    className="movie-card"
                    key={movie.id}
                  >

                    {/* POSTER */}

                    <div className="poster-container">

                      {movie.image ? (

                        <img
                          src={
                            movie.image
                          }
                          alt={
                            movie.title +
                            " poster"
                          }
                          loading="lazy"
                        />

                      ) : (

                        <div className="poster-placeholder">

                          <span>
                            🎬
                          </span>

                          <p>
                            No Image
                          </p>

                        </div>

                      )}

                      {movie.rating && (

                        <span className="rating-badge">
                          ★{" "}
                          {movie.rating}
                        </span>

                      )}

                    </div>

                    {/* CARD CONTENT */}

                    <div className="movie-card-content">

                      <h3
                        title={
                          movie.title
                        }
                      >
                        {movie.title}
                      </h3>

                      <div className="movie-meta">

                        {movie.year &&
                          movie.year !==
                            "N/A" && (

                            <span>
                              {movie.year}
                            </span>

                          )}

                        {movie.language && (

                          <span>
                            {
                              movie.language
                            }
                          </span>

                        )}

                      </div>

                      {movie.genres &&
                        movie.genres
                          .length >
                          0 && (

                          <div className="genre-list">

                            {movie.genres
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  genre
                                ) => (

                                  <span
                                    key={
                                      genre
                                    }
                                  >
                                    {
                                      genre
                                    }
                                  </span>

                                )
                              )}

                          </div>

                        )}

                      <p className="movie-description">
                        {movie.description ||
                          "No description available."}
                      </p>

                      <div className="card-actions">

                        <button
                          className="details-button"
                          onClick={() =>
                            handleViewDetails(
                              movie
                            )
                          }
                          disabled={
                            detailsLoading
                          }
                        >
                          {detailsLoading &&
                          selectedMovie?.id ===
                            movie.id
                            ? "Loading..."
                            : "View Details"}
                        </button>

                        {isInWishlist(
                          movie.id
                        ) ? (

                          <button
                            className="wishlist-button saved"
                            onClick={() =>
                              removeFromWishlist(
                                movie.id
                              )
                            }
                          >
                            Saved
                          </button>

                        ) : (

                          <button
                            className="wishlist-button"
                            onClick={() =>
                              addToWishlist(
                                movie
                              )
                            }
                          >
                            + Wishlist
                          </button>

                        )}

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

          {/* BROWSE SHOW GRID */}

          {!showWishlist &&
            !search &&
            browseStarted &&
            browseShows.length >
              0 && (

              <div className="movies-grid">

                {browseShows.map(
                  (movie) => (

                    <article
                      className="movie-card"
                      key={
                        movie.id
                      }
                    >

                      {/* POSTER */}

                      <div className="poster-container">

                        {movie.image ? (

                          <img
                            src={
                              movie.image
                            }
                            alt={
                              movie.title +
                              " poster"
                            }
                            loading="lazy"
                          />

                        ) : (

                          <div className="poster-placeholder">

                            <span>
                              🎬
                            </span>

                            <p>
                              No Image
                            </p>

                          </div>

                        )}

                        {movie.rating && (

                          <span className="rating-badge">
                            ★{" "}
                            {movie.rating}
                          </span>

                        )}

                      </div>

                      {/* CARD CONTENT */}

                      <div className="movie-card-content">

                        <h3
                          title={
                            movie.title
                          }
                        >
                          {movie.title}
                        </h3>

                        <div className="movie-meta">

                          {movie.year &&
                            movie.year !==
                              "N/A" && (

                              <span>
                                {
                                  movie.year
                                }
                              </span>

                            )}

                          {movie.language && (

                            <span>
                              {
                                movie.language
                              }
                            </span>

                          )}

                        </div>

                        {movie.genres &&
                          movie.genres
                            .length >
                            0 && (

                            <div className="genre-list">

                              {movie.genres
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    genre
                                  ) => (

                                    <span
                                      key={
                                        genre
                                      }
                                    >
                                      {
                                        genre
                                      }
                                    </span>

                                  )
                                )}

                            </div>

                          )}

                        <p className="movie-description">
                          {movie.description ||
                            "No description available."}
                        </p>

                        <div className="card-actions">

                          <button
                            className="details-button"
                            onClick={() =>
                              handleViewDetails(
                                movie
                              )
                            }
                            disabled={
                              detailsLoading
                            }
                          >
                            {detailsLoading &&
                            selectedMovie?.id ===
                              movie.id
                              ? "Loading..."
                              : "View Details"}
                          </button>

                          {isInWishlist(
                            movie.id
                          ) ? (

                            <button
                              className="wishlist-button saved"
                              onClick={() =>
                                removeFromWishlist(
                                  movie.id
                                )
                              }
                            >
                              Saved
                            </button>

                          ) : (

                            <button
                              className="wishlist-button"
                              onClick={() =>
                                addToWishlist(
                                  movie
                                )
                              }
                            >
                              + Wishlist
                            </button>

                          )}

                        </div>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          {/* LOAD MORE */}

          {!showWishlist &&
            !search &&
            browseStarted &&
            browseShows.length >
              0 &&
            browseHasMore && (

              <div className="load-more-container">

                <button
                  className="browse-button load-more-button"
                  onClick={
                    handleLoadMore
                  }
                  disabled={
                    browseLoading
                  }
                >
                  {browseLoading
                    ? "Loading More..."
                    : "Load More Shows"}
                </button>

              </div>

            )}

        </section>

        {/* DETAILS */}

        {selectedMovie && (

          <section className="movie-details">

            <div className="details-card">

              <button
                className="close-details"
                onClick={() =>
                  setSelectedMovie(
                    null
                  )
                }
                aria-label="Close details"
              >
                ×
              </button>

              {/* DETAILS POSTER */}

              <div className="details-poster-container">

                {selectedMovie.image ? (

                  <img
                    src={
                      selectedMovie.image
                    }
                    alt={
                      selectedMovie.title +
                      " poster"
                    }
                    className="details-poster-image"
                  />

                ) : (

                  <div className="details-poster-placeholder">
                    🎬
                  </div>

                )}

              </div>

              {/* DETAILS CONTENT */}

              <div className="details-content">

                <p className="details-label">
                  SHOW DETAILS
                </p>

                <h2>
                  {
                    selectedMovie.title
                  }
                </h2>

                <div className="details-rating">

                  <span>
                    Rating
                  </span>

                  <strong>
                    {selectedMovie.rating
                      ? `★ ${selectedMovie.rating}`
                      : "Not rated"}
                  </strong>

                </div>

                <p className="details-description">
                  {selectedMovie.description ||
                    "No description available."}
                </p>

                <div className="details-info">

                  {selectedMovie.year &&
                    selectedMovie.year !==
                      "N/A" && (

                      <div>

                        <span>
                          Release Year
                        </span>

                        <strong>
                          {
                            selectedMovie.year
                          }
                        </strong>

                      </div>

                    )}

                  {selectedMovie.status && (

                    <div>

                      <span>
                        Status
                      </span>

                      <strong>
                        {
                          selectedMovie.status
                        }
                      </strong>

                    </div>

                  )}

                  {selectedMovie.language && (

                    <div>

                      <span>
                        Language
                      </span>

                      <strong>
                        {
                          selectedMovie.language
                        }
                      </strong>

                    </div>

                  )}

                  {selectedMovie.runtime && (

                    <div>

                      <span>
                        Runtime
                      </span>

                      <strong>
                        {
                          selectedMovie.runtime
                        }{" "}
                        min
                      </strong>

                    </div>

                  )}

                  {selectedMovie.type && (

                    <div>

                      <span>
                        Type
                      </span>

                      <strong>
                        {
                          selectedMovie.type
                        }
                      </strong>

                    </div>

                  )}

                  {selectedMovie.network && (

                    <div>

                      <span>
                        Network
                      </span>

                      <strong>
                        {
                          selectedMovie.network
                        }
                      </strong>

                    </div>

                  )}

                </div>

                {/* GENRES */}

                {selectedMovie.genres &&
                  selectedMovie.genres
                    .length >
                    0 && (

                    <div className="details-genres">

                      <h4>
                        Genres
                      </h4>

                      <div>

                        {selectedMovie.genres.map(
                          (
                            genre
                          ) => (

                            <span
                              key={
                                genre
                              }
                            >
                              {genre}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}

                {/* DETAILS ACTIONS */}

                <div className="details-actions">

                  {isInWishlist(
                    selectedMovie.id
                  ) ? (

                    <button
                      className="wishlist-button saved"
                      onClick={() =>
                        removeFromWishlist(
                          selectedMovie.id
                        )
                      }
                    >
                      Remove from Wishlist
                    </button>

                  ) : (

                    <button
                      className="wishlist-button"
                      onClick={() =>
                        addToWishlist(
                          selectedMovie
                        )
                      }
                    >
                      + Add to Wishlist
                    </button>

                  )}

                  {selectedMovie.officialSite && (

                    <a
                      href={
                        selectedMovie.officialSite
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="official-link"
                    >
                      Official Site
                    </a>

                  )}

                </div>

              </div>

            </div>

          </section>

        )}

      </main>

      {/* FOOTER */}

      <footer className="footer">

        <p>
          Show Discovery • Powered by TVMaze
        </p>

      </footer>

    </div>
  );
}

export default App;