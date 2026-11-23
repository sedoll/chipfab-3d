// CPU — 로직 공정(FinFET + 다층 배선)은 logic.js 를 GPU 와 공유하고, 패키징만 다릅니다.
import { box, cyl, sph, G, R } from '../lib.js';
import { waferSteps, dicing } from './common.js';
import { logicBlock, logicCam, logicSteps } from './logic.js';

const COLOR = '#3fa7a0';

const flipChip = {
  ph: '패키징', t: '플립칩 접합', cam: [[10, 8.5, 11.5], [0, 0.7, 0]],
  d: '다이를 뒤집어 범프가 기판의 패드에 닿도록 올린 뒤 가열해 한꺼번에 접합합니다 (플립칩). 틈은 언더필 수지로 채워 열 변형에 의한 균열을 막습니다. 기판 주변에는 전원을 안정화하는 디커플링 커패시터가 붙습니다.',
  del: ['wafer'],
  add: G('pkg', [
    box('sub', [-4, 4], [0, 0.3], [-4, 4], 'pcb', { n: '패키지 기판 (유기 기판)' }),
    box('under', [-2.6, 2.6], [0.3, 0.5], [-2.6, 2.6], 'mold', { o: 0.4, n: '언더필 수지' }),
    ...R(36, (i) => sph(`b.${i}`, -2.0 + (i % 6) * 0.8, 0.4, -2.0 + Math.floor(i / 6) * 0.8, 0.14, 'solder', { n: '솔더 범프', dl: i * 0.02 })),
    box('die', [-2.4, 2.4], [0.5, 0.9], [-2.4, 2.4], COLOR, { n: 'CPU 다이', dl: 0.5 }),
    ...R(10, (i) => box(`dc.${i}`, [i % 2 ? 3.2 : -3.6, i % 2 ? 3.6 : -3.2], [0.3, 0.5], [-2.4 + Math.floor(i / 2) * 1.2 - 0.2, -2.4 + Math.floor(i / 2) * 1.2 + 0.2], 'chip', { n: '디커플링 커패시터', dl: 0.8 })),
  ]),
};

const lid = {
  ph: '패키징', t: '히트 스프레더(IHS) 덮개', cam: [[9, 5, 11], [0, 0.7, 0]],
  d: '다이 위에 열전도 물질(TIM)을 바르고 금속 덮개(IHS)를 씌웁니다. 다이에서 나온 열이 덮개로 퍼져 쿨러로 전달됩니다. 기판 아래에는 메인보드 소켓에 닿는 금색 단자(LGA)가 있어 이 모양이 우리가 아는 CPU입니다.',
  add: G('pkg', [
    box('tim', [-2.4, 2.4], [0.9, 1.0], [-2.4, 2.4], '#9aa4b8', { n: 'TIM (열전도 물질)' }),
    box('ihs', [-3.5, 3.5], [1.0, 1.35], [-3.5, 3.5], '#c7ced9', { n: 'IHS (금속 덮개)', mt: 1, o: 0.9, dl: 0.3 }),
    ...[[-3.5, -3.25, -3.5, 3.5], [3.25, 3.5, -3.5, 3.5], [-3.25, 3.25, -3.5, -3.25], [-3.25, 3.25, 3.25, 3.5]].map(([a, b, c, d], i) => box(`w.${i}`, [a, b], [0.3, 1.0], [c, d], '#c7ced9', { mt: 1, o: 0.6 })),
    ...R(64, (i) => box(`lga.${i}`, [-3.2 + (i % 8) * 0.9, -2.8 + (i % 8) * 0.9], [-0.06, 0], [-3.2 + Math.floor(i / 8) * 0.9, -2.8 + Math.floor(i / 8) * 0.9], 'gold', { n: 'LGA 금 단자', dl: 0.6 })),
  ]),
};

export default {
  id: 'cpu', name: 'CPU', sub: '로직 · 프로세서', cat: '로직', kw: 'processor 프로세서 중앙처리장치 finfet 트랜지스터 logic 로직',
  about: '명령어를 해석하고 계산하는 로직 반도체. 수십억 개의 FinFET 트랜지스터와 10층 이상의 구리 배선으로 이루어집니다.',
  steps: [
    ...waferSteps(COLOR, logicBlock, logicCam),
    ...logicSteps(),
    dicing(COLOR), flipChip, lid,
  ],
};
