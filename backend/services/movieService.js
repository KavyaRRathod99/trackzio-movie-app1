const axios = require("axios");

const TVMAZE_BASE_URL = "https://api.tvmaze.com";

// ==========================================
// SEARCH TV SHOWS
// ==========================================

async function searchMovies(query) {
  if (!query || !query.trim()) {
    return {
      results: [],
      totalResults: 0,
      hasMore: false,
    };
  }

  try {
    const response = await axios.get(
      `${TVMAZE_BASE_URL}/search/shows`,
      {
        params: {
          q: query.trim(),
        },

        timeout: 10000,

        headers: {
          "User-Agent": "Trackzio-Movie-App/1.0",
        },
      }
    );

    const results = response.data || [];

    const movies = results.map((item) => {
      const show = item.show || {};

      return {
        id: show.id,

        title: show.name || "Untitled",

        year: show.premiered
          ? show.premiered.substring(0, 4)
          : "N/A",

        rating:
          show.rating && show.rating.average
            ? Number(show.rating.average)
            : null,

        description:
          show.summary
            ? show.summary.replace(/<[^>]*>/g, "")
            : "No description available.",

        image:
          show.image
            ? show.image.medium || show.image.original
            : null,

        originalImage:
          show.image
            ? show.image.original || show.image.medium
            : null,

        releaseDate: show.premiered || null,

        genres: show.genres || [],

        language: show.language || "Unknown",

        status: show.status || "Unknown",

        runtime: show.runtime || null,

        type: show.type || "Unknown",

        network:
          show.network
            ? show.network.name
            : show.webChannel
              ? show.webChannel.name
              : null,

        country:
          show.network
            ? show.network.country?.name || null
            : show.webChannel
              ? show.webChannel.country?.name || null
              : null,

        officialSite: show.officialSite || null,

        url: show.url || null,
      };
    });

    return {
      results: movies,

      totalResults: movies.length,

      hasMore: false,
    };

  } catch (error) {
    console.error(
      "TVMaze API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
}


// ==========================================
// GET SHOW DETAILS
// ==========================================

async function getMovieDetails(id) {
  try {
    const response = await axios.get(
      `${TVMAZE_BASE_URL}/shows/${id}`,
      {
        timeout: 15000,

        headers: {
          "User-Agent": "Trackzio-Movie-App/1.0",
        },
      }
    );

    const show = response.data;

    return {
      id: show.id,

      title: show.name || "Untitled",

      year: show.premiered
        ? show.premiered.substring(0, 4)
        : "N/A",

      rating:
        show.rating && show.rating.average
          ? Number(show.rating.average)
          : null,

      description:
        show.summary
          ? show.summary.replace(/<[^>]*>/g, "")
          : "No description available.",

      image:
        show.image
          ? show.image.original || show.image.medium
          : null,

      genres: show.genres || [],

      language: show.language || "Unknown",

      status: show.status || "Unknown",

      runtime: show.runtime || null,

      type: show.type || "Unknown",

      premiered: show.premiered || null,

      ended: show.ended || null,

      network:
        show.network
          ? show.network.name
          : show.webChannel
            ? show.webChannel.name
            : null,

      country:
        show.network?.country?.name ||
        show.webChannel?.country?.name ||
        null,

      officialSite: show.officialSite || null,

      url: show.url || null,

      cast: [],

      episodes: [],
    };

  } catch (error) {
    console.error(
      "TVMaze Details Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  searchMovies,
  getMovieDetails,
};