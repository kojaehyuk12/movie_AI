document.addEventListener("DOMContentLoaded", () => {
  const tmdbApiKey = ""; // 여기에 TMDB API 키를 입력하세요.
  const visionApiKey = ""; // 여기에 Google Cloud Vision API 키를 입력하세요.
  const gptApiKey = ''; // 여기에 OpenAI API 키 (GPT)를 입력하세요.
  const translateApiKey = ""; // 여기에 Google Cloud Translate API 키를 입력하세요.
  const movieImageUrl = localStorage.getItem("movieImageUrl");
  const movieTitle = localStorage.getItem("movieTitle");
  const movieId = localStorage.getItem("movieId");
  const movieOverview = localStorage.getItem("movieOverview");
  const movieImageElement = document.getElementById("movie-image");
  const visionResultsContainer = document.getElementById("vision-results-container");
  const visionLoading = document.getElementById("vision-loading");
  const tmdbResultsContainer = document.getElementById("tmdb-results-container");
  const tmdbLoading = document.getElementById("tmdb-loading");
  const aiResultsContainer = document.getElementById("ai-results-container");
  const aiLoading = document.getElementById("ai-loading");

  let previousVisionImageUrls = new Set();

  if (movieImageUrl && movieImageElement) {
      movieImageElement.src = movieImageUrl;
      movieImageElement.alt = movieTitle;
  }

  // 페이지 로드 시 초기 검색 수행
  (async () => {
      if (visionLoading) visionLoading.style.display = "block";
      if (tmdbLoading) tmdbLoading.style.display = "block";

      const visionImages = await searchSimilarImages(movieImageUrl);
      const moviePosters = await getMoviePostersFromTMDB(visionImages);
      displayVisionPosters(moviePosters);

      if (visionLoading) visionLoading.style.display = "none";

      if (movieId) {
          const recommendedMovies = await searchRecommendedMovies(movieId);
          if (recommendedMovies.length > 0) {
              displayTmdbPosters(getRandomElements(recommendedMovies, 10));
          } else {
              const randomMovies = await getRandomMovies();
              displayTmdbPosters(randomMovies);
          }
      } else {
          await searchSimilarMoviesByTitle(movieTitle);
      }

      if (tmdbLoading) tmdbLoading.style.display = "none";
  })();

  document.getElementById("search-similar-posters").addEventListener("click", async () => {
      visionResultsContainer.innerHTML = "";
      tmdbResultsContainer.innerHTML = "";
      aiResultsContainer.innerHTML = "";
      if (visionLoading) visionLoading.style.display = "block";
      if (tmdbLoading) tmdbLoading.style.display = "block";
      if (aiLoading) aiLoading.style.display = "block";

      // 초기 이미지 검색
      const visionImages = await searchSimilarImages(movieImageUrl);
      const moviePosters = await getMoviePostersFromTMDB(visionImages);
      displayVisionPosters(moviePosters);

      if (visionLoading) visionLoading.style.display = "none";

      if (movieId) {
          const recommendedMovies = await searchRecommendedMovies(movieId);
          if (recommendedMovies.length > 0) {
              displayTmdbPosters(getRandomElements(recommendedMovies, 10));
          } else {
              const randomMovies = await getRandomMovies();
              displayTmdbPosters(randomMovies);
          }
      } else {
          await searchSimilarMoviesByTitle(movieTitle);
      }

      if (tmdbLoading) tmdbLoading.style.display = "none";

      // AI 그림 생성
      const keywords = visionImages.labels.map(label => label.description);
      try {
          const imageUrl = await generateImageDescription(keywords);
          aiResultsContainer.innerHTML = `
              <img src="${imageUrl}" alt="Generated Image">
          `;
      } catch (error) {
          aiResultsContainer.innerHTML = "<p>AI 그림 생성 중 오류가 발생했습니다. 다시 시도해 주세요.</p>";
      } finally {
          if (aiLoading) aiLoading.style.display = "none";
      }
  });

  async function searchSimilarImages(imageUrl) {
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
                          type: "WEB_DETECTION",
                          maxResults: 100,
                      },
                      {
                          type: "LABEL_DETECTION",
                          maxResults: 100,
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
          console.log("Vision API 응답:", data);

          if (data.responses && data.responses.length > 0 && data.responses[0].webDetection) {
              const similarImages = data.responses[0].webDetection.visuallySimilarImages || [];
              const labels = data.responses[0].labelAnnotations || [];
              return { similarImages, labels };
          } else {
              console.error("No similar images in response", data);
              if (visionResultsContainer) {
                  visionResultsContainer.innerHTML =
                      "<p>유사한 이미지를 찾을 수 없습니다. 나중에 다시 시도해 주세요.</p>";
              }
              return { similarImages: [], labels: [] };
          }
      } catch (error) {
          console.error("Error:", error);
          if (visionResultsContainer) {
              visionResultsContainer.innerHTML =
                  "<p>유사한 이미지를 검색하는 도중 오류가 발생했습니다. 나중에 다시 시도해 주세요.</p>";
          }
          return { similarImages: [], labels: [] };
      }
  }

  async function getMoviePostersFromTMDB(visionData) {
      const { similarImages, labels } = visionData;
      const posters = [];

      for (const image of similarImages) {
          if (previousVisionImageUrls.has(image.url)) continue;
          previousVisionImageUrls.add(image.url);

          const searchQuery = encodeURIComponent(
              image.url.split("/").pop().split(".")[0]
          );
          const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${searchQuery}&language=ko-KR`;

          try {
              const response = await fetch(apiUrl);
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                  const movie = data.results[0];
                  if (movie.poster_path) {
                      posters.push({
                          url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                          title: movie.title,
                          id: movie.id,
                          overview: movie.overview,
                      });
                  }
              }
          } catch (error) {
              console.error("Error:", error);
          }
      }

      for (const label of labels) {
          const searchQuery = encodeURIComponent(label.description);
          const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${searchQuery}&language=ko-KR`;

          try {
              const response = await fetch(apiUrl);
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                  const movie = data.results[0];
                  if (movie.poster_path && !posters.some((p) => p.id === movie.id)) {
                      posters.push({
                          url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                          title: movie.title,
                          id: movie.id,
                          overview: movie.overview,
                      });
                  }
              }
          } catch (error) {
              console.error("Error:", error);
          }
      }

      const uniquePosters = removeDuplicatePosters(posters);
      return getRandomElements(uniquePosters, 10);
  }

  async function generateImageDescription(keywords) {
      const apiUrl = 'https://api.openai.com/v1/images/generations';
      const requestBody = {
          model: "dall-e-3",
          prompt: `Create a detailed image with a background based on the following keywords and draw it like a real movie poster: ${keywords.join(', ')}.`,
          n: 1,
          size: "1024x1024"
      };

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${gptApiKey}`
              },
              body: JSON.stringify(requestBody)
          });
          const data = await response.json();
          if (data.data && data.data.length > 0) {
              return data.data[0].url;
          } else {
              throw new Error('No image URL in response');
          }
      } catch (error) {
          throw new Error(`Error generating image: ${error.message}`);
      }
  }

  function removeDuplicatePosters(posters) {
      const uniquePosters = [];
      const posterUrls = new Set();

      for (const poster of posters) {
          if (!posterUrls.has(poster.url)) {
              uniquePosters.push(poster);
              posterUrls.add(poster.url);
          }
      }

      return uniquePosters;
  }

  function getRandomElements(array, count) {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
  }

  async function searchSimilarMoviesByTitle(title) {
      const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${title}&language=ko-KR`;

      try {
          const response = await fetch(apiUrl);
          const data = await response.json();
          console.log("TMDB API 응답:", data);

          if (data.results && data.results.length > 0) {
              const movieId = data.results[0].id;
              localStorage.setItem("movieId", movieId);
              const similarMovies = await searchRecommendedMovies(movieId);
              if (similarMovies.length > 0) {
                  displayTmdbPosters(getRandomElements(similarMovies, 10));
              } else {
                  const randomMovies = await getRandomMovies();
                  displayTmdbPosters(randomMovies);
              }
          } else {
              console.error("No movies found in response", data);
              if (tmdbResultsContainer) {
                  const randomMovies = await getRandomMovies();
                  displayTmdbPosters(randomMovies);
              }
          }
      } catch (error) {
          console.error("Error:", error);
          if (tmdbResultsContainer) {
              const randomMovies = await getRandomMovies();
              displayTmdbPosters(randomMovies);
          }
      }
  }

  async function searchRecommendedMovies(movieId) {
      const movieApiUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=ko-KR`;
      try {
          const movieResponse = await fetch(movieApiUrl);
          const movieData = await movieResponse.json();
          const genres = movieData.genres.map((genre) => genre.id);

          const genreCombinations = getGenreCombinations(genres);
          const allResults = [];

          for (const combination of genreCombinations) {
              const genreQuery = combination.join(",");
              const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&with_genres=${genreQuery}&language=ko-KR&page=1`;

              let currentPage = 1;
              while (currentPage <= 5) {
                  const response = await fetch(`${apiUrl}&page=${currentPage}`);
                  const data = await response.json();
                  console.log("TMDB API 응답:", data);

                  if (data.results && data.results.length > 0) {
                      allResults.push(...data.results);
                  } else {
                      break;
                  }
                  currentPage++;
              }
          }

          const uniqueResults = removeDuplicateMovies(allResults);
          return uniqueResults;
      } catch (error) {
          console.error("Error:", error);
          return [];
      }
  }

  function getGenreCombinations(genres) {
      const combinations = [];
      const length = genres.length;

      for (let i = 0; i < length; i++) {
          for (let j = i + 1; j < length; j++) {
              combinations.push([genres[i], genres[j]]);
          }
      }

      return combinations;
  }

  async function getRandomMovies() {
      const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=ko-KR&page=1`;
      try {
          const response = await fetch(apiUrl);
          const data = await response.json();
          const randomMovies = getRandomElements(data.results, 10);
          return randomMovies;
      } catch (error) {
          console.error("Error fetching random movies:", error);
          return [];
      }
  }

  function removeDuplicateMovies(movies) {
      const uniqueMovies = [];
      const movieIds = new Set();

      for (const movie of movies) {
          if (!movieIds.has(movie.id)) {
              uniqueMovies.push(movie);
              movieIds.add(movie.id);
          }
      }

      return uniqueMovies;
  }

  async function translateTitle(title) {
      const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${translateApiKey}`;
      const requestBody = {
          q: title,
          target: "ko",
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
          if (data.data && data.data.translations && data.data.translations.length > 0) {
              return data.data.translations[0].translatedText;
          } else {
              console.error("Translation API 응답 오류:", data);
              return title;
          }
      } catch (error) {
          console.error("Translation Error:", error);
          return title;
      }
  }

  async function displayVisionPosters(images) {
      if (!images || images.length === 0) {
          if (visionResultsContainer) {
              visionResultsContainer.innerHTML =
                  "<p>유사한 영화를 찾을 수 없습니다.</p>";
          }
          return;
      }

      const posters = await Promise.all(
          images.map(async (image) => {
              const translatedTitle = await translateTitle(image.title);
              return { ...image, title: translatedTitle };
          })
      );

      if (visionResultsContainer) {
          visionResultsContainer.innerHTML = `
              <div class="similar-images-grid">
                  ${posters
                    .map(
                      (image) => `
                      <div class="poster-item" onclick="showPosterModal('${image.id}', '${image.url}', '${image.title}', '${image.overview}')">
                          <img src="${image.url}" alt="유사한 영화 포스터" onerror="this.onerror=null; this.src='path/to/default-image.png';">
                          <p>${image.title}</p>
                      </div>
                  `
                    )
                    .join("")}
              </div>
          `;
      }
  }

  function displayTmdbPosters(movies) {
      if (!movies || movies.length === 0) {
          if (tmdbResultsContainer) {
              tmdbResultsContainer.innerHTML = "<p>추천 영화를 찾을 수 없습니다.</p>";
          }
          return;
      }

      if (tmdbResultsContainer) {
          tmdbResultsContainer.innerHTML = `
              <div class="similar-images-grid">
                  ${movies
                    .map(
                      (movie) => `
                      <div class="poster-item" onclick="showPosterModal('${movie.id}', 'https://image.tmdb.org/t/p/w500${movie.poster_path}', '${movie.title}', '${movie.overview}')">
                          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="추천 영화 포스터" onerror="this.onerror=null; this.src='path/to/default-image.png';">
                          <p>${movie.title}</p>
                      </div>
                  `
                    )
                    .join("")}
              </div>
          `;
      }
  }

  window.showPosterModal = async (id, imageUrl, title, overview) => {
      const trailerUrl = await fetchTrailer(id);
      const popupImage = document.getElementById("popup-image");
      if (popupImage) {
          popupImage.src = imageUrl;
          popupImage.alt = title;
      }
      const popupText = document.getElementById("popup-text");
      if (popupText) popupText.innerText = overview;
      const combinedPopupImage = document.getElementById("combined-popup-image");
      if (combinedPopupImage) {
          combinedPopupImage.src = imageUrl;
          combinedPopupImage.alt = title;
      }
      const combinedPopupText = document.getElementById("combined-popup-text");
      if (combinedPopupText) combinedPopupText.innerText = overview;

      if (trailerUrl) {
          const combinedTrailerContainer = document.getElementById("combined-trailer-container");
          if (combinedTrailerContainer) combinedTrailerContainer.src = trailerUrl;
          const combinedModal = document.getElementById("combinedModal");
          if (combinedModal) combinedModal.style.display = "flex";
      } else {
          const posterModal = document.getElementById("posterModal");
          if (posterModal) posterModal.style.display = "flex";
      }

      // 로컬 스토리지에 영화 세부 정보 저장
      saveMovieDetails(imageUrl, title, id);
  };

  async function fetchTrailer(id) {
      const apiUrl = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${tmdbApiKey}&language=ko-KR`;

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
          console.error("Error fetching trailer:", error);
          return null;
      }
  }

  const posterModalClose = document.getElementById("popup-close");
  if (posterModalClose) {
      posterModalClose.addEventListener("click", () => {
          const posterModal = document.getElementById("posterModal");
          if (posterModal) posterModal.style.display = "none";
      });
  }

  const modalCloseButtons = document.querySelectorAll(".modal-close");
  if (modalCloseButtons) {
      modalCloseButtons.forEach(button => {
          button.addEventListener("click", () => {
              const posterModal = document.getElementById("posterModal");
              if (posterModal) posterModal.style.display = "none";
              const trailerModal = document.getElementById("trailerModal");
              if (trailerModal) trailerModal.style.display = "none";
              const combinedModal = document.getElementById("combinedModal");
              if (combinedModal) combinedModal.style.display = "none";
              const trailerContainer = document.getElementById("trailer-container");
              if (trailerContainer) trailerContainer.src = "";
              const combinedTrailerContainer = document.getElementById("combined-trailer-container");
              if (combinedTrailerContainer) combinedTrailerContainer.src = "";
          });
      });
  }

  window.addEventListener("click", (event) => {
      const posterModal = document.getElementById("posterModal");
      const trailerModal = document.getElementById("trailerModal");
      const combinedModal = document.getElementById("combinedModal");
      if (event.target === posterModal || event.target === trailerModal || event.target === combinedModal) {
          if (posterModal) posterModal.style.display = "none";
          if (trailerModal) trailerModal.style.display = "none";
          if (combinedModal) combinedModal.style.display = "none";
          const trailerContainer = document.getElementById("trailer-container");
          if (trailerContainer) trailerContainer.src = "";
          const combinedTrailerContainer = document.getElementById("combined-trailer-container");
          if (combinedTrailerContainer) combinedTrailerContainer.src = "";
      }
  });

  const popupImage = document.getElementById("popup-image");
  if (popupImage) {
      popupImage.addEventListener("click", () => {
          window.location.href = "movie_similar.html";
      });
  }

  const combinedPopupImage = document.getElementById("combined-popup-image");
  if (combinedPopupImage) {
      combinedPopupImage.addEventListener("click", () => {
          window.location.href = "movie_similar.html";
      });
  }

  function saveMovieDetails(imageUrl, title, id) {
      localStorage.setItem("movieImageUrl", imageUrl);
      localStorage.setItem("movieTitle", title);
      localStorage.setItem("movieId", id);
  }
});
