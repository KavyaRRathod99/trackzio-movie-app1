const axios = require("axios");

const TVMAZE_BASE_URL = "https://api.tvmaze.com";

// ==========================================
// SIMPLE IN-MEMORY CACHE
// ==========================================

const searchCache = new Map();
const detailsCache = new Map();
const browseCache = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  const cleanQuery = query.trim().toLowerCase();

  const cachedSearch = searchCache.get(cleanQuery);

  if (
    cachedSearch &&
    Date.now() - cachedSearch.timestamp < CACHE_DURATION
  ) {
    console.log(`Cache hit: search "${cleanQuery}"`);

    return cachedSearch.data;
  }

  try {
    const response = await axios.get(
      `${TVMAZE_BASE_URL}/search/shows`,
      {
        params: {
          q: cleanQuery,
        },

        timeout: 10000,

        headers: {
          "User-Agent": "Trackzio-Movie-App/1.0",
        },
      }
    );

    const results = Array.isArray(response.data)
      ? response.data
      : [];

    const movies = results
      .map((item) => {
        const show = item?.show || {};

        return {
          id: show.id,
          title: show.name || "Untitled",

          year: show.premiered
            ? show.premiered.substring(0, 4)
            : "N/A",

          rating:
            show.rating &&
            show.rating.average !== null
              ? Number(show.rating.average)
              : null,

          description:
            show.summary
              ? show.summary.replace(/<[^>]*>/g, "")
              : "No description available.",

          image:
            show.image
              ? show.image.medium ||
                show.image.original ||
                null
              : null,

          originalImage:
            show.image
              ? show.image.original ||
                show.image.medium ||
                null
              : null,

          releaseDate:
            show.premiered || null,

          genres: Array.isArray(show.genres)
            ? show.genres
            : [],

          language:
            show.language || "Unknown",

          status:
            show.status || "Unknown",

          runtime:
            show.runtime || null,

          type:
            show.type || "Unknown",

          network:
            show.network?.name ||
            show.webChannel?.name ||
            null,

          country:
            show.network?.country?.name ||
            show.webChannel?.country?.name ||
            null,

          officialSite:
            show.officialSite || null,

          url:
            show.url || null,
        };
      })
      .filter((movie) => movie.id);

    const data = {
      results: movies,
      totalResults: movies.length,
      hasMore: false,
    };

    searchCache.set(cleanQuery, {
      timestamp: Date.now(),
      data,
    });

    return data;

  } catch (error) {
    console.error(
      "TVMaze Search Error:",
      error.response?.data ||
        error.message
    );

    throw error;
  }
}

// ==========================================
// BROWSE TV SHOWS
// ==========================================

async function getShowsPage(page = 0) {
  const pageNumber = Number(page);

  if (
    Number.isNaN(pageNumber) ||
    pageNumber < 0
  ) {
    throw new Error("Invalid page number.");
  }

  const cachedBrowse = browseCache.get(pageNumber);

  if (
    cachedBrowse &&
    Date.now() - cachedBrowse.timestamp <
      CACHE_DURATION
  ) {
    console.log(
      `Cache hit: browse page "${pageNumber}"`
    );

    return cachedBrowse.data;
  }

  try {
    const response = await axios.get(
      `${TVMAZE_BASE_URL}/shows`,
      {
        params: {
          page: pageNumber,
        },

        timeout: 10000,

        headers: {
          "User-Agent": "Trackzio-Movie-App/1.0",
        },
      }
    );

    const results = Array.isArray(response.data)
      ? response.data
      : [];

    const movies = results
      .map((show) => {
        return {
          id: show.id,

          title:
            show.name || "Untitled",

          year:
            show.premiered
              ? show.premiered.substring(0, 4)
              : "N/A",

          rating:
            show.rating &&
            show.rating.average !== null
              ? Number(show.rating.average)
              : null,

          description:
            show.summary
              ? show.summary.replace(
                  /<[^>]*>/g,
                  ""
                )
              : "No description available.",

          image:
            show.image
              ? show.image.medium ||
                show.image.original ||
                null
              : null,

          originalImage:
            show.image
              ? show.image.original ||
                show.image.medium ||
                null
              : null,

          releaseDate:
            show.premiered || null,

          genres:
            Array.isArray(show.genres)
              ? show.genres
              : [],

          language:
            show.language || "Unknown",

          status:
            show.status || "Unknown",

          runtime:
            show.runtime || null,

          type:
            show.type || "Unknown",

          network:
            show.network?.name ||
            show.webChannel?.name ||
            null,

          country:
            show.network?.country?.name ||
            show.webChannel?.country?.name ||
            null,

          officialSite:
            show.officialSite || null,

          url:
            show.url || null,
        };
      })
      .filter((movie) => movie.id);

    const data = {
      results: movies,
      page: pageNumber,
      totalResults: movies.length,
      hasMore: movies.length > 0,
    };

    browseCache.set(pageNumber, {
      timestamp: Date.now(),
      data,
    });

    return data;

  } catch (error) {
    console.error(
      "TVMaze Browse Error:",
      error.response?.data ||
        error.message
    );

    throw error;
  }
}

// ==========================================
// GET SHOW DETAILS
// ==========================================

async function getMovieDetails(id) {
  const numericId = Number(id);

  const cachedDetails =
    detailsCache.get(numericId);

  if (
    cachedDetails &&
    Date.now() - cachedDetails.timestamp <
      CACHE_DURATION
  ) {
    console.log(
      `Cache hit: details "${numericId}"`
    );

    return cachedDetails.data;
  }

  try {
    const response = await axios.get(
      `${TVMAZE_BASE_URL}/shows/${numericId}`,
      {
        timeout: 15000,

        headers: {
          "User-Agent": "Trackzio-Movie-App/1.0",
        },
      }
    );

    const show = response.data || {};

    const movie = {
      id: show.id,

      title:
        show.name || "Untitled",

      year:
        show.premiered
          ? show.premiered.substring(0, 4)
          : "N/A",

      rating:
        show.rating &&
        show.rating.average !== null
          ? Number(show.rating.average)
          : null,

      description:
        show.summary
          ? show.summary.replace(
              /<[^>]*>/g,
              ""
            )
          : "No description available.",

      image:
        show.image
          ? show.image.original ||
            show.image.medium ||
            null
          : null,

      genres: Array.isArray(show.genres)
        ? show.genres
        : [],

      language:
        show.language || "Unknown",

      status:
        show.status || "Unknown",

      runtime:
        show.runtime || null,

      type:
        show.type || "Unknown",

      premiered:
        show.premiered || null,

      ended:
        show.ended || null,

      network:
        show.network?.name ||
        show.webChannel?.name ||
        null,

      country:
        show.network?.country?.name ||
        show.webChannel?.country?.name ||
        null,

      officialSite:
        show.officialSite || null,

      url:
        show.url || null,

      cast: [],

      episodes: [],
    };

    detailsCache.set(numericId, {
      timestamp: Date.now(),
      data: movie,
    });

    return movie;

  } catch (error) {
    console.error(
      "TVMaze Details Error:",
      error.response?.status,
      error.response?.data ||
        error.message
    );

    throw error;
  }
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  searchMovies,
  getShowsPage,
  getMovieDetails,
};