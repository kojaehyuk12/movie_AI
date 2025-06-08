
🎬 나만의 영화 포스터로 영화 추천 받기 🎨
✨ 프로젝트 개요
본 프로젝트는 사용자가 OpenAI의 강력한 이미지 생성 모델인 DALL-E 3를 활용하여 원하는 영화 포스터를 직접 생성하고, 그 포스터의 스타일과 분위기를 분석하여 관련 영화를 추천해 주는 웹 애플리케이션입니다.

더 나아가, 생성된 포스터와 시각적으로 유사한 분위기를 가진 영화 포스터들을 추가적으로 제공하여 사용자가 더욱 폭넓은 영화 탐색 경험을 할 수 있도록 돕습니다.

이 프로젝트는 순수하게 프론트엔드(HTML, CSS, JavaScript)만으로 구현되었으며, 필요한 모든 기능은 외부 API (OpenAI DALL-E 3, TMDB, Google Cloud Vision, Google Cloud Translate)를 직접 호출하여 처리합니다.

🛠️ 주요 기능
DALL-E 3 기반 맞춤형 영화 포스터 생성:
사용자가 입력한 텍스트 프롬프트(영화 포스터에 대한 설명)를 바탕으로 DALL-E 3 API를 호출하여 독창적인 영화 포스터 이미지를 생성합니다.
생성된 포스터는 웹페이지에 즉시 표시됩니다.
생성 포스터 기반 영화 추천:
생성된 영화 포스터 이미지를 Google Cloud Vision API를 통해 분석합니다.
분석된 이미지 특징(예: 주요 객체, 분위기, 색감 등)을 기반으로 OpenAI GPT API를 활용하여 추천 영화 목록을 생성합니다.
TMDB API를 통해 추천된 영화의 상세 정보(줄거리, 개봉일 등)를 가져와 제공합니다.
유사 포스터 영화 목록 제공:
Google Cloud Vision API를 사용하여 생성된 포스터와 시각적으로 유사한 특징을 가진 영화 포스터들을 TMDB 데이터베이스에서 탐색하고 보여줍니다.
이를 통해 사용자는 생성 포스터의 분위기와 어울리는 다른 영화들을 직관적으로 찾아볼 수 있습니다.
반응형 UI: 다양한 기기에서 최적화된 사용자 경험을 제공합니다.
⚙️ 기술 스택
프론트엔드:
HTML5: 웹 페이지 구조 및 콘텐츠 구성
CSS3: 스타일링 및 반응형 디자인 (index.css, movie_poster_generator.css, movie_similar.css)
JavaScript (ES6+): 동적인 상호작용 및 API 호출 (index.js, movie_poster_generator.js, movie_similar.js)
API 연동:
OpenAI DALL-E 3 API: 텍스트 프롬프트 기반 이미지 생성
OpenAI GPT API: 이미지 특징 기반 영화 추천 로직 (텍스트 응답 생성)
The Movie Database (TMDB) API: 영화 정보(줄거리, 개봉일, 포스터 등) 및 영화 트레일러 정보 조회
Google Cloud Vision API: 생성된 포스터 이미지의 시각적 특징 분석 (객체 감지, 라벨링 등)
Google Cloud Translate API: 필요한 경우 텍스트 번역 기능 (사용자 입력 프롬프트나 API 응답 등)
🚀 실행 방법
본 프로젝트는 별도의 백엔드 서버 없이 프론트엔드 파일만으로 실행 가능합니다.

API 키 설정:
movie_poster_generator.js 및 movie_similar.js 파일 내에 다음 API 키들을 발급받아 각 변수에 할당해야 합니다.
tmdbApiKey
visionApiKey
gptApiKey (OpenAI API Key)
translateApiKey
⚠️ 중요: API 키는 보안에 민감한 정보이므로, 실제 서비스 배포 시에는 반드시 백엔드 서버를 통해 안전하게 관리해야 합니다. 본 프로젝트는 개인 학습 및 포트폴리오 목적으로 프론트엔드에서 직접 키를 사용하고 있습니다.

레포지토리 클론:
Bash

git clone [본인 레포지토리 주소]
cd [레포지토리 폴더명]
웹 페이지 열기:
웹 브라우저에서 index.html 파일을 엽니다. (또는 movie_poster_generator.html 파일부터 직접 시작할 수도 있습니다.)
라이브 서버 확장 기능(예: VS Code의 Live Server)을 사용하면 더욱 편리하게 개발할 수 있습니다.

🖼️ 사용 방법
메인 페이지(index.html)에서 "나만의 AI 포스터 생성" 버튼을 클릭하여 포스터 생성 페이지(movie_poster_generator.html)로 이동합니다.
입력창에 **그려지고 싶은 영화 포스터에 대한 상세한 텍스트 설명(프롬프트)**을 한국어나 영어로 입력합니다. (예: "밤하늘 아래 고층 빌딩 숲, 그 사이로 빛나는 유성우가 쏟아지는 장면의 SF 영화 포스터", "오래된 탐정 사무실에서 고뇌하는 탐정의 느와르 영화 포스터, 흑백")
"포스터 생성" 버튼을 클릭합니다. 잠시 기다리면 DALL-E 3가 생성한 포스터 이미지가 화면에 나타납니다.
생성된 포스터를 클릭하면 "추천 영화" 및 "유사 이미지 영화" 목록을 볼 수 있는 페이지(movie_similar.html)로 이동합니다.
추천된 영화와 유사 이미지 영화 목록을 탐색하며 새로운 영화들을 발견해 보세요!