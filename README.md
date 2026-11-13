# 하나은행 APP 프로토타입

Figma 원본 파일 `[하나은행]프로토타입.fig`의 `app` 페이지를 코드로 1:1 재현한 React 프로토타입입니다.
화면 94개와 Figma 프로토타입 연결을 그대로 옮겼습니다. 화면별 검증 결과는 [VERIFICATION.md](VERIFICATION.md)에 있습니다.

## 화면 규격
- 기준 화면: **390 × 840px** (Figma 프레임 크기)
- PC: 390 × 840 화면을 가운데에 1:1로 표시 (창 높이가 840보다 작으면 비율을 유지한 채 축소)
- 모바일: 기기 너비에 맞춰 같은 비율로 확대/축소, 세로로 긴 화면은 스크롤
- 하단 탭바(홈·자산·상품·투자·메뉴)는 스크롤과 관계없이 화면 하단에 고정
- 상단 헤더는 Figma의 'Sticky' 설정대로 스크롤 시 상단에 붙음
- PC 화면 왼쪽 위에 Figma 플로우 시작점 바로가기 목록이 있어, 어느 화면에서든 다른 플로우로 바로 이동할 수 있음 (모바일에서는 숨김)
- '관리 방법 선택' 화면에서 두 번째·세 번째 카드를 선택한 상태(1:37198, 1:37309)는 Figma 원본의 배경이 흰색으로 남아 있어 흰 글씨가 보이지 않던 부분을, 첫 번째 화면의 선택 카드와 같은 초록 그라데이션으로 표시

## GitHub Pages 배포
빌드된 결과물이 `docs/` 폴더에 들어 있어서 따로 빌드하지 않아도 바로 배포할 수 있습니다.

1. GitHub에서 새 저장소를 만들고 이 폴더의 내용을 전부 올립니다.
2. 저장소 **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**, 폴더: **/docs** → Save
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 열립니다.

주소는 해시 방식(`#/화면ID`)이라 새로고침이나 특정 화면 주소로 바로 들어가도 정상적으로 열립니다.
예: `https://<아이디>.github.io/<저장소이름>/#/1:24140`

## 직접 빌드하기 (소스를 수정했을 때)
```bash
npm install
npm run build   # src/ + public/ → docs/
npm run dev     # http://localhost:8000 에서 미리보기
```

## 구조
```
src/
  main.jsx        React 진입점
  Prototype.jsx   화면 전환, 뒤로가기, 클릭/드래그/시간 지연 인터랙션, 스크롤·고정 영역 처리
  loader.js       화면 데이터 불러오기
  styles.css      스타일
public/
  index.html
  data/manifest.json        화면 목록과 Figma 플로우 시작점
  data/screens/*.json       Figma 프레임별 화면 데이터 (레이어 위치·크기·색·그림자·이미지와 프로토타입 연결)
  data/glyphs.svg           Figma에 저장된 글자 모양 (기기마다 글꼴이 달라지지 않도록 사용)
  img/                      Figma 원본 이미지
docs/                       GitHub Pages 배포용 빌드 결과
```

`data/screens`의 화면 데이터는 Figma 파일에서 레이어 정보를 그대로 읽어 만든 것입니다. 디자인을 수정할 때는 Figma에서 고친 뒤 다시 변환하는 것을 권장합니다.
