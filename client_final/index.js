document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".fade-in"); // 모든 .fade-in 클래스를 가진 요소를 선택
  elements.forEach((el, index) => {
    // 각 요소에 대해 반복
    setTimeout(() => {
      el.classList.add("visible"); // .visible 클래스를 추가하여 애니메이션 시작
    }, index * 100); // 각 요소가 500ms 간격으로 나타나도록 설정
  });
});
