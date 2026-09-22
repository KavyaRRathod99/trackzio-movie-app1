const express = require("express");
const cors = require("cors");

const {
  searchMovies,
  getShowsPage,
  getMovieDetails,
} = require("./services/movieService");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Trackzio Movie App Backend is running!",
    api: "TVMaze",
  });
});

// SEARCH MOVIES / SHOWS
app.get("/api/movies", async (req, res) => {
  try {
    const search = req.query.search || "";

    if (!search.trim()) {
      return res.json({
        success: true,
        results: [],
        totalResults: 0,
        hasMore: false,
        message: "Please enter a movie or show name.",
      });
    }

    const movieData = await searchMovies(search);

    res.json({
      success: true,
      ...movieData,
    });
  } catch (error) {
    console.error(
      "TVMaze Search Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Too many requests. Please wait and try again.",
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message:
          "TVMaze is taking too long to respond.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch shows right now. Please try again.",
    });
  }
});

// BROWSE SHOWS
app.get("/api/movies/browse", async (req, res) => {
  try {
    const page = Number(req.query.page || 0);

    if (Number.isNaN(page) || page < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number.",
      });
    }

    const movieData = await getShowsPage(page);

    res.json({
      success: true,
      ...movieData,
    });
  } catch (error) {
    console.error(
      "TVMaze Browse Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Too many requests. Please wait and try again.",
      });
    }

    if (error.response?.status === 404) {
      return res.json({
        success: true,
        results: [],
        page: Number(req.query.page || 0),
        totalResults: 0,
        hasMore: false,
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message:
          "TVMaze is taking too long to respond.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to browse shows right now. Please try again.",
    });
  }
});

// SHOW DETAILS
// IMPORTANT: This route comes AFTER /browse
app.get("/api/movies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    const movie = await getMovieDetails(id);

    res.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error(
      "TVMaze Details Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Show not found.",
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message:
          "TVMaze is taking too long to respond. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch show details right now.",
    });
  }
});

// UNKNOWN ROUTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});