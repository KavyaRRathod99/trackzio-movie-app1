const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Trackzio Movie Backend is running!",
  });
});

// Search movies/shows
app.get("/api/search", async (req, res) => {
  const query = req.query.query;

  // Check empty search
  if (!query || !query.trim()) {
    return res.status(400).json({
      message: "Please enter a search term.",
    });
  }

  try {
    const response = await axios.get(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(
        query.trim()
      )}`,
      {
        timeout: 10000,
      }
    );

    // Make sure API returned an array
    if (!Array.isArray(response.data)) {
      return res.status(502).json({
        message: "Unexpected response from movie service.",
      });
    }

    const results = response.data
      .filter((item) => item && item.show)
      .map((item) => {
        const show = item.show;

        return {
          id: show.id,
          title: show.name || "Unknown Title",
          type: show.type || "Unknown",
          language: show.language || null,
          genres: Array.isArray(show.genres)
            ? show.genres
            : [],
          rating: show.rating?.average ?? null,
          premiered: show.premiered || null,
          image: show.image?.medium || null,
          summary: show.summary || "",
        };
      });

    res.json({
      results: results,
    });
  } catch (error) {
    console.error("TVMaze search error:", error.message);

    // Request took too long
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        message: "Movie service is taking too long to respond.",
      });
    }

    // API/server unavailable
    if (error.response) {
      return res.status(502).json({
        message: "Movie service is temporarily unavailable.",
      });
    }

    // Network error
    return res.status(503).json({
      message: "Unable to connect to movie service.",
    });
  }
});

// Get details of one movie/show
app.get("/api/movies/:id", async (req, res) => {
  const { id } = req.params;

  // Check ID
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      message: "Invalid movie ID.",
    });
  }

  try {
    const response = await axios.get(
      `https://api.tvmaze.com/shows/${id}`,
      {
        timeout: 10000,
      }
    );

    const show = response.data;

    // Check unexpected response
    if (!show || !show.id) {
      return res.status(502).json({
        message: "Unexpected response from movie service.",
      });
    }

    res.json({
      id: show.id,
      title: show.name || "Unknown Title",
      type: show.type || "Unknown",
      language: show.language || null,
      genres: Array.isArray(show.genres)
        ? show.genres
        : [],
      rating: show.rating?.average ?? null,
      premiered: show.premiered || null,
      ended: show.ended || null,
      status: show.status || null,
      runtime: show.runtime || null,
      image:
        show.image?.original ||
        show.image?.medium ||
        null,
      summary: show.summary || "",
      officialSite: show.officialSite || null,
    });
  } catch (error) {
    console.error("TVMaze details error:", error.message);

    // Request took too long
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        message: "Movie service is taking too long to respond.",
      });
    }

    // Movie/show does not exist
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: "Movie not found.",
      });
    }

    // API/server unavailable
    if (error.response) {
      return res.status(502).json({
        message: "Movie service is temporarily unavailable.",
      });
    }

    // Network error
    return res.status(503).json({
      message: "Unable to connect to movie service.",
    });
  }
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});