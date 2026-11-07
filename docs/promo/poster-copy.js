/** Bilingual poster copy — single source; poster.html fills from here. */
export const LIVE = 'https://otas0.github.io/immspfee-edu/';
export const SHORT = 'otas0.github.io/immspfee-edu';

export const COPY = {
  title: 'IMMSPFEE Education — A4 briefing',
  eyebrow: { en: 'Classroom edition', zh: '课堂版' },
  speakerEyebrow: { en: 'Speaker edition', zh: '讲解员版' },
  hero: {
    en: 'Open a textbook section. Steer the model. Check from the equation.',
    zh: '打开一节教材。操纵模型。按方程判定。',
  },
  phases: [
    { en: 'Introduce', zh: '引入' },
    { en: 'Explore', zh: '探究' },
    { en: 'Check', zh: '判定' },
    { en: 'Debug', zh: '排故' },
  ],
  equation: { en: 'Equation', zh: '方程读数' },
  en: {
    crumb: 'Education · textbook · equation-backed',
    h2: 'One section at a time—readouts and checks from the governing equation',
    try: 'Try',
    steps: [
      'Open the live URL → pick stage / textbook / lesson',
      'Walk Introduce → Explore → Check → Debug',
      'Drag the stage or edit params; answers recompute from physics/',
    ],
    see: 'See it',
    seeBody: 'Classroom shell: chapter tree · canvas stage · parameter bench—no decorative traces, no canned answers.',
    phases: 'Four phases',
    phaseLines: [
      'Introduce — claim and symbols from the section',
      'Explore — steer the model; readouts follow the equation',
      'Check — compare the student path to the governing relation',
      'Debug — wrong overlay marks the broken step, not a canned key',
    ],
    why: 'Why equations',
    whyBody: 'Every ready lesson’s drawing, sticky readout, and check is computed in js/physics/. Queued sections stay empty—no placeholder animation.',
    what: 'What it is',
    whatBody: 'Classroom edition: Shanghai junior/senior, PEP grade 8, and University physics mount equation-backed simulations. The standard lab is a separate repository.',
    open: 'Open',
    openBody: 'Scan or type the short path. Browser entry · briefing use.',
  },
  zh: {
    crumb: '教育版 · 按教材 · 方程驱动',
    h2: '一节一节上——读数与判定都来自方程',
    try: '试用',
    steps: [
      '打开在线地址 → 选学段 / 教材 / 课节',
      '按 引入 → 探究 → 判定 → 排故 走完一节',
      '拖舞台或改参数；答案由 physics/ 方程重算',
    ],
    see: '你会看到',
    seeBody: '课堂三区：章节树 · 舞台 · 参数台——无装饰轨迹，无罐头答案。',
    phases: '四步课',
    phaseLines: [
      '引入 — 本节主张与符号',
      '探究 — 操纵模型；读数跟方程走',
      '判定 — 对照支配关系核对路径',
      '排故 — 错层标出断点，不是罐头答案',
    ],
    why: '为何方程',
    whyBody: '已就绪课节的绘图、粘性读数与判定都由 js/physics/ 计算。仅排队的节舞台保持空白——无占位动画。',
    what: '它是什么',
    whatBody: 'IMMSPFEE Education 是课堂版：沪科初中/高中、人教八年级、大学物理，按教材挂载方程驱动仿真。标准实验室在独立仓库，不是本站。',
    open: '打开',
    openBody: '扫码或手输短路径。浏览器入口 · 讲解用。',
  },
  qrHint: { en: 'scan or type', zh: '扫码或手输' },
};
