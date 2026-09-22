import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

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

  // Filters
  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [showWishlist, setShowWishlist] = useState(false);

  // ==========================================
  // LOAD WISHLIST FROM LOCAL STORAGE
  // ==========================================

  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem(
        "trackzio-wishlist"
      );

      if (savedWishlist) {
        return JSON.parse(savedWishlist);
      }

      return [];
    } catch (error) {
      console.error("Wishlist loading error:", error);
      return [];
    }
  });

  // ==========================================
  // SAVE WISHLIST TO LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "trackzio-wishlist",
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error("Wishlist saving error:", error);
    }
  }, [wishlist]);

  // ==========================================
  // SEARCH SHOWS
  // ==========================================

  const fetchMovies = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setMovies([]);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSelectedMovie(null);

      const response = await axios.get(
        `${API_URL}/movies`,
        {
          params: {
            search: searchTerm.trim(),
          },
          timeout: 12000,
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

    } catch (err) {
      console.error(
        "Frontend Search Error:",
        err
      );

      setMovies([]);

      if (err.response?.status === 429) {
        setError(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (
        err.code === "ECONNABORTED"
      ) {
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

    // Reset filters for new search
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
  };

  // ==========================================
  // VIEW DETAILS
  // ==========================================

  const handleViewDetails = async (movie) => {
    try {
      setDetailsLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/movies/${movie.id}`,
        {
          timeout: 15000,
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

      // Scroll to details section
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);

    } catch (err) {
      console.error(
        "Details Error:",
        err
      );

      if (
        err.code === "ECONNABORTED"
      ) {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (
        err.response?.status === 404
      ) {
        setError(
          "Show details were not found."
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
  // ADD TO WISHLIST
  // ==========================================

  const addToWishlist = (movie) => {
    const alreadyAdded = wishlist.some(
      (item) => item.id === movie.id
    );

    if (alreadyAdded) {
      return;
    }

    setWishlist([
      ...wishlist,
      movie,
    ]);
  };

  // ==========================================
  // REMOVE FROM WISHLIST
  // ==========================================

  const removeFromWishlist = (movieId) => {
    setWishlist(
      wishlist.filter(
        (movie) => movie.id !== movieId
      )
    );

    if (
      selectedMovie &&
      selectedMovie.id === movieId
    ) {
      setSelectedMovie(null);
    }
  };

  // ==========================================
  // CHECK WISHLIST
  // ==========================================

  const isInWishlist = (movieId) => {
    return wishlist.some(
      (movie) => movie.id === movieId
    );
  };

  // ==========================================
  // AVAILABLE GENRES
  // ==========================================

  const availableGenres = [
    ...new Set(
      movies.flatMap(
        (movie) =>
          movie.genres || []
      )
    ),
  ].sort();

  // ==========================================
  // AVAILABLE STATUSES
  // ==========================================

  const availableStatuses = [
    ...new Set(
      movies
        .map(
          (movie) =>
            movie.status
        )
        .filter(Boolean)
    ),
  ].sort();

  // ==========================================
  // AVAILABLE LANGUAGES
  // ==========================================

  const availableLanguages = [
    ...new Set(
      movies
        .map(
          (movie) =>
            movie.language
        )
        .filter(Boolean)
    ),
  ].sort();

  // ==========================================
  // APPLY FILTERS
  // ==========================================

  const getFilteredMovies = (
    movieList
  ) => {
    return movieList.filter(
      (movie) => {

        // Genre
        if (
          genreFilter !== "all" &&
          !(movie.genres || []).includes(
            genreFilter
          )
        ) {
          return false;
        }

        // Status
        if (
          statusFilter !== "all" &&
          movie.status !== statusFilter
        ) {
          return false;
        }

        // Language
        if (
          languageFilter !== "all" &&
          movie.language !== languageFilter
        ) {
          return false;
        }

        // Rating
        if (
          ratingFilter !== "all"
        ) {
          const rating =
            Number(movie.rating) || 0;

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
  // SORT MOVIES
  // ==========================================

  const getSortedMovies = (
    movieList
  ) => {
    const sortedMovies = [
      ...movieList,
    ];

    if (sortBy === "rating") {
      sortedMovies.sort(
        (a, b) =>
          (Number(b.rating) || 0) -
          (Number(a.rating) || 0)
      );
    }

    if (sortBy === "release") {
      sortedMovies.sort(
        (a, b) =>
          (Number(b.year) || 0) -
          (Number(a.year) || 0)
      );
    }

    if (sortBy === "title") {
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
  // RESET FILTERS
  // ==========================================

  const clearFilters = () => {
    setGenreFilter("all");
    setStatusFilter("all");
    setLanguageFilter("all");
    setRatingFilter("all");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <header className="navbar">

        <h1>
          🎬 Show Discovery
        </h1>

        <nav>

          <button
            onClick={() => {
              setShowWishlist(false);
              setSelectedMovie(null);
            }}
          >
            Home
          </button>

          <button
            onClick={() => {
              setShowWishlist(true);
              setSelectedMovie(null);
              setError("");
            }}
          >
            ❤️ Wishlist ({wishlist.length})
          </button>

        </nav>

      </header>

      <main>

        {/* ====================================
            HERO / SEARCH
        ==================================== */}

        {!showWishlist && (
          <section className="hero">

            <h2>
              Discover Your Next Show
            </h2>

            <p>
              Search and explore TV shows
              you would love to watch.
            </p>

            <div className="search-box">

              <input
                type="text"
                placeholder="Search for a show..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleSearch();
                  }
                }}
              />

              <button
                onClick={handleSearch}
                disabled={loading}
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </button>

              {search && (
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

          </section>
        )}

        {/* ====================================
            SHOW SECTION
        ==================================== */}

        <section className="movies-section">

          {/* SECTION HEADER */}

          <div className="section-header">

            <h2>
              {showWishlist
                ? "❤️ My Wishlist"
                : search
                ? `Results for "${search}"`
                : "Search Shows"}
            </h2>

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

          {/* ==================================
              FILTERS
          ================================== */}

          {!showWishlist &&
            movies.length > 0 && (

              <div className="filters">

                <select
                  value={genreFilter}
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
                  value={statusFilter}
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
                  value={languageFilter}
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
                  value={ratingFilter}
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
                    ⭐ 8+
                  </option>

                  <option value="7">
                    ⭐ 7+
                  </option>

                  <option value="6">
                    ⭐ 6+
                  </option>

                  <option value="5">
                    ⭐ 5+
                  </option>

                </select>

                <button
                  className="clear-filter-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>

              </div>

            )}

          {/* ==================================
              LOADING
          ================================== */}

          {!showWishlist &&
            loading && (

              <div className="status-message">

                <p>
                  ⏳ Searching for shows...
                </p>

              </div>

            )}

          {/* ==================================
              ERROR
          ================================== */}

          {!showWishlist &&
            !loading &&
            error && (

              <div className="status-message error-message">

                <p>
                  ❌ {error}
                </p>

                <button
                  onClick={() =>
                    fetchMovies(search)
                  }
                >
                  Try Again
                </button>

              </div>

            )}

          {/* ==================================
              INITIAL STATE
          ================================== */}

          {!showWishlist &&
            !loading &&
            !error &&
            !search && (

              <div className="status-message">

                <h3>
                  🔎 Search for a show
                </h3>

                <p>
                  Enter a show name above
                  to discover TV shows.
                </p>

              </div>

            )}

          {/* ==================================
              NO RESULTS
          ================================== */}

          {!showWishlist &&
            !loading &&
            !error &&
            search &&
            movies.length === 0 && (

              <div className="status-message">

                <h3>
                  😕 No shows found
                </h3>

                <p>
                  Try searching with
                  a different name.
                </p>

              </div>

            )}

          {/* ==================================
              NO FILTER RESULTS
          ================================== */}

          {!showWishlist &&
            !loading &&
            !error &&
            search &&
            movies.length > 0 &&
            filteredMovies.length === 0 && (

              <div className="status-message">

                <h3>
                  🔎 No shows match
                  your filters
                </h3>

                <p>
                  Try changing or
                  clearing your filters.
                </p>

                <button
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>

              </div>

            )}

          {/* ==================================
              EMPTY WISHLIST
          ================================== */}

          {showWishlist &&
            wishlist.length === 0 && (

              <div className="status-message">

                <h3>
                  💔 Your wishlist is empty
                </h3>

                <p>
                  Browse shows and add
                  your favourites.
                </p>

                <button
                  onClick={() =>
                    setShowWishlist(false)
                  }
                >
                  Browse Shows
                </button>

              </div>

            )}

          {/* ==================================
              SHOW CARDS
          ================================== */}

          {(showWishlist ||
            (!loading && !error)) &&
            moviesToDisplay.length > 0 && (

              <div className="movie-grid">

                {moviesToDisplay.map(
                  (movie) => (

                    <div
                      className="movie-card"
                      key={movie.id}
                    >

                      {/* POSTER */}

                      {movie.image ? (

                        <img
                          src={movie.image}
                          alt={movie.title}
                          className="movie-poster"
                        />

                      ) : (

                        <div className="poster-placeholder">
                          🎬
                        </div>

                      )}

                      {/* TITLE */}

                      <h3>
                        {movie.title ||
                          "Unknown Title"}
                      </h3>

                      {/* YEAR */}

                      {movie.year && (
                        <p>
                          📅 {movie.year}
                        </p>
                      )}

                      {/* RATING */}

                      <p>
                        ⭐{" "}
                        {movie.rating
                          ? movie.rating
                          : "Not rated"}
                      </p>

                      {/* GENRES */}

                      {movie.genres &&
                        movie.genres.length >
                          0 && (

                          <p>
                            🎭{" "}
                            {movie.genres.join(
                              ", "
                            )}
                          </p>

                        )}

                      {/* STATUS */}

                      {movie.status && (
                        <p>
                          📺 {movie.status}
                        </p>
                      )}

                      {/* ACTIONS */}

                      <div className="movie-actions">

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
                          {detailsLoading
                            ? "Loading..."
                            : "View Details"}
                        </button>

                        {isInWishlist(
                          movie.id
                        ) ? (

                          <button
                            className="remove-button"
                            onClick={() =>
                              removeFromWishlist(
                                movie.id
                              )
                            }
                          >
                            💔 Remove
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
                            ❤️ Add to Wishlist
                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

        </section>

        {/* ====================================
            DETAILS
        ==================================== */}

        {selectedMovie && (

          <section className="movie-details">

            <div className="details-card">

              {/* DETAILS IMAGE */}

              {selectedMovie.image ? (

                <img
                  src={selectedMovie.image}
                  alt={selectedMovie.title}
                  className="details-poster-image"
                />

              ) : (

                <div className="details-poster">
                  🎬
                </div>

              )}

              <div className="details-content">

                <h2>
                  {selectedMovie.title}
                </h2>

                {selectedMovie.year && (
                  <p>
                    <strong>
                      Release Year:
                    </strong>{" "}
                    {selectedMovie.year}
                  </p>
                )}

                <p>
                  <strong>
                    Rating:
                  </strong>{" "}
                  {selectedMovie.rating
                    ? `⭐ ${selectedMovie.rating}`
                    : "Not rated"}
                </p>

                {selectedMovie.genres &&
                  selectedMovie.genres.length >
                    0 && (

                    <p>
                      <strong>
                        Genres:
                      </strong>{" "}
                      {selectedMovie.genres.join(
                        ", "
                      )}
                    </p>

                  )}

                {selectedMovie.language && (
                  <p>
                    <strong>
                      Language:
                    </strong>{" "}
                    {selectedMovie.language}
                  </p>
                )}

                {selectedMovie.status && (
                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {selectedMovie.status}
                  </p>
                )}

                {selectedMovie.runtime && (
                  <p>
                    <strong>
                      Runtime:
                    </strong>{" "}
                    {selectedMovie.runtime} minutes
                  </p>
                )}

                {selectedMovie.network && (
                  <p>
                    <strong>
                      Network:
                    </strong>{" "}
                    {selectedMovie.network}
                  </p>
                )}

                {selectedMovie.description && (
                  <p>
                    <strong>
                      Description:
                    </strong>{" "}
                    {selectedMovie.description}
                  </p>
                )}

                {selectedMovie.officialSite && (
                  <p>
                    <strong>
                      Official Site:
                    </strong>{" "}
                    <a
                      href={
                        selectedMovie.officialSite
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit official site
                    </a>
                  </p>
                )}

                {/* CAST */}

                {selectedMovie.cast &&
                  selectedMovie.cast.length >
                    0 && (

                    <div>

                      <h3>
                        Cast
                      </h3>

                      <div className="cast-list">

                        {selectedMovie.cast.map(
                          (
                            person,
                            index
                          ) => (

                            <p
                              key={index}
                            >
                              <strong>
                                {person.name}
                              </strong>
                              {" as "}
                              {person.character}
                            </p>

                          )
                        )}

                      </div>

                    </div>

                  )}

                {/* CLOSE */}

                <button
                  className="close-button"
                  onClick={() =>
                    setSelectedMovie(null)
                  }
                >
                  Close Details
                </button>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;