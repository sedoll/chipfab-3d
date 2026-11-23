# ChipFab 3D

웨이퍼에서 완성품까지, **반도체가 만들어지는 과정을 3D로 단계별로** 보여주는 오픈소스 웹 사이트입니다.
빌드 과정 없이 정적 파일만으로 동작합니다 (three.js).

> A step-by-step 3D visualization of how semiconductor devices are manufactured. Static site, no build step (three.js via CDN).

## 지금 들어 있는 것

| 분류 | 부품 | 내용 |
|---|---|---|
| 메모리 | **DRAM (RAM)** | 잉곳 → 웨이퍼 → STI → 게이트 → 이온주입 → 커패시터 → 비트라인 → 구리 배선 → 동작 원리 → 패키징 → DIMM |
| 메모리 | **NAND Flash (ROM/SSD)** | 산화막/질화막 적층 → 채널 홀 → ONO 막 → 텅스텐 게이트 교체 → 계단 구조 → 비트라인 → 동작 원리 → M.2 SSD |
| 메모리 | **HBM** | TSV 식각 → 구리 채움 → 박막화 → 8단 적층 → 몰딩 → GPU 옆 인터포저 실장 |
| 로직 | **CPU** | 핀 → STI → 더미 게이트 → 에피 → HKMG → 콘택 → 다층 구리 배선 → 범프 → 플립칩 → IHS |
| 로직 | **GPU** | CPU와 같은 FinFET 공정 + 인터포저/HBM 실장 → 그래픽카드 |
| 센서 | **CMOS 이미지 센서** | DTI → 포토다이오드 → 전송 게이트 → 배선 → 컬러 필터 → 마이크로렌즈 → 카메라 모듈 |
| 광소자 | **LED** | 사파이어 위 GaN 에피(n/MQW/p) → 메사 식각 → 전극 → 형광체 패키지 |

상단의 검색 가능한 선택 박스에서 부품을 고릅니다 (이름·설명·분류·키워드로 검색).

> ⚠️ 학습용으로 **크게 단순화한 모델**입니다. 실제 공정의 치수·순서·구조와 다를 수 있습니다.

## 실행

ES 모듈을 쓰므로 `file://` 로는 열리지 않고, 로컬 서버가 필요합니다.

```bash
python -m http.server 8000   # 또는 npx serve
# http://localhost:8000
```

GitHub Pages: 저장소 *Settings → Pages → Deploy from a branch → main / (root)* 로 바로 배포됩니다.

조작: 마우스 드래그(회전) · 휠(확대) · `←` `→`(단계 이동) · `Space`(자동 재생). 주소 `#nand/7` 처럼 특정 단계를 바로 가리킬 수 있습니다.

## 구조

```
index.html, style.css
src/
  engine.js          선언형 3D 뷰어 (step 0..i 를 재생해 얻은 목표 상태 ↔ 현재 씬을 diff 해서 애니메이션)
  lib.js             파트 생성 헬퍼 (box, cyl, tube, slab, sph, wire) + 재료 팔레트
  main.js            UI
  components/
    index.js         부품 목록 (여기에 한 줄 추가)
    common.js        공통 단계: 웨이퍼 제작, 다이싱, 패키징
    dram.js, nand.js 각 부품
```

## 새 부품 추가하기

1. `src/components/<이름>.js` 를 만들어 아래 형태로 export 합니다.

```js
import { box, cyl, G } from '../lib.js';
import { waferSteps, packageSteps } from './common.js';

export default {
  id: 'cpu', name: 'CPU', sub: '로직', cat: '로직', kw: '검색용 키워드 processor 프로세서', about: '한 줄 소개',
  steps: [
    ...waferSteps('#4f7fd8', blockParts, cameraForBlock),   // 공통 웨이퍼 단계 재사용
    {
      ph: '단계 묶음 이름', t: '단계 제목', d: '설명',
      cam: [[x, y, z], [targetX, targetY, targetZ]],        // 생략하면 이전 카메라 유지
      add: [box('id', [x0, x1], [y0, y1], [z0, z1], 'si')], // 파트 추가 (같은 id 를 다시 add 하면 변경)
      del: ['id 또는 그룹'],                                // 파트/그룹 삭제 (G('그룹', [...]) 로 태그)
      set: { id: { c: '#fff', o: 0.3 } },                   // 색/불투명도 변경
    },
    ...packageSteps('#4f7fd8', 1, '패키지 설명'),
  ],
};
```

2. `src/components/index.js` 의 `parts` 배열에 추가합니다. 끝. (`cat` 이 같은 부품은 선택 박스에서 묶여 보이고, `kw` 는 검색에 쓰입니다.)

별도의 3D 코드 없이 "step 데이터"만 쓰면 되고, 앞/뒤/점프 이동과 애니메이션은 엔진이 알아서 처리합니다.

## 라이선스

[MIT](LICENSE)
