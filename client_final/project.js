document.addEventListener("DOMContentLoaded", () => {
  const movieApiKey = "f742807187da80a491683b620672de02";
  let popularMoviesPage = 1;
  let popularTvShowsPage = 1;
  let nowPlayingMoviesPage = 1;

  const elements = document.querySelectorAll(".fade-in"); // 모든 .fade-in 클래스를 가진 요소를 선택
  elements.forEach((el, index) => {
    // 각 요소에 대해 반복
    setTimeout(() => {
      el.classList.add("visible"); // .visible 클래스를 추가하여 애니메이션 시작
    }, index * 500); // 각 요소가 500ms 간격으로 나타나도록 설정
  });

  async function fetchAndDisplayMedia(apiUrl, containerId, page) {
    try {
      const response = await fetch(apiUrl + `&page=${page}&language=ko-KR`);
      const data = await response.json();
      const container = document.getElementById(containerId);
      container.innerHTML = ""; // Clear the container before adding new items

      const itemsToShow = data.results.slice(0, 10); // Show only 7 items per page

      itemsToShow.forEach((item) => {
        const mediaElement = document.createElement("div");
        mediaElement.classList.add("media-item");
        const imageUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

        mediaElement.innerHTML = `
                  <img src="${imageUrl}" alt="${item.title || item.name}">
                  <h3>${item.title || item.name}</h3>
              `;
        container.appendChild(mediaElement);

        // 포스터 클릭 이벤트 추가
        mediaElement.addEventListener("click", () => {
          showPopup(
            imageUrl,
            item.title || item.name,
            item.overview,
            item.id,
            containerId === "popular-tv-shows" ? "tv" : "movie"
          );
        });
      });
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  }

  function loadPopularMovies(page) {
    const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${movieApiKey}`;
    fetchAndDisplayMedia(apiUrl, "popular-movies", page);
  }

  function loadPopularTvShows(page) {
    const apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${movieApiKey}`;
    fetchAndDisplayMedia(apiUrl, "popular-tv-shows", page);
  }

  function loadNowPlayingMovies(page) {
    const apiUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${movieApiKey}`;
    fetchAndDisplayMedia(apiUrl, "now-playing-movies", page);
  }

  function setupCarousel(
    buttonPrev,
    buttonNext,
    containerId,
    loadPageFunction
  ) {
    let currentPage = 1;

    buttonPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadPageFunction(currentPage);
      }
    });

    buttonNext.addEventListener("click", () => {
      currentPage++;
      loadPageFunction(currentPage);
    });

    loadPageFunction(currentPage);
  }

  setupCarousel(
    document.querySelector(".carousel:nth-of-type(1) .prev-button"),
    document.querySelector(".carousel:nth-of-type(1) .next-button"),
    "popular-movies",
    loadPopularMovies
  );

  setupCarousel(
    document.querySelector(".carousel:nth-of-type(2) .prev-button"),
    document.querySelector(".carousel:nth-of-type(2) .next-button"),
    "popular-tv-shows",
    loadPopularTvShows
  );

  setupCarousel(
    document.querySelector(".carousel:nth-of-type(3) .prev-button"),
    document.querySelector(".carousel:nth-of-type(3) .next-button"),
    "now-playing-movies",
    loadNowPlayingMovies
  );

  // 팝업 기능 구현
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

  function showPopup(imageUrl, title, overview, id, type) {
    projectPopupImage.src = imageUrl;
    projectPopupImage.alt = title;
    projectPopupText.textContent = overview;

    projectCombinedPopupImage.src = imageUrl;
    projectCombinedPopupImage.alt = title;
    projectCombinedPopupText.textContent = overview;

    fetchTrailer(id, type).then((trailerUrl) => {
      if (trailerUrl) {
        projectCombinedTrailerContainer.src = trailerUrl;
        projectCombinedModal.style.display = "flex";
      } else {
        projectPosterModal.style.display = "flex";
      }
    });
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
