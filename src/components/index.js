// 새 부품 추가 방법: components/<이름>.js 를 만들어 { id, name, sub, about, steps } 를 export 하고 아래 목록에 한 줄 추가.
import dram from './dram.js';
import nand from './nand.js';

export const parts = [dram, nand];
export const soon = ['CPU / 로직', 'CMOS 이미지 센서', 'LED']; // 준비 중 표시용
