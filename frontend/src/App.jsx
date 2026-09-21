import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  // Number of movies shown at one time
  const [visibleCount, setVisibleCount] = useState(6);

  // Keeps track of the latest search request
  const searchRequestId = useRef(0);

  // Load wishlist from browser storage
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("movieWishlist");

    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  const categories = [
    "All",
    "Drama",
    "Comedy",
    "Action",
    "Science-Fiction",
    "Thriller",
  ];

  // Search movies/shows
  const handleSearch = async () => {
    if (!search.trim()) {
      setError("Please enter a movie name.");
      setMovies([]);
      return;
    }

    // Create a new ID for every search
    const currentRequestId = ++searchRequestId.current;

    setLoading(true);
    setError("");
    setSelectedMovie(null);
    setSelectedCategory("All");
    setSortOption("default");
    setVisibleCount(6);

    try {
      const response = await fetch(
        `http://localhost:5000/api/search?query=${encodeURIComponent(
          search
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      // Ignore this response if a newer search has already started
      if (currentRequestId !== searchRequestId.current) {
        return;
      }

      setMovies(data.results || []);

      if (!data.results || data.results.length === 0) {
        setError("No results found.");
      }
    } catch (error) {
      // Ignore errors from older searches
      if (currentRequestId !== searchRequestId.current) {
        return;
      }

      setError("Could not connect to the backend.");
      setMovies([]);
    } finally {
      // Only stop loading for the latest search
      if (currentRequestId === searchRequestId.current) {
        setLoading(false);
      }
    }
  };

  // Get details
  const handleMovieClick = async (id) => {
    setDetailsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/movies/${id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch details");
      }

      const data = await response.json();

      setSelectedMovie(data);
    } catch (error) {
      setError("Could not load movie details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close details
  const closeDetails = () => {
    setSelectedMovie(null);
  };

  // Add/remove wishlist
  const toggleWishlist = (movie) => {
    const alreadySaved = wishlist.some(
      (item) => item.id === movie.id
    );

    let updatedWishlist;

    if (alreadySaved) {
      updatedWishlist = wishlist.filter(
        (item) => item.id !== movie.id
      );
    } else {
      updatedWishlist = [...wishlist, movie];
    }

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "movieWishlist",
      JSON.stringify(updatedWishlist)
    );
  };

  // Filter by category
  const filteredMovies =
    selectedCategory === "All"
      ? movies
      : movies.filter((movie) =>
          movie.genres?.includes(selectedCategory)
        );

  // Sort results
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    if (sortOption === "rating-high") {
      return (b.rating || 0) - (a.rating || 0);
    }

    if (sortOption === "rating-low") {
      return (a.rating || 0) - (b.rating || 0);
    }

    if (sortOption === "title-az") {
      return a.title.localeCompare(b.title);
    }

    if (sortOption === "title-za") {
      return b.title.localeCompare(a.title);
    }

    return 0;
  });

  // Show only some results at first
  const visibleMovies = sortedMovies.slice(0, visibleCount);

  return (
    <div className="app">
      <header className="header">
        <h1>🎬 Movie Discovery</h1>
        <p>Search and discover your favorite movies and shows</p>
      </header>

      <main className="container">
        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for a movie or show..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button onClick={handleSearch}>Search</button>
        </div>

        {/* Wishlist count */}
        <div className="wishlist-count">
          ❤️ Wishlist: {wishlist.length}
        </div>

        {/* Categories and Sorting */}
        {!loading && movies.length > 0 && (
          <div className="controls-section">
            <div className="category-section">
              <h3>Explore by Category</h3>

              <div className="category-buttons">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={
                      selectedCategory === category
                        ? "category-button active"
                        : "category-button"
                    }
                    onClick={() => {
                      setSelectedCategory(category);
                      setVisibleCount(6);
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="sort-section">
              <label htmlFor="sort">
                <strong>Sort by:</strong>
              </label>

              <select
                id="sort"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setVisibleCount(6);
                }}
              >
                <option value="default">Default</option>

                <option value="rating-high">
                  Rating: High to Low
                </option>

                <option value="rating-low">
                  Rating: Low to High
                </option>

                <option value="title-az">
                  Title: A to Z
                </option>

                <option value="title-za">
                  Title: Z to A
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="status">
            <p>Loading movies...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="status">
            <p>{error}</p>
          </div>
        )}

        {/* Results heading */}
        {!loading &&
          !error &&
          sortedMovies.length > 0 && (
            <h2>Search Results</h2>
          )}

        {/* No category results */}
        {!loading &&
          !error &&
          movies.length > 0 &&
          sortedMovies.length === 0 && (
            <div className="status">
              <p>No results found in this category.</p>
            </div>
          )}

        {/* Movie cards */}
        <div className="movie-grid">
          {visibleMovies.map((movie) => {
            const isWishlisted = wishlist.some(
              (item) => item.id === movie.id
            );

            return (
              <div
                className="movie-card"
                key={movie.id}
                onClick={() => handleMovieClick(movie.id)}
              >
                <div className="poster-container">
                  {movie.image ? (
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="poster"
                    />
                  ) : (
                    <div className="no-poster">
                      No Poster
                    </div>
                  )}
                </div>

                <div className="movie-info">
                  <h3>{movie.title}</h3>

                  <p>
                    <strong>Type:</strong>{" "}
                    {movie.type || "Not available"}
                  </p>

                  <p>
                    <strong>Rating:</strong>{" "}
                    {movie.rating !== null
                      ? movie.rating
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Released:</strong>{" "}
                    {movie.premiered || "Not available"}
                  </p>

                  <p>
                    <strong>Genres:</strong>{" "}
                    {movie.genres?.length > 0
                      ? movie.genres.join(", ")
                      : "Not available"}
                  </p>

                  <button
                    className="details-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovieClick(movie.id);
                    }}
                  >
                    View Details
                  </button>

                  <button
                    className={
                      isWishlisted
                        ? "wishlist-button saved"
                        : "wishlist-button"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(movie);
                    }}
                  >
                    {isWishlisted
                      ? "❤️ Added to Wishlist"
                      : "♡ Add to Wishlist"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More button */}
        {!loading &&
          !error &&
          visibleCount < sortedMovies.length && (
            <div className="load-more-container">
              <button
                className="load-more-button"
                onClick={() =>
                  setVisibleCount((current) => current + 6)
                }
              >
                Load More
              </button>
            </div>
          )}

        {/* Details loading */}
        {detailsLoading && (
          <div className="details-overlay">
            <div className="details-box">
              <p>Loading details...</p>
            </div>
          </div>
        )}

        {/* Movie details */}
        {selectedMovie && !detailsLoading && (
          <div className="details-overlay">
            <div className="details-box">
              <button
                className="close-button"
                onClick={closeDetails}
              >
                ✕
              </button>

              <div className="details-content">
                <div className="details-image">
                  {selectedMovie.image ? (
                    <img
                      src={selectedMovie.image}
                      alt={selectedMovie.title}
                    />
                  ) : (
                    <div className="no-poster">
                      No Poster
                    </div>
                  )}
                </div>

                <div className="details-info">
                  <h2>{selectedMovie.title}</h2>

                  <p>
                    <strong>Type:</strong>{" "}
                    {selectedMovie.type || "Not available"}
                  </p>

                  <p>
                    <strong>Language:</strong>{" "}
                    {selectedMovie.language || "Not available"}
                  </p>

                  <p>
                    <strong>Genres:</strong>{" "}
                    {selectedMovie.genres?.length > 0
                      ? selectedMovie.genres.join(", ")
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Rating:</strong>{" "}
                    {selectedMovie.rating !== null
                      ? selectedMovie.rating
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Premiered:</strong>{" "}
                    {selectedMovie.premiered || "Not available"}
                  </p>

                  <p>
                    <strong>Ended:</strong>{" "}
                    {selectedMovie.ended || "Still running"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedMovie.status || "Not available"}
                  </p>

                  <p>
                    <strong>Runtime:</strong>{" "}
                    {selectedMovie.runtime
                      ? `${selectedMovie.runtime} minutes`
                      : "Not available"}
                  </p>

                  <h3>Summary</h3>

                  <div
                    className="summary"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedMovie.summary ||
                        "No summary available.",
                    }}
                  />

                  {selectedMovie.officialSite && (
                    <a
                      href={selectedMovie.officialSite}
                      target="_blank"
                      rel="noreferrer"
                      className="official-button"
                    >
                      Visit Official Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;