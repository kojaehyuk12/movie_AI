document.addEventListener("DOMContentLoaded", () => {
  const movieApiKey = " // 여기에 TMDB API 키를 입력하세요.";
  const visionApiKey = ""; // 여기에 Google Cloud Vision API 키를 입력하세요.
  const gptApiKey = ''; // 여기에 OpenAI API 키 (GPT)를 입력하세요.
  const translateApiKey = ""; // 여기에 Google Cloud Translate API 키를 입력하세요.
  const resultContainer = document.getElementById("result-container");
  const posterResultsContainer = document.getElementById(
    "poster-results-container"
  );
  const genreFilter = document.getElementById("genre-filter");
  const filterContainer = document.getElementById("filter-container");
  const searchKeywordsContainer = document.getElementById("search-keywords");
  const loader = document.getElementById("loader");
  let posters = [];
  let genres = [];
  let searchKeywords = new Set(); // 중복을 제거하기 위해 Set 사용

  // 팝업 모달 요소들
  const projectPosterModal = document.getElementById("projectPosterModal");
  const projectTrailerModal = document.getElementById("projectTrailerModal");
  const projectCombinedModal = document.getElementById("projectCombinedModal");
  const projectPopupImage = document.getElementById("project-popup-image");
  const projectCombinedPopupImage = document.getElementById(
    "project-combined-popup-image"
  );
  const projectPopupText = document.getElementById("project-popup-text");
  const projectCombinedPopupText = document.getElementById(
    "project-combined-popup-text"
  );
  const projectTrailerContainer = document.getElementById(
    "project-trailer-container"
  );
  const projectCombinedTrailerContainer = document.getElementById(
    "project-combined-trailer-container"
  );

  document
    .getElementById("generate-drawing")
    .addEventListener("click", async () => {
      let description = document.getElementById("description").value;

      // 로딩 애니메이션 표시
      loader.style.display = "block";
      resultContainer.innerHTML = "";
      posterResultsContainer.innerHTML = "";
      filterContainer.classList.add("hidden");

      // 한국어 설명을 영어로 번역한 후 그림 생성
      description = await translateText(description, "ko", "en");
      description += " and draw it as a movie poster";
      await generateDrawing(description);

      // 로딩 애니메이션 숨기기
      loader.style.display = "none";
    });

  document.getElementById("filter-movies").addEventListener("click", () => {
    filterPosters("영화");
  });

  document.getElementById("filter-tv").addEventListener("click", () => {
    filterPosters("TV 프로그램");
  });

  document.getElementById("filter-all").addEventListener("click", () => {
    filterPosters("모두");
  });

  genreFilter.addEventListener("change", () => {
    filterByGenre(genreFilter.value);
  });

  async function translateText(text, sourceLang, targetLang) {
    const apiUrl = `https://translation.googleapis.com/language/translate/v2`;

    const requestBody = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    };

    try {
      const response = await fetch(`${apiUrl}?key=${translateApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (
        data.data &&
        data.data.translations &&
        data.data.translations.length > 0
      ) {
        return data.data.translations[0].translatedText;
      } else {
        throw new Error("Translation error");
      }
    } catch (error) {
      console.error("Error:", error);
      return text;
    }
  }

  async function generateDrawing(description) {
    const apiUrl = "https://api.openai.com/v1/images/generations";

    const requestBody = {
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
    };

    try {
      console.log("Request Body:", requestBody);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gptApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("API Response:", data);
      if (data.data && data.data.length > 0 && data.data[0].url) {
        const drawingUrl = data.data[0].url;
        displayDrawing(drawingUrl);
        await searchSimilarPosters(drawingUrl);
        // Show the filter container after generating the drawing
        filterContainer.classList.remove("hidden");
      } else {
        console.error("No image URL in response", data);
        resultContainer.innerHTML =
          "<p>Failed to generate drawing. Please try again later.</p>";
      }
    } catch (error) {
      console.error("Error:", error);
      resultContainer.innerHTML = `<p>Error generating drawing. Please try again later. ${error.message}</p>`;
    }
  }

  function displayDrawing(drawingUrl) {
    resultContainer.innerHTML = `
            <h2>생성된 포스터</h2>
            <img src="${drawingUrl}" alt="Generated Drawing">
            <div id="search-keywords"></div>
        `;
  }

  async function searchSimilarPosters(drawingUrl) {
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;

    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: drawingUrl,
            },
          },
          features: [
            {
              type: "WEB_DETECTION",
              maxResults: 10,
            },
          ],
        },
      ],
    };

    try {
      console.log("Vision API Request Body:", requestBody);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Vision API Response:", data);

      if (
        data.responses &&
        data.responses.length > 0 &&
        data.responses[0].webDetection &&
        data.responses[0].webDetection.visuallySimilarImages
      ) {
        const similarImages =
          data.responses[0].webDetection.visuallySimilarImages;
        searchKeywords.clear(); // Reset searchKeywords before new search
        posters = await getPostersFromImages(similarImages);
        displayFilteredPosters(posters, "모두");
        displaySearchKeywords(Array.from(searchKeywords)); // Convert Set to Array
        populateGenreFilter();
      } else {
        console.error("No similar images in response", data);
        posterResultsContainer.innerHTML =
          "<p>No similar posters found. Please try again later.</p>";
      }
    } catch (error) {
      console.error("Error:", error);
      posterResultsContainer.innerHTML = `<p>Error searching similar posters. Please try again later. ${error.message}</p>`;
    }
  }

  async function getPostersFromImages(similarImages) {
    const postersMap = new Map();
    for (const image of similarImages) {
      const posterResults = await getPosterFromImageUrl(image.url);
      for (const poster of posterResults) {
        const uniqueKey = `${poster.title}-${poster.media_type}`;
        if (!postersMap.has(uniqueKey)) {
          postersMap.set(uniqueKey, poster);
        }
      }
    }
    return Array.from(postersMap.values());
  }

  async function getPosterFromImageUrl(imageUrl) {
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;

    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 3,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (
        data.responses &&
        data.responses.length > 0 &&
        data.responses[0].labelAnnotations
      ) {
        const labels = data.responses[0].labelAnnotations.map(
          (annotation) => annotation.description
        );
        labels.forEach((label) => searchKeywords.add(label)); // Collect search keywords
        const posterResults = [];
        for (const label of labels) {
          const posters = await getPosterFromTitle(label);
          posterResults.push(...posters);
        }
        return posterResults;
      }
      return [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async function getPosterFromTitle(title) {
    const apiUrlMovie = `https://api.themoviedb.org/3/search/movie?api_key=${movieApiKey}&query=${encodeURIComponent(
      title
    )}&language=ko&page=1&include_adult=false`;
    const apiUrlTv = `https://api.themoviedb.org/3/search/tv?api_key=${movieApiKey}&query=${encodeURIComponent(
      title
    )}&language=ko&page=1&include_adult=false`;

    try {
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(apiUrlMovie),
        fetch(apiUrlTv),
      ]);
      const movieData = await movieResponse.json();
      const tvData = await tvResponse.json();
      console.log("TMDB Movie API Response:", movieData);
      console.log("TMDB TV API Response:", tvData);

      const moviePosters = movieData.results
        .map((movie) => {
          if (movie.poster_path) {
            return {
              url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              title: movie.title,
              media_type: "영화",
              genres: movie.genre_ids,
            };
          }
          return null;
        })
        .filter((poster) => poster !== null);

      const tvPosters = tvData.results
        .map((tvShow) => {
          if (tvShow.poster_path) {
            return {
              url: `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`,
              title: tvShow.name,
              media_type: "TV 프로그램",
              genres: tvShow.genre_ids,
            };
          }
          return null;
        })
        .filter((poster) => poster !== null);

      return [...moviePosters, ...tvPosters];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  function filterPosters(filter) {
    const allPosters = document.querySelectorAll(".media-item");
    allPosters.forEach((poster) => {
      const mediaType = poster.dataset.mediaType;
      if (filter === "모두" || mediaType === filter) {
        poster.style.display = "block";
      } else {
        poster.style.display = "none";
      }
    });
  }

  function filterByGenre(genre) {
    const allPosters = document.querySelectorAll(".media-item");
    allPosters.forEach((poster) => {
      const genres = poster.dataset.genres.split(",");
      if (genre === "all" || genres.includes(genre)) {
        poster.style.display = "block";
      } else {
        poster.style.display = "none";
      }
    });
  }

  function displayFilteredPosters(posters, filter) {
    posterResultsContainer.innerHTML = `
            <h2>비슷한 포스터</h2>
            <div class="similar-images-grid">
                ${posters
                  .map(
                    (poster) => `
                    <div class="media-item" data-media-type="${
                      poster.media_type
                    }" data-genres="${poster.genres.join(",")}">
                        <img src="${poster.url}" alt="${poster.title}">
                        <h3>${poster.title} (${poster.media_type})</h3>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
    filterPosters(filter);
    addPosterClickEvent(); // 포스터 클릭 이벤트 추가
  }

  function displaySearchKeywords(keywords) {
    const searchKeywordsContainer = document.getElementById("search-keywords");
    searchKeywordsContainer.innerHTML = `
            <h3>사용된 검색어:</h3>
            <p>${keywords.join(", ")}</p>
        `;
  }

  async function populateGenreFilter() {
    const genreApiUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${movieApiKey}&language=ko`;
    try {
      const response = await fetch(genreApiUrl);
      const data = await response.json();
      if (data.genres) {
        genreFilter.innerHTML = `<option value="all">All Genres</option>`;
        data.genres.forEach((genre) => {
          const option = document.createElement("option");
          option.value = genre.id;
          option.textContent = genre.name;
          genreFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error populating genre filter:", error);
    }
  }

  // 트레일러를 가져오는 함수
  async function fetchTrailer(id, type) {
    const apiUrl = `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${movieApiKey}&language=ko-KR`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const trailers = data.results.filter(
        (video) => video.type === "Trailer" && video.site === "YouTube"
      );
      return trailers.length > 0
        ? `https://www.youtube.com/embed/${trailers[0].key}`
        : null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  // 포스터 클릭 이벤트 추가 함수
  function addPosterClickEvent() {
    document.querySelectorAll(".media-item img").forEach((image) => {
      image.addEventListener("click", async () => {
        const mediaType =
          image.parentElement.dataset.mediaType === "영화" ? "movie" : "tv";
        const title = image.alt;
        const id = await getIdFromTitle(title, mediaType);
        const overview = await getOverviewFromTitle(title, mediaType);
        const trailerUrl = await fetchTrailer(id, mediaType);

        if (trailerUrl) {
          showCombinedPopup(image.src, title, overview, trailerUrl);
        } else {
          showPosterPopup(image.src, title, overview);
        }
      });
    });
  }

  async function getIdFromTitle(title, type) {
    const apiUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${movieApiKey}&query=${encodeURIComponent(
      title
    )}&language=ko&page=1&include_adult=false`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].id;
      }
      return null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }

  async function getOverviewFromTitle(title, type) {
    const apiUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${movieApiKey}&query=${encodeURIComponent(
      title
    )}&language=ko&page=1&include_adult=false`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].overview;
      }
      return "";
    } catch (error) {
      console.error("Error:", error);
      return "";
    }
  }

  function showPosterPopup(imageUrl, title, overview) {
    projectPopupImage.src = imageUrl;
    projectPopupImage.alt = title;
    projectPopupText.textContent = overview;
    projectPosterModal.style.display = "flex";
  }

  function showCombinedPopup(imageUrl, title, overview, trailerUrl) {
    projectCombinedPopupImage.src = imageUrl;
    projectCombinedPopupImage.alt = title;
    projectCombinedPopupText.textContent = overview;
    projectCombinedTrailerContainer.src = trailerUrl;
    projectCombinedModal.style.display = "flex";
  }

  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      projectPosterModal.style.display = "none";
      projectTrailerModal.style.display = "none";
      projectCombinedModal.style.display = "none";
      projectTrailerContainer.src = "";
      projectCombinedTrailerContainer.src = "";
    });
  });

  window.addEventListener("click", (event) => {
    if (
      event.target === projectPosterModal ||
      event.target === projectTrailerModal ||
      event.target === projectCombinedModal
    ) {
      projectPosterModal.style.display = "none";
      projectTrailerModal.style.display = "none";
      projectCombinedModal.style.display = "none";
      projectTrailerContainer.src = "";
      projectCombinedTrailerContainer.src = "";
    }
  });

  projectPopupImage.addEventListener("click", () => {
    window.location.href = "movie_similar.html";
  });

  projectCombinedPopupImage.addEventListener("click", () => {
    window.location.href = "movie_similar.html";
  });
});
