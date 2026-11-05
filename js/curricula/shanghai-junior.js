import { chapter, queued, ready, section } from './helpers.js';

const R = ready;
const Q = queued;
const S = section;
const C = chapter;

/** 沪科版五四制 2024, 上海科学技术出版社. Section titles follow the published contents. */
export const shanghaiJunior = {
  id: 'sh-junior',
  region: 'shanghai',
  stage: 'junior',
  title: { zh: '上海初中物理', en: 'Shanghai junior physics' },
  edition: {
    zh: '沪科版五四制（2024）· 上海科学技术出版社',
    en: 'Huke 5–4 system (2024), Shanghai Science and Technology Publishers',
  },
  volumes: [
    { id: 'g8v1', zh: '八年级上册', en: 'Grade 8, book 1' },
    { id: 'g8v2', zh: '八年级下册', en: 'Grade 8, book 2' },
    { id: 'g9v1', zh: '九年级上册', en: 'Grade 9, book 1' },
    { id: 'g9v2', zh: '九年级下册', en: 'Grade 9, book 2' },
  ],
  chapters: [
    C('shj-1', 'g8v1', '测量', 'Measurement', [
      S('shj-1-1', '长度的测量', 'Measuring length', [
        Q('shj-1-1a', '刻度尺读数', 'Ruler reading', '估读到分度值的下一位。', 'Estimate one place past the division.'),
      ]),
      S('shj-1-2', '时间的测量', 'Measuring time', [
        Q('shj-1-2a', '停表', 'Stopwatch', '读数来自指针位置。', 'The reading is the hand position.'),
      ]),
      S('shj-1-3', '质量的测量', 'Measuring mass', [
        Q('shj-1-3a', '天平', 'Balance', '左物右码，游码读数计入总质量。', 'Object and weights; rider included in the mass.'),
      ]),
    ]),
    C('shj-2', 'g8v1', '机械运动', 'Mechanical motion', [
      S('shj-2-1', '运动与静止', 'Motion and rest', [
        Q('shj-2-1a', '参照物', 'Reference frames', '同一运动相对不同参照物。', 'One motion, two reference objects.'),
      ]),
      S('shj-2-2', '运动的快慢', 'How fast', [
        Q('shj-2-2a', 's–t 图像', 's–t graph', '位移由运动方程给出，并在图上标出对应点。', 'Displacement from the motion equation, marked on the graph.'),
      ]),
      S('shj-2-3', '速度的测量', 'Measuring speed', [
        Q('shj-2-3a', '平均速度', 'Average speed', 'v = s/t。', 'v = s/t.'),
      ]),
    ]),
    C('shj-3', 'g8v1', '声现象', 'Sound', [
      S('shj-3-1', '声音的产生和传播', 'Making and carrying sound', [
        Q('shj-3-1a', '振动与波形', 'Vibration and waveform', '介质中的纵波。', 'A longitudinal wave in a medium.'),
      ]),
      S('shj-3-2', '声音的特性', 'Pitch, loudness, timbre', [
        Q('shj-3-2a', '音调响度音色', 'Pitch, loudness, timbre', '频率、振幅、波形。', 'Frequency, amplitude, waveform.'),
      ]),
      S('shj-3-3', '声波的应用和控制', 'Using and controlling sound', [
        Q('shj-3-3a', '隔声与吸声', 'Blocking and absorbing', '反射与吸收，不另造分贝曲线。', 'Reflection and absorption, no invented decibel curve.'),
      ]),
    ]),
    C('shj-4', 'g8v1', '光现象', 'Light', [
      S('shj-4-0', '章首 · 光的直线传播', 'Opening · rectilinear propagation', [
        R('shj-4-0a', 'pinhole', '小孔成像', 'Pinhole image',
          '孔很小的时候，物和像由相似三角形联系：像高 = 物高 × 屏距 / 物距，像是倒立的。拖动物和屏。',
          'For a small hole the image and object are similar triangles: image height = object height × screen distance / object distance, and the image is inverted. Drag the object and the screen.',
          { H: 8, u: 20, v: 15, d: 0.4 }),
      ]),
      S('shj-4-1', '光的反射', 'Reflection of light', [
        R('shj-4-1a', 'reflection', '反射定律', 'Law of reflection',
          '入射角和反射角都从法线量起，两者相等。拖动入射光线。',
          'Both angles are measured from the normal, and they are equal. Drag the incoming ray.',
          { theta: 40 }),
      ]),
      S('shj-4-2', '平面镜成像', 'Plane-mirror image', [
        R('shj-4-2a', 'plane-mirror', '物像对称', 'Object and image',
          '像和物到镜面的距离相等，大小相等，是虚像。字母 F 按镜面反射过去，所以左右相反。',
          'The image is as far behind the mirror as the object is in front, the same size, and virtual. The letter F is reflected in the mirror, so it is laterally reversed.',
          { d: 12, h: 8 }),
      ]),
      S('shj-4-3', '光的折射', 'Refraction', [
        R('shj-4-3a', 'refraction', '折射定律', 'Snell’s law',
          'n1 sin θ1 = n2 sin θ2。把光从玻璃射向空气并加大入射角，可以看到全反射。',
          'n1 sin θ1 = n2 sin θ2. Send the ray from glass into air and increase the angle to see total internal reflection.',
          { theta: 35, n1: 1, n2: 1.5 }),
      ]),
      S('shj-4-4', '凸透镜成像', 'Convex-lens image', [
        R('shj-4-4a', 'convex-lens', '物距、像距与光屏', 'Object, image, and screen',
          '薄透镜：1/u + 1/v = 1/f。拖动蜡烛改变物距，拖动光屏去接实像。u < f 时另一侧没有实像。',
          'Thin lens: 1/u + 1/v = 1/f. Drag the candle to change u, and drag the screen onto a real image. When u < f there is no real image on the far side.',
          { u: 30, f: 10, h: 6, screen: 15, aperture: 2 }, true),
      ]),
      S('shj-4-5', '透镜的应用', 'Uses of lenses', [
        R('shj-4-5a', 'vision', '近视与远视', 'Myopia and hyperopia',
          '近视用凹透镜，把远处物体的像成在远点上。远视用凸透镜，把阅读距离上的物体成在近点上。',
          'Myopia uses a diverging lens that images a distant object at the far point. Hyperopia uses a converging lens that images a reading-distance object at the near point.',
          { mode: 'myopia', farCm: 50, objectCm: 800, readingCm: 25, nearCm: 100 }),
      ]),
    ], true),
    C('shj-5', 'g8v1', '运动和力', 'Motion and force', [
      S('shj-5-1', '力', 'Force', [
        R('shj-5-1a', 'force-elements', '力的三要素', 'Three elements of a force',
          '力的大小、方向和作用点都会影响力矩。拖箭头改大小和方向，拖作用点沿杆移动。力矩 τ = s F sinθ。',
          'Magnitude, direction, and point of application all affect the moment. Drag the arrowhead for size and direction, and drag the point along the bar. τ = s F sinθ.',
          { F: 8, theta: 60, s: 0.4 }),
      ]),
      S('shj-5-2', '弹力 重力', 'Elastic force and gravity', [
        R('shj-5-2a', 'spring-scale', '弹簧测力计', 'Spring scale',
          '在弹性限度内 F = kx。超过限度后，这个模型不再给出力。向下拖挂钩。',
          'Inside the elastic limit, F = kx. Past the limit this model stops giving a force. Drag the hook downward.',
          { k: 200, x: 0.04, xMax: 0.1 }),
        R('shj-5-2b', 'gravity', '重力', 'Weight',
          'G = mg。质量不变，换一个 g，重力改变。地球 9.80、月球 1.62、火星 3.71 是课堂上用的表面重力加速度。',
          'G = mg. The mass stays the same when g changes, and the weight changes. 9.80, 1.62 and 3.71 m/s² are the surface values used in class for Earth, the Moon and Mars.',
          { m: 2, g: 9.8 }),
      ]),
      S('shj-5-3', '二力合成 二力平衡', 'Resultant and equilibrium', [
        R('shj-5-3a', 'force-compose', '同一直线上的二力合成', 'Collinear resultant',
          '向右为正。合力 Fnet = F1 + F2。方向相反时不能把绝对值相加。',
          'Right is positive. The resultant is Fnet = F1 + F2. Opposite forces are not added as absolute values.',
          { F1: 6, F2: -4 }),
        R('shj-5-3b', 'two-force', '二力平衡', 'Two-force equilibrium',
          '平衡要四个条件同时成立：同一物体、大小相等、方向相反、同一直线。作用在两个物体上的是相互作用，不是平衡条件。',
          'Equilibrium needs all four: one body, equal magnitudes, opposite directions, one line. Forces on two bodies are an interaction pair, not the equilibrium condition.',
          { F1: 6, F2: -6, m: 2, sameBody: true, collinear: true }, true),
      ]),
      S('shj-5-4', '摩擦力', 'Friction', [
        R('shj-5-4a', 'friction', '滑动摩擦与静摩擦', 'Kinetic and static friction',
          '水平面上 N = mg。拉力不超过 μs N 时物体静止，摩擦力与拉力平衡；超过之后滑动摩擦力大小是 μk N。接触面积不进入这个公式。',
          'On a horizontal surface N = mg. The block stays at rest while the pull is within μs N, and friction matches the pull. Beyond that, kinetic friction has magnitude μk N. Contact area is not in the formula.',
          { F: 4, m: 2, g: 9.8, muS: 0.4, muK: 0.3, area: 0.04 }),
      ]),
      S('shj-5-5', '牛顿第一定律', 'Newton’s first law', [
        R('shj-5-5a', 'inertia', '小车与木块', 'Cart and block',
          '小车碰到挡板后速度变为 0。木块以 a = −μg 继续滑行。把 μ 调到 0，木块保持 v0。',
          'The cart velocity becomes 0 at the stopper. The block then slides with a = −μg. Set μ to 0 and the block keeps v0.',
          { v0: 1.2, mu: 0.15, g: 9.8, xStop: 1.0 }),
      ]),
    ], true),
    C('shj-6', 'g8v2', '密度与压强', 'Density and pressure', [
      S('shj-6-1', '物质的密度', 'Density', [
        R('shj-6-1a', 'density', '同体积比质量', 'Same volume, different mass',
          'ρ = m/V。体积固定，换物质就换质量。表中的密度是初中常用的约整数。',
          'ρ = m/V. With the volume fixed, changing the material changes the mass. The table densities are the rounded values used in junior classes.',
          { material: 'iron', V: 0.001, rho: 7900 }),
      ]),
      S('shj-6-2', '固体、液体密度的测量', 'Measuring density', [
        R('shj-6-2a', 'density-lab', '天平与量筒', 'Balance and cylinder',
          '天平读数 m = ρV。量筒里 V2 = V1 + V，所以 ρ = m / (V2 − V1)。',
          'The balance reads m = ρV. In the cylinder V2 = V1 + V, so ρ = m / (V2 − V1).',
          { material: 'aluminium', rho: 2700, V: 20, V1: 40 }, true),
      ]),
      S('shj-6-3', '压力与压强', 'Force and pressure', [
        R('shj-6-3a', 'solid-pressure', '受力面积', 'Contact area',
          'p = F/A。压力不变时，把接触面缩小，压强变大。拖动色块边缘改面积。',
          'p = F/A. With the force fixed, a smaller area means a larger pressure. Drag the edge of the patch to change the area.',
          { F: 20, A: 0.01 }, true),
      ]),
      S('shj-6-4', '液体压强', 'Pressure in a liquid', [
        R('shj-6-4a', 'liquid-pressure', '深度、U 型管与容器底部', 'Depth, U-tube, and the base',
          'p = ρgh。同一深度，容器宽窄不改变压强，底部压力 F = pA 会变。U 型管平衡时 ρ1 h1 = ρ2 h2。',
          'p = ρgh. At one depth the width of the vessel does not change p; the force on the base F = pA does. A U-tube balances when ρ1 h1 = ρ2 h2.',
          { view: 'depth', rho: 1000, g: 9.8, h: 0.2, A1: 0.02, A2: 0.008, h1: 0.12, rho2: 800 }, true),
      ]),
      S('shj-6-5', '大气压强', 'Atmospheric pressure', [
        R('shj-6-5a', 'atmosphere', '托里拆利与马德堡半球', 'Torricelli and Magdeburg',
          '水银柱 h = P / (ρ汞 g)，ρ汞 = 13.6×10³ kg/m³。拉开半球的力是 P·πr²。',
          'The mercury column is h = P / (ρ_Hg g), with ρ_Hg = 13.6×10³ kg/m³. The force to separate a hemisphere is P·πr².',
          { P: 1.013e5, g: 9.8, r: 0.1 }),
      ]),
      S('shj-6-6', '流体压强与流速的关系', 'Flow speed and pressure', [
        R('shj-6-6a', 'bernoulli', '管道与机翼两侧', 'Pipe and a wing',
          '不可压缩时 A1 v1 = A2 v2。水平流线上 P2 = P1 + ½ρ(v1² − v2²)。机翼两侧的速度是输入，不求解流场。',
          'For incompressible flow A1 v1 = A2 v2. On a horizontal streamline P2 = P1 + ½ρ(v1² − v2²). The two wing speeds are inputs; the flow field is not solved.',
          { mode: 'pipe', A1: 0.02, A2: 0.008, v1: 2, rho: 1000, P1: 120000, vTop: 30, vBottom: 24, area: 0.4 }),
      ]),
    ], true),
    C('shj-7', 'g8v2', '浮力', 'Buoyancy', [
      S('shj-7-1', '浮力', 'Buoyant force', [
        R('shj-7-1a', 'buoyancy-origin', '上下表面的压力差', 'Pressure difference',
          '浮力是下表面压力减上表面压力。对这块立方体，它等于 ρgV浸入。上下拖立方体。',
          'Buoyancy is the upward force on the bottom face minus the downward force on the top face. For this cube that equals ρg times the submerged volume. Drag the cube up and down.',
          { a: 0.1, rho: 1000, g: 9.8, hTop: 0.05 }),
        R('shj-7-1b', 'buoyancy-weigh', '称重法', 'Weighing method',
          '弹簧测力计的示数 T = G − Fb。若物体会浮起来，绳子松弛，T = 0，物体不会被吊着完全浸没。',
          'The spring scale reads T = G − Fb. If the object would float, the string goes slack, T = 0, and it is not held fully under.',
          { V: 0.0002, g: 9.8, rhoL: 1000, rhoO: 2700 }, true),
      ]),
      S('shj-7-2', '阿基米德原理', 'Archimedes’ principle', [
        R('shj-7-2a', 'archimedes', '排开的液体', 'Displaced liquid',
          'Fb = ρ液 g V排。拖动浸入比例，溢出杯里的体积跟着变。',
          'Fb = ρ_liquid g V_disp. Drag the submerged fraction; the overflow volume follows.',
          { V: 0.0003, frac: 0.6, rho: 1000, g: 9.8 }, true),
      ]),
      S('shj-7-3', '浮沉的条件及应用', 'Floating, suspending, sinking', [
        R('shj-7-3a', 'float-sink', '实心、轮船与潜艇', 'Solid, ship, and submarine',
          '平均密度小于液体就漂浮，相等就悬浮，大于就沉底。轮船和潜艇用总质量除以船体容积。加大压载水，潜艇下沉。',
          'If the average density is below the liquid it floats, if equal it suspends, if greater it sinks. A ship or submarine uses total mass over hull volume. Add ballast water and the submarine sinks.',
          { mode: 'solid', rhoO: 600, rhoL: 1000, V: 0.002, g: 9.8, mass: 800, ballast: 200 }, true),
      ]),
    ], true),
    C('shj-8', 'g8v2', '简单机械 功和能', 'Machines, work, and energy', [
      S('shj-8-1', '杠杆', 'Levers', [
        Q('shj-8-1a', '杠杆平衡', 'Lever balance', 'F1 L1 = F2 L2。', 'F1 L1 = F2 L2.'),
      ]),
      S('shj-8-2', '滑轮', 'Pulleys', [
        Q('shj-8-2a', '滑轮组', 'Pulley system', '绳子段数、省力和距离。', 'Rope segments, force, and distance.'),
      ]),
      S('shj-8-3', '功与功率', 'Work and power', [
        Q('shj-8-3a', '功和功率', 'Work and power', 'W = Fs cosθ，P = W/t。', 'W = Fs cosθ, P = W/t.'),
      ]),
      S('shj-8-4', '机械能及其转化', 'Mechanical energy', [
        Q('shj-8-4a', '动能与势能', 'Kinetic and potential', '守恒条件下动能与势能之和不变。', 'Kinetic plus potential stays constant when the model conserves it.'),
      ]),
      S('shj-8-5', '机械效率', 'Efficiency', [
        Q('shj-8-5a', '有用功与总功', 'Useful work and total work', 'η = W有用 / W总。', 'η = W_useful / W_total.'),
      ]),
    ]),
    C('shj-9', 'g8v2', '物态变化', 'Changes of state', [
      S('shj-9-1', '温度', 'Temperature', [
        Q('shj-9-1a', '温度计', 'Thermometer', '读数对应温度。', 'The reading is the temperature.'),
      ]),
      S('shj-9-2', '汽化和液化', 'Vaporisation and liquefaction', [
        Q('shj-9-2a', '蒸发与沸腾', 'Evaporation and boiling', '沸点和饱和汽压的公开关系。', 'The public boiling-point and vapour-pressure relations.'),
      ]),
      S('shj-9-3', '熔化和凝固', 'Melting and freezing', [
        Q('shj-9-3a', '熔化图像', 'Melting curve', '晶体平台段温度不变。', 'A crystal’s plateau stays at one temperature.'),
      ]),
      S('shj-9-4', '升华和凝华', 'Sublimation', [
        Q('shj-9-4a', '升华与凝华', 'Sublimation and deposition', '物态直接在固气之间变化。', 'The change is directly between solid and gas.'),
      ]),
    ]),
    C('shj-10', 'g9v1', '内能', 'Internal energy', [
      S('shj-10-1', '热量 比热容', 'Heat and specific heat', [
        R('shj-10-1a', 'specific-heat', '比热容', 'Specific heat',
          '两个样品接受同样的热量 Q = P t。各自升温 ΔT = Q / (c m)。质量相同的时候，比热容小的升得更高。',
          'Both samples receive the same heat Q = P t. Each rise is ΔT = Q / (c m). At the same mass, the smaller specific heat climbs higher.',
          { m1: 0.2, c1: 4200, m2: 0.2, c2: 900, P: 500, T0: 20 }),
      ]),
      S('shj-10-2', '内能', 'Internal energy', [
        Q('shj-10-2a', '改变内能', 'Changing internal energy', '做功和热传递。', 'Work and heating.'),
      ]),
      S('shj-10-3', '热机及其工作原理', 'Heat engines', [
        Q('shj-10-3a', '四冲程', 'Four strokes', '循环和 p–V 图上的功。', 'The cycle and the work on a p–V diagram.'),
      ]),
      S('shj-10-4', '热机的效率', 'Engine efficiency', [
        Q('shj-10-4a', '热机效率', 'Efficiency', 'η = W / Q。', 'η = W / Q.'),
      ]),
    ]),
    C('shj-11', 'g9v1', '静电与电流', 'Charge and current', [
      S('shj-11-1', '简单的静电现象', 'Electrostatics', [
        Q('shj-11-1a', '两种电荷', 'Two kinds of charge', '同种相斥，异种相吸。', 'Like charges repel, unlike charges attract.'),
      ]),
      S('shj-11-2', '电流', 'Current', [
        Q('shj-11-2a', '电流', 'Current', 'I = Q/t。', 'I = Q/t.'),
      ]),
      S('shj-11-3', '电压', 'Voltage', [
        Q('shj-11-3a', '电压', 'Voltage', '电压表并联。', 'A voltmeter is in parallel.'),
      ]),
      S('shj-11-4', '串联电路和并联电路', 'Series and parallel', [
        Q('shj-11-4a', '串并联', 'Series and parallel', '通路、断路、短路。', 'Closed, open, and short circuits.'),
      ]),
      S('shj-11-5', '串联电路和并联电路中电流、电压的特点', 'Current and voltage rules', [
        Q('shj-11-5a', '电流电压分配', 'How I and U split', '串联电流相等，并联电压相等。', 'Series current is shared; parallel voltage is shared.'),
      ]),
    ]),
    C('shj-12', 'g9v1', '欧姆定律', 'Ohm’s law', [
      S('shj-12-1', '电阻 变阻器', 'Resistance', [
        Q('shj-12-1a', '滑动变阻器', 'Rheostat', 'R = ρL/A，滑片改变接入长度。', 'R = ρL/A; the slider changes the length in the circuit.'),
      ]),
      S('shj-12-2', '电流与电压、电阻的关系', 'Current, voltage, resistance', [
        Q('shj-12-2a', '欧姆定律', 'Ohm’s law', 'I = U/R，并画出 I–U 图。', 'I = U/R, with the I–U graph.'),
      ]),
      S('shj-12-3', '电阻的测量', 'Measuring resistance', [
        Q('shj-12-3a', '伏安法', 'Voltmeter–ammeter', 'R = U/I。', 'R = U/I.'),
      ]),
      S('shj-12-4', '电阻的串联和并联', 'Combining resistors', [
        Q('shj-12-4a', '串并联电阻', 'Series and parallel resistors', '串联相加，并联倒数相加。', 'Series adds; parallel adds reciprocals.'),
      ]),
    ]),
    C('shj-13', 'g9v1', '电功率', 'Electric power', [
      S('shj-13-1', '电功', 'Electrical work', [
        Q('shj-13-1a', '电功', 'Electrical work', 'W = UIt。', 'W = UIt.'),
      ]),
      S('shj-13-2', '电功率', 'Electric power', [
        Q('shj-13-2a', '电功率', 'Electric power', 'P = UI。', 'P = UI.'),
      ]),
      S('shj-13-3', '焦耳定律', 'Joule heating', [
        Q('shj-13-3a', '焦耳定律', 'Joule’s law', 'Q = I²Rt。', 'Q = I²Rt.'),
      ]),
      S('shj-13-4', '家庭电路', 'Household circuits', [
        Q('shj-13-4a', '家庭电路', 'Household circuit', '火线、零线、地线，以及短路时的电流。', 'Live, neutral, earth, and the current in a short.'),
      ]),
    ]),
    C('shj-14', 'g9v2', '电与磁', 'Electricity and magnetism', [
      S('shj-14-1', '磁场', 'Magnetic field', [
        Q('shj-14-1a', '磁感线', 'Field lines', '方向和磁极。', 'Direction and poles.'),
      ]),
      S('shj-14-2', '电流的磁场', 'Magnetic field of a current', [
        Q('shj-14-2a', '通电螺线管', 'Solenoid', '右手螺旋定则。', 'The right-hand rule.'),
      ]),
      S('shj-14-3', '通电导线在磁场中受到的作用力', 'Force on a current', [
        Q('shj-14-3a', '磁场对电流的作用', 'Force on a wire', '电动机的转动方向。', 'Which way a motor turns.'),
      ]),
      S('shj-14-4', '电磁感应', 'Electromagnetic induction', [
        Q('shj-14-4a', '感应电流', 'Induced current', '闭合回路磁通量变化。', 'Changing flux in a closed loop.'),
      ]),
    ]),
    C('shj-15', 'g9v2', '电磁波及其应用', 'Electromagnetic waves', [
      S('shj-15-1', '电磁波', 'Electromagnetic waves', [
        Q('shj-15-1a', '电磁波', 'A wave', 'c = fλ。', 'c = fλ.'),
      ]),
      S('shj-15-2', '电磁波的应用', 'Using the waves', [
        Q('shj-15-2a', '应用', 'Uses', '频率与波段的公开对应。', 'The public map from frequency to band.'),
      ]),
    ]),
    C('shj-16', 'g9v2', '从原子到星系', 'From atoms to galaxies', [
      S('shj-16-1', '原子 原子结构', 'Atoms', [
        Q('shj-16-1a', '原子结构', 'Atomic structure', '核式结构的公开教学模型。', 'The public teaching model of the nuclear atom.'),
      ]),
      S('shj-16-2', '地球 太阳系', 'Earth and the solar system', [
        Q('shj-16-2a', '太阳系', 'Solar system', '公转周期与轨道。', 'Orbital period and radius.'),
      ]),
      S('shj-16-3', '银河系 宇宙', 'The Galaxy and the universe', [
        Q('shj-16-3a', '尺度', 'Scales', '数量级，不另造观测数据。', 'Orders of magnitude, no invented observations.'),
      ]),
    ]),
    C('shj-17', 'g9v2', '能量的转移和转化 能源', 'Energy and sources', [
      S('shj-17-1', '能量的转移和转化', 'Transfer and conversion', [
        Q('shj-17-1a', '能量转化', 'Conversion', '转化与转移，总量守恒。', 'Conversion and transfer, with the total conserved.'),
      ]),
      S('shj-17-2', '能源的开发与利用', 'Using energy sources', [
        Q('shj-17-2a', '能源', 'Sources', '一次能源与二次能源的分类。', 'Primary and secondary sources.'),
      ]),
      S('shj-17-3', '能源与可持续发展', 'Energy and sustainability', [
        Q('shj-17-3a', '可持续', 'Sustainability', '效率与来源，不做装置设计。', 'Efficiency and source, not a device design.'),
      ]),
    ]),
  ],
};
