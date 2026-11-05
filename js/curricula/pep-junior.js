import { chapter, queued, ready, section } from './helpers.js';

const R = ready;
const Q = queued;
const S = section;

/**
 * PEP junior, the long-used grade 8 chapter order (2011 curriculum edition).
 * The 2024 PEP reprint is not this tree. Shared simulations are the Shanghai
 * engines; only the chapter order changes.
 */
export const pepJunior = {
  id: 'pep-junior',
  region: 'pep',
  stage: 'junior',
  tocConfidence: 'grade8-2011-order',
  title: { zh: '人教版初中物理', en: 'PEP junior physics' },
  edition: {
    zh: '人教版八年级上下册常用目录（2011 课标版顺序）。2024 新版目录尚未映射。',
    en: 'Common PEP grade 8 order (2011 standards). The 2024 reprint is not mapped yet.',
  },
  volumes: [
    { id: 'g8a', zh: '八年级上册', en: 'Grade 8, book 1' },
    { id: 'g8b', zh: '八年级下册', en: 'Grade 8, book 2' },
  ],
  chapters: [
    chapter('pep-1', 'g8a', '机械运动', 'Mechanical motion', [
      S('pep-1-1', '长度和时间的测量', 'Length and time', [Q('pep-1-1a', '刻度尺与停表', 'Ruler and stopwatch', '读数。', 'Readings.')]),
      S('pep-1-2', '运动的描述', 'Describing motion', [Q('pep-1-2a', '参照物', 'Reference frame', '同一运动，不同参照物。', 'One motion, two frames.')]),
      S('pep-1-3', '运动的快慢', 'Speed', [Q('pep-1-3a', '速度', 'Speed', 'v = s/t。', 'v = s/t.')]),
      S('pep-1-4', '测量平均速度', 'Average speed', [Q('pep-1-4a', '平均速度', 'Average speed', '路程除以时间。', 'Distance over time.')]),
    ]),
    chapter('pep-2', 'g8a', '声现象', 'Sound', [
      S('pep-2-1', '声音的产生与传播', 'Making sound', [Q('pep-2-1a', '振动', 'Vibration', '介质中的波。', 'A wave in a medium.')]),
      S('pep-2-2', '声音的特性', 'Qualities of sound', [Q('pep-2-2a', '音调响度音色', 'Pitch and loudness', '频率与振幅。', 'Frequency and amplitude.')]),
      S('pep-2-3', '声的利用', 'Using sound', [Q('pep-2-3a', '超声', 'Ultrasound', '反射测距。', 'Ranging by reflection.')]),
      S('pep-2-4', '噪声的危害和控制', 'Noise', [Q('pep-2-4a', '控制噪声', 'Controlling noise', '声源、传播、人耳三处。', 'Source, path, and ear.')]),
    ]),
    chapter('pep-3', 'g8a', '物态变化', 'Changes of state', [
      S('pep-3-1', '温度', 'Temperature', [Q('pep-3-1a', '温度计', 'Thermometer', '读数。', 'The reading.')]),
      S('pep-3-2', '熔化和凝固', 'Melting', [Q('pep-3-2a', '熔化图像', 'Melting curve', '晶体的平台。', 'The crystal plateau.')]),
      S('pep-3-3', '汽化和液化', 'Boiling', [Q('pep-3-3a', '沸腾', 'Boiling', '沸点与沸腾条件。', 'The boiling point and the conditions.')]),
      S('pep-3-4', '升华和凝华', 'Sublimation', [Q('pep-3-4a', '升华', 'Sublimation', '固气直接变化。', 'Solid and gas, directly.')]),
    ]),
    chapter('pep-4', 'g8a', '光现象', 'Light', [
      S('pep-4-1', '光的直线传播', 'Rectilinear propagation', [
        R('pep-4-1a', 'pinhole', '小孔成像', 'Pinhole',
          '像高 = 物高 × 屏距 / 物距。',
          'Image height = object height × screen distance / object distance.',
          { H: 8, u: 20, v: 15, d: 0.4 }),
      ]),
      S('pep-4-2', '光的反射', 'Reflection', [
        R('pep-4-2a', 'reflection', '反射定律', 'Reflection',
          '反射角等于入射角，都从法线量。',
          'The angles from the normal are equal.',
          { theta: 40 }),
      ]),
      S('pep-4-3', '平面镜成像', 'Plane mirror', [
        R('pep-4-3a', 'plane-mirror', '平面镜', 'Plane mirror',
          '像距等于物距。',
          'Image distance equals object distance.',
          { d: 12, h: 8 }),
      ]),
      S('pep-4-4', '光的折射', 'Refraction', [
        R('pep-4-4a', 'refraction', '折射', 'Refraction',
          'n1 sin θ1 = n2 sin θ2。',
          'n1 sin θ1 = n2 sin θ2.',
          { theta: 35, n1: 1, n2: 1.5 }),
      ]),
      S('pep-4-5', '光的色散', 'Dispersion', [
        Q('pep-4-5a', '色散', 'Dispersion', '不同频率的折射率不同。', 'Index depends on frequency.'),
      ]),
    ], true),
    chapter('pep-5', 'g8a', '透镜及其应用', 'Lenses', [
      S('pep-5-1', '透镜', 'Lenses', [Q('pep-5-1a', '会聚与发散', 'Converging and diverging', '焦距的正负。', 'The sign of the focal length.')]),
      S('pep-5-2', '生活中的透镜', 'Lenses in daily life', [Q('pep-5-2a', '放大镜与照相机', 'Magnifier and camera', 'u 与 f 的比较。', 'Comparing u with f.')]),
      S('pep-5-3', '凸透镜成像的规律', 'Convex-lens rules', [
        R('pep-5-3a', 'convex-lens', '凸透镜成像', 'Convex lens',
          '1/u + 1/v = 1/f。拖动蜡烛和光屏。',
          '1/u + 1/v = 1/f. Drag the candle and the screen.',
          { u: 30, f: 10, h: 6, screen: 15, aperture: 2 }, true),
      ]),
      S('pep-5-4', '眼睛和眼镜', 'Eyes and glasses', [
        R('pep-5-4a', 'vision', '眼睛和眼镜', 'Eyes and glasses',
          '近视凹透镜，远视凸透镜。',
          'Diverging for myopia, converging for hyperopia.',
          { mode: 'myopia', farCm: 50, objectCm: 800, readingCm: 25, nearCm: 100 }),
      ]),
      S('pep-5-5', '显微镜和望远镜', 'Microscope and telescope', [
        Q('pep-5-5a', '两个透镜', 'Two lenses', '物镜和目镜的焦距组合。', 'Objective and eyepiece focal lengths.'),
      ]),
    ], true),
    chapter('pep-6', 'g8b', '质量与密度', 'Mass and density', [
      S('pep-6-1', '质量', 'Mass', [Q('pep-6-1a', '天平', 'Balance', '质量是物体的属性。', 'Mass is a property of the object.')]),
      S('pep-6-2', '密度', 'Density', [
        R('pep-6-2a', 'density', '密度', 'Density',
          'ρ = m/V。',
          'ρ = m/V.',
          { material: 'iron', V: 0.001, rho: 7900 }),
      ]),
      S('pep-6-3', '测量物质的密度', 'Measuring density', [
        R('pep-6-3a', 'density-lab', '测量密度', 'Measuring density',
          'ρ = m / (V2 − V1)。',
          'ρ = m / (V2 − V1).',
          { material: 'aluminium', rho: 2700, V: 20, V1: 40 }, true),
      ]),
      S('pep-6-4', '密度与社会生活', 'Density in daily life', [Q('pep-6-4a', '密度的应用', 'Using density', '由 ρ 与 V 求 m。', 'Mass from ρ and V.')]),
    ]),
    chapter('pep-7', 'g8b', '力', 'Force', [
      S('pep-7-1', '力', 'Force', [
        R('pep-7-1a', 'force-elements', '力', 'Force',
          '大小、方向、作用点。',
          'Magnitude, direction, point of application.',
          { F: 8, theta: 60, s: 0.4 }),
      ]),
      S('pep-7-2', '弹力', 'Elastic force', [
        R('pep-7-2a', 'spring-scale', '弹力', 'Hooke’s law',
          'F = kx。',
          'F = kx.',
          { k: 200, x: 0.04, xMax: 0.1 }),
      ]),
      S('pep-7-3', '重力', 'Gravity', [
        R('pep-7-3a', 'gravity', '重力', 'Weight',
          'G = mg。',
          'G = mg.',
          { m: 2, g: 9.8 }),
      ]),
    ]),
    chapter('pep-8', 'g8b', '运动和力', 'Motion and force', [
      S('pep-8-1', '牛顿第一定律', 'Newton’s first law', [
        R('pep-8-1a', 'inertia', '惯性', 'Inertia',
          '挡板让小车停下，木块继续运动。',
          'The stopper halts the cart; the block keeps going.',
          { v0: 1.2, mu: 0.15, g: 9.8, xStop: 1.0 }),
      ]),
      S('pep-8-2', '二力平衡', 'Two-force equilibrium', [
        R('pep-8-2a', 'two-force', '二力平衡', 'Equilibrium',
          '等大、反向、共线、同一物体。',
          'Equal, opposite, collinear, one body.',
          { F1: 6, F2: -6, m: 2, sameBody: true, collinear: true }, true),
      ]),
      S('pep-8-3', '摩擦力', 'Friction', [
        R('pep-8-3a', 'friction', '摩擦力', 'Friction',
          '静摩擦有最大值，滑动摩擦为 μk N。面积不进入公式。',
          'Static friction has a maximum; kinetic friction is μk N. Area is not in the formula.',
          { F: 4, m: 2, g: 9.8, muS: 0.4, muK: 0.3, area: 0.04 }),
      ]),
    ], true),
    chapter('pep-9', 'g8b', '压强', 'Pressure', [
      S('pep-9-1', '压强', 'Pressure', [
        R('pep-9-1a', 'solid-pressure', '压强', 'Pressure',
          'p = F/A。',
          'p = F/A.',
          { F: 20, A: 0.01 }, true),
      ]),
      S('pep-9-2', '液体的压强', 'Pressure in liquids', [
        R('pep-9-2a', 'liquid-pressure', '液体压强', 'Liquid pressure',
          'p = ρgh。',
          'p = ρgh.',
          { view: 'depth', rho: 1000, g: 9.8, h: 0.2, A1: 0.02, A2: 0.008, h1: 0.12, rho2: 800 }, true),
      ]),
      S('pep-9-3', '大气压强', 'Atmosphere', [
        R('pep-9-3a', 'atmosphere', '大气压', 'Atmosphere',
          'h = P / (ρ汞 g)。',
          'h = P / (ρ_Hg g).',
          { P: 1.013e5, g: 9.8, r: 0.1 }),
      ]),
      S('pep-9-4', '流体压强与流速的关系', 'Flow and pressure', [
        R('pep-9-4a', 'bernoulli', '流速与压强', 'Speed and pressure',
          '窄处速度大，压强小。',
          'The narrow part is faster and at lower pressure.',
          { mode: 'pipe', A1: 0.02, A2: 0.008, v1: 2, rho: 1000, P1: 120000, vTop: 30, vBottom: 24, area: 0.4 }),
      ]),
    ], true),
    chapter('pep-10', 'g8b', '浮力', 'Buoyancy', [
      S('pep-10-1', '浮力', 'Buoyant force', [
        R('pep-10-1a', 'buoyancy-origin', '浮力', 'Buoyancy',
          '来自上、下表面的压力差。',
          'It comes from the pressure difference between the bottom and top faces.',
          { a: 0.1, rho: 1000, g: 9.8, hTop: 0.05 }),
        R('pep-10-1b', 'buoyancy-weigh', '称重法', 'Weighing',
          'Fb = G − T。',
          'Fb = G − T.',
          { V: 0.0002, g: 9.8, rhoL: 1000, rhoO: 2700 }),
      ]),
      S('pep-10-2', '阿基米德原理', 'Archimedes', [
        R('pep-10-2a', 'archimedes', '阿基米德原理', 'Archimedes',
          'Fb = ρ液 g V排。',
          'Fb = ρ_liquid g V_disp.',
          { V: 0.0003, frac: 0.6, rho: 1000, g: 9.8 }, true),
      ]),
      S('pep-10-3', '物体的浮沉条件及应用', 'Floating and sinking', [
        R('pep-10-3a', 'float-sink', '浮沉条件', 'Float or sink',
          '比较平均密度与液体密度。',
          'Compare the average density with the liquid.',
          { mode: 'ship', rhoO: 600, rhoL: 1000, V: 1.2, g: 9.8, mass: 800, ballast: 200 }, true),
      ]),
    ], true),
    chapter('pep-11', 'g8b', '功和机械能', 'Work and energy', [
      S('pep-11-1', '功', 'Work', [Q('pep-11-1a', '功', 'Work', 'W = Fs。', 'W = Fs.')]),
      S('pep-11-2', '功率', 'Power', [Q('pep-11-2a', '功率', 'Power', 'P = W/t。', 'P = W/t.')]),
      S('pep-11-3', '动能和势能', 'Kinetic and potential', [Q('pep-11-3a', '两种能量', 'Two energies', '动能与重力势能。', 'Kinetic energy and gravitational potential energy.')]),
      S('pep-11-4', '机械能及其转化', 'Mechanical energy', [Q('pep-11-4a', '转化', 'Conversion', '守恒时两者之和不变。', 'Their sum stays constant when the model conserves it.')]),
    ]),
  ],
};
