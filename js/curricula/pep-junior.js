import { chapter, ready, section } from './helpers.js';

const R = ready;
const S = section;

/**
 * PEP junior grade 8, 2024 contents (People’s Education Press).
 * 跨学科实践 stays on the tree and is not simulated.
 * Grade 9 is not in this book.
 */
export const pepJunior = {
  id: 'pep-junior',
  region: 'pep',
  stage: 'junior',
  tocConfidence: 'grade8-2024',
  title: { zh: '人教版初中物理', en: 'PEP junior physics' },
  edition: {
    zh: '人教版八年级上下册（2024）。跨学科实践只挂在目录上。九年级尚未映射。',
    en: 'PEP grade 8, both books (2024). Cross-subject practicals stay on the tree. Grade 9 is not mapped.',
  },
  volumes: [
    { id: 'g8a', zh: '八年级上册', en: 'Grade 8, book 1' },
    { id: 'g8b', zh: '八年级下册', en: 'Grade 8, book 2' },
  ],
  chapters: [
    chapter('pep-1', 'g8a', '机械运动', 'Mechanical motion', [
      S('pep-1-1', '长度和时间的测量', 'Length and time', [
        R('pep-1-1a', 'ruler', '刻度尺', 'Ruler',
          '刻度尺读数估到分度值下一位。同一测量方程挂在沪科第 1 章。',
          'Estimate one digit past the division. The same reading equation as Shanghai junior chapter 1.',
          { trueCm: 3.64, division: 0.1 }),
        R('pep-1-1b', 'stopwatch', '停表', 'Stopwatch',
          '停表读累计时间。预设与沪科「停表」课相同。',
          'A stopwatch reads elapsed time. Same preset as Shanghai junior stopwatch.',
          { t: 12.5 }),
      ]),
      S('pep-1-2', '运动的描述', 'Describing motion', [
        R('pep-1-2a', 'frames', '参照物', 'Reference frame',
          '换参照物时，减去参照物相对地面的速度。',
          'Changing the reference subtracts that object’s ground velocity.',
          { frame: 'cart', vCart: 2, vPerson: 0.5, xCart0: 0, xPerson0: 0 }),
      ]),
      S('pep-1-3', '运动的快慢', 'Speed', [
        R('pep-1-3a', 'st-graph', '速度', 'Speed',
          's–t 图上的点对应当前时刻。',
          'The point on the s–t graph is the clock time.',
          { v1: 0.4, v2: 1.2, split: 3 }),
      ]),
      S('pep-1-4', '速度的测量', 'Measuring speed', [
        R('pep-1-4a', 'st-graph', '平均速度', 'Average speed',
          '平均速度是全程位移除以全程时间。',
          'Average speed is the whole displacement over the whole time.',
          { v1: 0.4, v2: 1.2, split: 3 }),
      ]),
    ]),
    chapter('pep-2', 'g8a', '声现象', 'Sound', [
      S('pep-2-1', '声音的产生与传播', 'Making sound', [
        R('pep-2-1a', 'sound-wave', '振动', 'Vibration',
          '音叉与波形都服从 y = A sin(2π f t)。',
          'The fork and the wave both follow y = A sin(2π f t).',
          { f: 256, A: 0.8 }),
      ]),
      S('pep-2-2', '声音的特性', 'Qualities of sound', [
        R('pep-2-2a', 'sound-wave', '音调响度音色', 'Pitch and loudness',
          '只改 f 改音调，只改 A 改响度。',
          'Change only f for pitch, only A for loudness.',
          { f: 440, A: 0.6 }),
      ]),
      S('pep-2-3', '声的利用', 'Using sound', [
        R('pep-2-3a', 'echo-range', '超声', 'Ultrasound',
          '空气中声速取公开值 v = 340 m/s。往返时间 t 给出距离 s = v t / 2。',
          'In air take the public speed v = 340 m/s. Round-trip time t gives s = v t / 2.',
          { t: 0.02, v: 340 }),
      ]),
      S('pep-2-4', '噪声的危害和控制', 'Noise', [
        R('pep-2-4a', 'sound-absorb', '控制噪声', 'Controlling noise',
          '在传播路径上：I = I0 (1−R) e^{−α d}。',
          'On the path: I = I0 (1−R) e^{−α d}.',
          { I0: 1, R: 0.4, alpha: 3, d: 0.3 }),
      ]),
      S('pep-2-5', '跨学科实践：制作隔音房间模型', 'Practical: a model room', [
        R('pep-2-5a', 'sound-absorb', '隔音', 'A quieter room',
          '反射与吸收：I = I0 (1−R) e^{−α d}。不另造分贝曲线。',
          'Reflection and absorption: I = I0 (1−R) e^{−α d}. No invented decibel curve.',
          { I0: 1, R: 0.5, alpha: 2.5, d: 0.5 }),
      ]),
    ]),
    chapter('pep-3', 'g8a', '物态变化', 'Changes of state', [
      S('pep-3-1', '温度', 'Temperature', [
        R('pep-3-1a', 'thermometer', '温度计', 'Thermometer',
          '液柱高度随温度线性变化。读数就是温度。',
          'Column height tracks temperature linearly. The reading is the temperature.',
          { T: 37, Tmin: -20, Tmax: 100 }),
      ]),
      S('pep-3-2', '熔化和凝固', 'Melting', [
        R('pep-3-2a', 'melting', '熔化图像', 'Melting curve',
          '晶体的平台段吸热但温度不变。',
          'On a crystal’s plateau, heat is absorbed and the temperature stays put.',
          { m: 0.1, P: 200, cS: 2100, cL: 4200, Lf: 3.34e5, T0: -20, Tm: 0, crystal: true }),
      ]),
      S('pep-3-3', '汽化和液化', 'Boiling', [
        R('pep-3-3a', 'boiling', '沸腾', 'Boiling',
          '恒定功率。温度升到沸点后吸收汽化热，平台段温度不变。',
          'Constant power. After the boiling point, latent heat is absorbed while temperature stays put.',
          { m: 0.1, P: 400, cL: 4200, cV: 2000, Lv: 2.26e6, T0: 20, Tb: 100 }),
      ]),
      S('pep-3-4', '升华和凝华', 'Sublimation', [
        R('pep-3-4a', 'sublimation', '升华', 'Sublimation',
          '固体在升华点直接变为气体，模型里不经过液体。',
          'A solid becomes gas at the sublimation point, with no liquid interval in this model.',
          { m: 0.05, P: 200, cS: 1500, cG: 1000, Ls: 5.9e5, T0: -40, Ts: -20 }),
      ]),
      S('pep-3-5', '跨学科实践：探索厨房中的物态变化问题', 'Practical: the kitchen', [
        R('pep-3-5a', 'boiling', '厨房', 'The kitchen',
          '同一沸腾平台：水在 100 °C 吸热汽化。不另造食谱数据。',
          'The same boiling plateau: water absorbs heat at 100 °C. No invented recipe data.',
          { m: 0.2, P: 600, cL: 4200, cV: 2000, Lv: 2.26e6, T0: 20, Tb: 100 }),
      ]),
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
        R('pep-4-5a', 'refraction', '色散', 'Dispersion',
          '不同频率可对应不同 n。本课用折射定律对照：n1 sin θ1 = n2 sin θ2。',
          'Different frequencies can mean different n. This lesson uses Snell: n1 sin θ1 = n2 sin θ2.',
          { theta: 35, n1: 1, n2: 1.6 }),
      ]),
    ], true),
    chapter('pep-5', 'g8a', '透镜及其应用', 'Lenses', [
      S('pep-5-1', '透镜', 'Lenses', [
        R('pep-5-1a', 'convex-lens', '会聚与发散', 'Converging and diverging',
          '凸透镜 f > 0。1/u + 1/v = 1/f。',
          'A converging lens has f > 0. 1/u + 1/v = 1/f.',
          { u: 40, f: 10, h: 6, screen: 13.3, aperture: 2 }),
      ]),
      S('pep-5-2', '生活中的透镜', 'Lenses in daily life', [
        R('pep-5-2a', 'convex-lens', '放大镜与照相机', 'Magnifier and camera',
          'u < f 成正立放大虚像（放大镜）；u > 2f 成倒立缩小实像（照相机）。',
          'u < f gives an erect magnified virtual image (magnifier); u > 2f gives an inverted diminished real image (camera).',
          { u: 8, f: 10, h: 4, screen: 20, aperture: 2 }),
      ]),
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
      S('pep-5-5', '跨学科实践：制作望远镜', 'Practical: a telescope', [
        R('pep-5-5a', 'telescope', '望远镜', 'A telescope',
          '天文望远镜（无焦）：角放大率 M ≈ −f_obj / f_eye，镜筒约 f_obj + f_eye。',
          'Astronomical telescope (afocal): angular magnification M ≈ −f_obj / f_eye, tube ≈ f_obj + f_eye.',
          { fObj: 50, fEye: 5 }),
      ]),
    ], true),
    chapter('pep-6', 'g8a', '质量与密度', 'Mass and density', [
      S('pep-6-1', '质量', 'Mass', [
        R('pep-6-1a', 'balance', '天平', 'Balance',
          '天平平衡时 m_object = m_weights + m_rider。质量是物体的属性。',
          'Balance when m_object = m_weights + m_rider. Mass is a property of the object.',
          { object: 52.4, weights: 50, rider: 2.4 }),
      ]),
      S('pep-6-2', '密度', 'Density', [
        R('pep-6-2a', 'density', '密度', 'Density',
          'ρ = m/V。',
          'ρ = m/V.',
          { material: 'iron', V: 0.001, rho: 7900 }),
      ]),
      S('pep-6-3', '测量液体和固体的密度', 'Measuring density', [
        R('pep-6-3a', 'density-lab', '测量密度', 'Measuring density',
          'ρ = m / (V2 − V1)。',
          'ρ = m / (V2 − V1).',
          { material: 'aluminium', rho: 2700, V: 20, V1: 40 }, true),
      ]),
      S('pep-6-4', '密度的应用', 'Using density', [
        R('pep-6-4a', 'density', '密度的应用', 'Using density',
          '由 ρ 与 V 求 m = ρ V。',
          'Mass from ρ and V: m = ρ V.',
          { material: 'water', V: 0.002, rho: 1000 }),
      ]),
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
      S('pep-8-4', '同一直线上二力的合成', 'Collinear resultant', [
        R('pep-8-4a', 'force-compose', '二力合成', 'Resultant',
          '向右为正。合力是 F1 + F2，不是两个绝对值相加。',
          'Right is positive. The resultant is F1 + F2, not the sum of the absolute values.',
          { F1: 6, F2: -4 }),
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
      S('pep-9-4', '跨学科实践：制作简易活塞式抽水机', 'Practical: a lift pump', [
        R('pep-9-4a', 'atmosphere', '抽水机', 'A lift pump',
          '大气压把水托起。托里拆利高度 h = P / (ρ g)。这里不另做一台机器。',
          'Air pressure lifts the water. Torricelli height h = P / (ρ g). This section does not add a machine.',
          { P: 1.013e5, g: 9.8, r: 0.1 }),
      ]),
      S('pep-9-5', '流体压强与流速的关系', 'Flow and pressure', [
        R('pep-9-5a', 'bernoulli', '流速与压强', 'Speed and pressure',
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
      S('pep-10-4', '跨学科实践：制作微型密度计', 'Practical: a hydrometer', [
        R('pep-10-4a', 'float-sink', '密度计', 'A hydrometer',
          '漂浮时排开的液体重等于自重。改密度看浸入份额。',
          'A floating object displaces a weight equal to its own. Change density to see the immersed fraction.',
          { mode: 'solid', rhoO: 600, rhoL: 1000, V: 0.002, g: 9.8, mass: 0, ballast: 0 }),
      ]),
    ], true),
    chapter('pep-11', 'g8b', '功和机械能', 'Work and energy', [
      S('pep-11-1', '功', 'Work', [
        R('pep-11-1a', 'work', '功', 'Work',
          'W = F s cosθ。',
          'W = F s cosθ.',
          { F: 10, s: 2, theta: 60, t: 4 }),
      ]),
      S('pep-11-2', '功率', 'Power', [
        R('pep-11-2a', 'work', '功率', 'Power',
          'P = W / t。',
          'P = W / t.',
          { F: 10, s: 2, theta: 60, t: 4 }),
      ]),
      S('pep-11-3', '动能和势能', 'Kinetic and potential', [
        R('pep-11-3a', 'energy', '两种能量', 'Two energies',
          '动能与重力势能随位置交换。',
          'Kinetic energy and gravitational potential trade places as the object moves.',
          { m: 1, g: 9.8, H: 1.2, alpha: 30, mu: 0 }),
      ]),
      S('pep-11-4', '机械能及其转化', 'Mechanical energy', [
        R('pep-11-4a', 'energy', '转化', 'Conversion',
          'μ = 0 时两者之和等于 mgH。',
          'With μ = 0 their sum stays at mgH.',
          { m: 1, g: 9.8, H: 1.2, alpha: 30, mu: 0 }),
      ]),
    ]),
    chapter('pep-12', 'g8b', '简单机械', 'Simple machines', [
      S('pep-12-1', '杠杆', 'Levers', [
        R('pep-12-1a', 'lever', '杠杆', 'Lever',
          'F1 L1 = F2 L2。',
          'F1 L1 = F2 L2.',
          { F1: 4, L1: 0.3, F2: 6, L2: 0.2 }, true),
      ]),
      S('pep-12-2', '跨学科实践：制作简易杆秤', 'Practical: a steelyard', [
        R('pep-12-2a', 'lever', '杆秤', 'A steelyard',
          '仍是杠杆平衡 F1 L1 = F2 L2。不另做一把秤。',
          'Still the lever rule F1 L1 = F2 L2. This section does not add a scale.',
          { F1: 2, L1: 0.4, F2: 4, L2: 0.2 }),
      ]),
      S('pep-12-3', '滑轮', 'Pulleys', [
        R('pep-12-3a', 'pulley', '滑轮', 'Pulley',
          '绳端距离是重物上升距离的 n 倍。',
          'The rope end moves n times as far as the load.',
          { n: 3, G: 12, Gp: 3, s: 0.6 }),
      ]),
      S('pep-12-4', '机械效率', 'Efficiency', [
        R('pep-12-4a', 'pulley', '机械效率', 'Efficiency',
          'η = Gh / (F s)。',
          'η = Gh / (F s).',
          { n: 3, G: 12, Gp: 3, s: 0.6 }, true),
      ]),
    ], true),
  ],
};

