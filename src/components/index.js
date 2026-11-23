// 새 부품 추가 방법: components/<이름>.js 를 만들어 { id, name, sub, cat, kw, about, steps } 를 export 하고
// 아래 목록에 한 줄 추가. cat 이 같은 부품끼리 목록에서 묶이고, kw 는 검색용 키워드입니다.
import dram from './dram.js';
import nand from './nand.js';
import hbm from './hbm.js';
import cpu from './cpu.js';
import gpu from './gpu.js';
import cis from './cis.js';
import led from './led.js';

export const parts = [dram, nand, hbm, cpu, gpu, cis, led];
