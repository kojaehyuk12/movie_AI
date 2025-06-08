document.addEventListener("DOMContentLoaded", () => {
    const movieApiKey = "f742807187da80a491683b620672de02";
    const movieGrid = document.getElementById("movie-grid");
    const tvGrid = document.getElementById("tv-grid");
    const showMoreMovieButton = document.getElementById("show-more-movie");
    const showMoreTvButton = document.getElementById("show-more-tv");
    const posterModal = document.getElementById("posterModal");
    const trailerModal = document.getElementById("trailerModal");
    const combinedModal = document.getElementById("combinedModal");
    const modalCloseButtons = document.querySelectorAll(".modal-close");
    const trailerContainer = document.getElementById("trailer-container");
    const combinedTrailerContainer = document.getElementById("combined-trailer-container");
    const popupImage = document.getElementById("popup-image");
    const combinedPopupImage = document.getElementById("combined-popup-image");
    const popupText = document.getElementById("popup-text");
    const combinedPopupText = document.getElementById("combined-popup-text");
    let currentPageMovies = 1;
    let currentPageTv = 1;
    let currentMovies = [];
    let currentTvShows = [];
    let currentGenres = [];
    let currentSearchQuery = null;
    let filterType = null;

    // URL의 쿼리 파라미터를 가져오는 함수
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // 장르 필터 버튼 초기화 함수
    function resetGenreFilters() {
        currentGenres = [];
        document.querySelectorAll(".genre-btn").forEach(button => {
            button.classList.remove("active");
        });
    }

    // 영화 데이터를 가져오는 함수
    async function fetchMovies(append = false) {
        let apiUrl = "";
        const genreString = currentGenres.join(',');

        if (currentSearchQuery) {
            apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${movieApiKey}&query=${currentSearchQuery}&page=${currentPageMovies}&language=ko-KR`;
        } else if (filterType === "popular") {
            apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${movieApiKey}&page=${currentPageMovies}&language=ko-KR${genreString ? `&with_genres=${genreString}` : ''}`;
        } else if (filterType === "now_playing") {
            apiUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${movieApiKey}&page=${currentPageMovies}&language=ko-KR${genreString ? `&with_genres=${genreString}` : ''}`;
        } else {
            apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${movieApiKey}&with_genres=${genreString}&page=${currentPageMovies}&language=ko-KR`;
        }

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (append) {
                currentMovies = currentMovies.concat(data.results);
            } else {
                currentMovies = data.results;
            }
            displayMovies();
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // TV 쇼 데이터를 가져오는 함수
    async function fetchTvShows(append = false) {
        let apiUrl = "";
        const genreString = currentGenres.join(',');

        if (currentSearchQuery) {
            apiUrl = `https://api.themoviedb.org/3/search/tv?api_key=${movieApiKey}&query=${currentSearchQuery}&page=${currentPageTv}&language=ko-KR`;
        } else if (filterType === "popular") {
            apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${movieApiKey}&page=${currentPageTv}&language=ko-KR${genreString ? `&with_genres=${genreString}` : ''}`;
        } else if (filterType === "now_playing") {
            apiUrl = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${movieApiKey}&page=${currentPageTv}&language=ko-KR${genreString ? `&with_genres=${genreString}` : ''}`;
        } else {
            apiUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${movieApiKey}&with_genres=${genreString}&page=${currentPageTv}&language=ko-KR`;
        }

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (append) {
                currentTvShows = currentTvShows.concat(data.results);
            } else {
                currentTvShows = data.results;
            }
            displayTvShows();
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // 영화 데이터를 화면에 표시하는 함수
    function displayMovies() {
        movieGrid.innerHTML = ""; // 기존 결과를 지움
        if (currentMovies.length === 0) {
            movieGrid.innerHTML = `<p>해당하는 작품은 없습니다</p>`;
            showMoreMovieButton.style.display = "none";
            return;
        }
        const moviesToShow = currentMovies.slice(0, currentPageMovies * 5);
        moviesToShow.forEach((movie) => {
            const movieElement = document.createElement("div");
            movieElement.classList.add("media-item");
            const movieImageUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'; // 포스터가 없는 경우를 처리

            movieElement.innerHTML = `
                <img src="${movieImageUrl}" alt="${movie.title}">
                <div class="heart-icon"></div>
                <h3>${movie.title}</h3>
            `;
            movieElement.addEventListener("click", async () => {
                const trailerUrl = await fetchTrailer(movie.id, "movie");
                popupImage.src = movieImageUrl;
                popupImage.alt = movie.title;
                popupText.textContent = movie.overview;
                combinedPopupImage.src = movieImageUrl;
                combinedPopupImage.alt = movie.title;
                combinedPopupText.textContent = movie.overview;

                if (trailerUrl) {
                    combinedTrailerContainer.src = trailerUrl;
                    combinedModal.style.display = "flex";
                } else {
                    posterModal.style.display = "flex";
                }
                saveMovieDetails(movieImageUrl, movie.title, movie.id);
            });
            movieGrid.appendChild(movieElement);
        });

        if (currentMovies.length > moviesToShow.length) {
            showMoreMovieButton.style.display = "block";
        } else {
            showMoreMovieButton.style.display = "none";
        }
    }

    // TV 쇼 데이터를 화면에 표시하는 함수
    function displayTvShows() {
        tvGrid.innerHTML = ""; // 기존 결과를 지움
        if (currentTvShows.length === 0) {
            tvGrid.innerHTML = `<p>검색결과가 없습니다.</p>`;
            showMoreTvButton.style.display = "none";
            return;
        }
        const tvShowsToShow = currentTvShows.slice(0, currentPageTv * 5);
        tvShowsToShow.forEach((tvShow) => {
            const tvShowElement = document.createElement("div");
            tvShowElement.classList.add("media-item");
            const tvShowImageUrl = tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'; // 포스터가 없는 경우를 처리

            tvShowElement.innerHTML = `
                <img src="${tvShowImageUrl}" alt="${tvShow.name}">
                <div class="heart-icon"></div>
                <h3>${tvShow.name}</h3>
            `;
            tvShowElement.addEventListener("click", async () => {
                const trailerUrl = await fetchTrailer(tvShow.id, "tv");
                popupImage.src = tvShowImageUrl;
                popupImage.alt = tvShow.name;
                popupText.textContent = tvShow.overview;
                combinedPopupImage.src = tvShowImageUrl;
                combinedPopupImage.alt = tvShow.name;
                combinedPopupText.textContent = tvShow.overview;

                if (trailerUrl) {
                    combinedTrailerContainer.src = trailerUrl;
                    combinedModal.style.display = "flex";
                } else {
                    posterModal.style.display = "flex";
                }
                saveMovieDetails(tvShowImageUrl, tvShow.name, tvShow.id);
            });
            tvGrid.appendChild(tvShowElement);
        });

        if (currentTvShows.length > tvShowsToShow.length) {
            showMoreTvButton.style.display = "block";
        } else {
            showMoreTvButton.style.display = "none";
        }
    }

    // 트레일러 데이터를 가져오는 함수
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

    // 영화 세부 정보를 저장하는 함수
    function saveMovieDetails(imageUrl, title, id) {
        localStorage.setItem("movieImageUrl", imageUrl);
        localStorage.setItem("movieTitle", title);
        localStorage.setItem("movieId", id);
    }

    // 미디어 찾기 버튼 클릭 이벤트
    document.getElementById("findMedia").addEventListener("click", () => {
        currentSearchQuery = document.getElementById("search").value;
        document.getElementById("search").value = ""; // 검색어 초기화
        currentPageMovies = 1;
        currentPageTv = 1;
        currentMovies = [];
        currentTvShows = [];
        filterType = null;
        resetGenreFilters(); // 장르 필터 초기화
        if (!currentSearchQuery) {
            fetchRandomMedia();
        } else {
            fetchMovies();
            fetchTvShows();
        }
    });

    // 랜덤 미디어 버튼 클릭 이벤트
    document.getElementById("randomMedia").addEventListener("click", () => {
        currentSearchQuery = null;
        document.getElementById("search").value = ""; // 검색어 초기화
        currentPageMovies = 1;
        currentPageTv = 1;
        currentMovies = [];
        currentTvShows = [];
        filterType = null;
        fetchRandomMedia();
    });

    // 인기작품 버튼 클릭 이벤트
    document.getElementById("popularMedia").addEventListener("click", () => {
        currentSearchQuery = null;
        document.getElementById("search").value = ""; // 검색어 초기화
        currentPageMovies = 1;
        currentPageTv = 1;
        currentMovies = [];
        currentTvShows = [];
        filterType = "popular";
        resetGenreFilters(); // 장르 필터 초기화
        fetchMovies();
        fetchTvShows();
    });

    // 상영중 버튼 클릭 이벤트
    document.getElementById("nowPlayingMedia").addEventListener("click", () => {
        currentSearchQuery = null;
        document.getElementById("search").value = ""; // 검색어 초기화
        currentPageMovies = 1;
        currentPageTv = 1;
        currentMovies = [];
        currentTvShows = [];
        filterType = "now_playing";
        resetGenreFilters(); // 장르 필터 초기화
        fetchMovies();
        fetchTvShows();
    });

    // 장르 필터 버튼 클릭 이벤트
    document.querySelectorAll(".genre-btn").forEach(button => {
        button.addEventListener("click", () => {
            const genre = button.dataset.genre;
            if (currentGenres.includes(genre)) {
                currentGenres = currentGenres.filter(g => g !== genre);
                button.classList.remove("active");
            } else {
                currentGenres.push(genre);
                button.classList.add("active");
            }
            currentSearchQuery = null;
            document.getElementById("search").value = ""; // 검색어 초기화
            currentPageMovies = 1;
            currentPageTv = 1;
            currentMovies = [];
            currentTvShows = [];
            fetchMovies(); // 장르 필터 시 해당 장르의 영화와 TV쇼를 가져오기
            fetchTvShows();
        });
    });

    // 랜덤 미디어를 여러 번 시도해서 가져오는 함수
    async function fetchRandomMedia() {
        const genreString = currentGenres.join(',');
        const promises = [];
        for (let i = 0; i < 10; i++) {
            const randomPageMovies = Math.floor(Math.random() * 500) + 1;
            const randomPageTv = Math.floor(Math.random() * 500) + 1;
            const apiUrlMovies = `https://api.themoviedb.org/3/discover/movie?api_key=${movieApiKey}&page=${randomPageMovies}&with_genres=${genreString}&language=ko-KR`;
            const apiUrlTv = `https://api.themoviedb.org/3/discover/tv?api_key=${movieApiKey}&page=${randomPageTv}&with_genres=${genreString}&language=ko-KR`;
            promises.push(fetch(apiUrlMovies).then(response => response.json()));
            promises.push(fetch(apiUrlTv).then(response => response.json()));
        }

        try {
            const results = await Promise.all(promises);
            currentMovies = [];
            currentTvShows = [];
            for (const result of results) {
                if (result.results) {
                    if (result.results.length > 0 && result.results[0].hasOwnProperty('title')) {
                        currentMovies = currentMovies.concat(result.results);
                    } else if (result.results.length > 0 && result.results[0].hasOwnProperty('name')) {
                        currentTvShows = currentTvShows.concat(result.results);
                    }
                }
            }
            if (currentMovies.length === 0 && currentTvShows.length === 0) {
                movieGrid.innerHTML = `<p>검색결과가 없습니다.</p>`;
                tvGrid.innerHTML = `<p>검색결과가 없습니다.</p>`;
                showMoreMovieButton.style.display = "none";
                showMoreTvButton.style.display = "none";
            } else {
                displayMovies();
                displayTvShows();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // 더 보기 버튼 클릭 이벤트
    showMoreMovieButton.addEventListener("click", () => {
        currentPageMovies++;
        fetchMovies(true);
    });

    showMoreTvButton.addEventListener("click", () => {
        currentPageTv++;
        fetchTvShows(true);
    });

    // 모달 닫기 이벤트
    modalCloseButtons.forEach(button => {
        button.addEventListener("click", () => {
            posterModal.style.display = "none";
            trailerModal.style.display = "none";
            combinedModal.style.display = "none";
            trailerContainer.src = "";
            combinedTrailerContainer.src = "";
        });
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener("click", (event) => {
        if (event.target === posterModal || event.target === trailerModal || event.target === combinedModal) {
            posterModal.style.display = "none";
            trailerModal.style.display = "none";
            combinedModal.style.display = "none";
            trailerContainer.src = "";
            combinedTrailerContainer.src = "";
        }
    });

    // 포스터 이미지 클릭 시 movie_similar.html로 이동
    popupImage.addEventListener("click", () => {
        window.location.href = "movie_similar.html";
    });

    // 트레일러가 있는 모달의 포스터 이미지 클릭 시 movie_similar.html로 이동
    combinedPopupImage.addEventListener("click", () => {
        window.location.href = "movie_similar.html";
    });

    // 쿼리 파라미터가 있는지 확인하고 데이터 가져오기
    const query = getQueryParam('q');
    if (query) {
        document.getElementById("search").value = query;
        currentSearchQuery = query;
        fetchMovies();
        fetchTvShows();
    } else {
        fetchRandomMedia();
    }
});
