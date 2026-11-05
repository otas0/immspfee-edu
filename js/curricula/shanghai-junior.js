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
        R('shj-1-1a', 'ruler', '刻度尺读数', 'Ruler reading',
          '读数要估到分度值的下一位。整格是主尺读数，估读位由物体边缘在下一格里的位置给出。拖动物体边缘。',
          'Report one estimated digit past the division. The main mark is the floor reading; the estimated digit comes from how far the edge sits into the next division. Drag the object edge.',
          { trueCm: 3.64, division: 0.1 }),
      ]),
      S('shj-1-2', '时间的测量', 'Measuring time', [
        R('shj-1-2a', 'stopwatch', '停表', 'Stopwatch',
          '60 秒表盘上，指针转角是 2π t / 60。读数就是把这个转角换回秒。拖动指针。',
          'On a 60 s dial the hand angle is 2π t / 60. The reading is that angle turned back into seconds. Drag the hand.',
          { t: 12.5 }),
      ]),
      S('shj-1-3', '质量的测量', 'Measuring mass', [
        Q('shj-1-3a', '天平', 'Balance', '左物右码，游码读数计入总质量。', 'Object and weights; rider included in the mass.'),
      ]),
    ]),
    C('shj-2', 'g8v1', '机械运动', 'Mechanical motion', [
      S('shj-2-1', '运动与静止', 'Motion and rest', [
        R('shj-2-1a', 'frames', '参照物', 'Reference frames',
          '同一辆小车和同一个人，换参照物之后，速度要减去参照物相对地面的速度。',
          'The same cart and the same person. After you change the reference object, subtract that object’s ground velocity.',
          { frame: 'cart', vCart: 2, vPerson: 0.5, xCart0: 0, xPerson0: 0 }),
      ]),
      S('shj-2-2', '运动的快慢', 'How fast', [
        R('shj-2-2a', 'st-graph', 's–t 图像', 's–t graph',
          '位置来自两段匀速。拖动图上的点，运动跳到对应时刻。',
          'Position comes from two constant speeds. Drag the point on the graph and the motion jumps to that time.',
          { v1: 0.4, v2: 1.2, split: 3 }),
      ]),
      S('shj-2-3', '速度的测量', 'Measuring speed', [
        R('shj-2-3a', 'st-graph', '平均速度', 'Average speed',
          '平均速度是整段位移除以整段时间，不是你正在看的那一段的速度。',
          'Average speed is the whole displacement over the whole time, not the speed of the piece you are looking at.',
          { v1: 0.4, v2: 1.2, split: 3 }),
      ]),
    ]),
    C('shj-3', 'g8v1', '声现象', 'Sound', [
      S('shj-3-1', '声音的产生和传播', 'Making and carrying sound', [
        R('shj-3-1a', 'sound-wave', '振动与波形', 'Vibration and waveform',
          '音叉和波形都服从 y = A sin(2π f t)。频率决定音调，振幅决定响度。',
          'The fork and the wave both follow y = A sin(2π f t). Frequency is pitch; amplitude is loudness.',
          { f: 256, A: 0.8 }),
      ]),
      S('shj-3-2', '声音的特性', 'Pitch, loudness, timbre', [
        R('shj-3-2a', 'sound-wave', '音调响度音色', 'Pitch, loudness, timbre',
          '只改 f 就改音调，只改 A 就改响度。音色需要别的波形，这个模型不画。',
          'Change only f to change pitch, only A to change loudness. Timbre needs another waveform and is outside this model.',
          { f: 440, A: 0.6 }),
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
        R('shj-8-1a', 'lever', '杠杆平衡', 'Lever balance',
          '力都垂直于杠杆时，F1 L1 = F2 L2。拖动力臂。',
          'With both forces perpendicular to the bar, F1 L1 = F2 L2. Drag the arms.',
          { F1: 4, L1: 0.3, F2: 6, L2: 0.2 }, true),
      ]),
      S('shj-8-2', '滑轮', 'Pulleys', [
        R('shj-8-2a', 'pulley', '滑轮组', 'Pulley system',
          'n 段绳子承担重物和动滑轮。拉力 F = (G + Gp) / n，绳端移动距离是重物上升距离的 n 倍。拖动绳端。',
          'n segments support the load and the movable pulley. F = (G + Gp) / n, and the rope end moves n times as far as the load. Drag the rope end.',
          { n: 3, G: 12, Gp: 3, s: 0.6 }, true),
      ]),
      S('shj-8-3', '功与功率', 'Work and power', [
        R('shj-8-3a', 'work', '功和功率', 'Work and power',
          'W = F s cosθ，平均功率 P = W / t。θ 是力与位移的夹角。',
          'W = F s cosθ, and the average power is P = W / t. θ is the angle between the force and the displacement.',
          { F: 10, s: 2, theta: 60, t: 4 }),
      ]),
      S('shj-8-4', '机械能及其转化', 'Mechanical energy', [
        R('shj-8-4a', 'energy', '动能与势能', 'Kinetic and potential',
          '从斜面顶端静止释放。μ = 0 时动能加势能始终等于 mgH。色条和守恒线跟着运动走。',
          'Released from rest at the top of a slope. With μ = 0, kinetic plus potential stays equal to mgH. The bars and the conservation line follow the motion.',
          { m: 1, g: 9.8, H: 1.2, alpha: 30, mu: 0 }),
      ]),
      S('shj-8-5', '机械效率', 'Efficiency', [
        R('shj-8-5a', 'pulley', '有用功与总功', 'Useful work and total work',
          '有用功是 Gh，总功是 F s，额外功来自动滑轮的重力。η = Gh / (F s)。',
          'Useful work is Gh, total work is F s, and the extra work is the weight of the movable pulley. η = Gh / (F s).',
          { n: 3, G: 12, Gp: 3, s: 0.6 }, true),
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
        R('shj-9-3a', 'melting', '熔化图像', 'Melting curve',
          '加热功率可调。晶体在熔点处继续吸热，温度保持不变，图上是一段平台。关掉“晶体”就没有这段平台。',
          'The heating power is adjustable. A crystal keeps absorbing heat at the melting point while the temperature stays put, which is the plateau. Turn the crystal off and the plateau goes away.',
          { m: 0.1, P: 200, cS: 2100, cL: 4200, Lf: 3.34e5, T0: -20, Tm: 0, crystal: true }),
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
        R('shj-10-3a', 'heat-engine', '四冲程', 'Four strokes',
          '理想奥托循环：η = 1 − 1/r^(γ−1)，γ = 1.4，净功 W = η Qin。p–V 图上阴影面积等于 W。冲程顺序是吸气、压缩、做功、排气。这是公开的热力学关系，不是装置设计。',
          'Ideal Otto cycle: η = 1 − 1/r^(γ−1) with γ = 1.4, and net work W = η Qin. The shaded p–V area equals W. Stroke order is intake, compression, power, exhaust. This is the public thermodynamic relation, not a device design.',
          { r: 8, Qin: 1200, Vmin: 0.0002 }),
      ]),
      S('shj-10-4', '热机的效率', 'Engine efficiency', [
        R('shj-10-4a', 'heat-engine', '热机效率', 'Engine efficiency',
          '效率就是 η = W / Qin。改压缩比，看 η 和阴影面积怎么一起变。',
          'Efficiency is η = W / Qin. Change the compression ratio and watch η and the shaded area move together.',
          { r: 8, Qin: 1200, Vmin: 0.0002 }),
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
        R('shj-11-4a', 'circuit', '通路、断路、短路', 'Closed, open, short',
          '从一个接线柱拖到另一个接线柱来连线。开关断开是断路。把电源正负极直接连上是短路，电流变为 E/r。',
          'Drag from one terminal to another to connect them. An open switch is an open circuit. A wire across the battery is a short, and the current becomes E/r.',
          { layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10 }, true),
      ]),
      S('shj-11-5', '串联电路和并联电路中电流、电压的特点', 'Current and voltage rules', [
        R('shj-11-5a', 'circuit', '电流电压分配', 'How I and U split',
          '串联时各电阻电流相同。改成并联后，各支路电压相同，电流按电阻分配。',
          'In series the resistors carry the same current. Rewire them in parallel and they share the voltage, while the currents split by resistance.',
          { layout: 'parallel', links: 'bp-s1,s2-a1,s2-b1,a2-bn,b2-bn', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10 }),
      ]),
    ]),
    C('shj-12', 'g9v1', '欧姆定律', 'Ohm’s law', [
      S('shj-12-1', '电阻 变阻器', 'Resistance', [
        R('shj-12-1a', 'circuit', '滑动变阻器', 'Rheostat',
          '拖动变阻器的滑片改变 Rs。定值电阻上的点沿着 U = I R1 移动。',
          'Drag the rheostat slider to change Rs. The point for the fixed resistor moves along U = I R1.',
          { layout: 'ohm', links: 'bp-s1,s2-h1,h2-a1,a2-bn', closed: true, E: 6, r: 1, R1: 10, R2: 10, Rs: 10 }),
      ]),
      S('shj-12-2', '电流与电压、电阻的关系', 'Current, voltage, resistance', [
        R('shj-12-2a', 'circuit', '欧姆定律', 'Ohm’s law',
          'I = U / R。图上的直线是定值电阻的 U = I R，圆点是当前读数。',
          'I = U / R. The line is U = I R for the fixed resistor, and the dot is the present reading.',
          { layout: 'ohm', links: 'bp-s1,s2-h1,h2-a1,a2-bn', closed: true, E: 6, r: 1, R1: 10, R2: 10, Rs: 10 }, true),
      ]),

      S('shj-12-3', '电阻的测量', 'Measuring resistance', [
        R('shj-12-3a', 'circuit', '伏安法', 'Voltmeter–ammeter',
          '闭合欧姆电路上 R = U / I。读 R1 两端的 U1 和 I1，它们的比就是电阻。',
          'On the closed Ohm circuit R = U / I. Read U1 and I1 across R1; their ratio is the resistance.',
          { layout: 'ohm', links: 'bp-s1,s2-h1,h2-a1,a2-bn', closed: true, E: 6, r: 1, R1: 10, R2: 10, Rs: 10 }, true),
      ]),
      S('shj-12-4', '电阻的串联和并联', 'Combining resistors', [
        R('shj-12-4a', 'circuit', '串并联电阻', 'Series and parallel resistors',
          '串联时电流相同、电阻相加；并联时电压相同、电导相加。用初始接法切换串并联，看 I 和 U 怎么分。',
          'In series the current is shared and resistances add; in parallel the voltage is shared and conductances add. Switch the starter wiring and watch how I and U split.',
          { layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 6, r: 0.5, R1: 4, R2: 12, Rs: 10 }),
      ]),
    ]),
    C('shj-13', 'g9v1', '电功率', 'Electric power', [
      S('shj-13-1', '电功', 'Electrical work', [
        R('shj-13-1a', 'circuit', '电功', 'Electrical work',
          '同一稳态电路上，R1 的电功是 W = U I t。改时间 t，W 按比例变。',
          'On the same steady circuit, the work in R1 is W = U I t. Change t and W scales with it.',
          { layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 6, r: 0.5, R1: 6, R2: 0, Rs: 0, t: 10 }),
      ]),
      S('shj-13-2', '电功率', 'Electric power', [
        R('shj-13-2a', 'circuit', '电功率', 'Electric power',
          'P = U I。功率不依赖 t；焦耳热才乘时间。',
          'P = U I. Power does not depend on t; Joule heat does.',
          { layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 6, r: 0.5, R1: 6, R2: 0, Rs: 0, t: 5 }),
      ]),
      S('shj-13-3', '焦耳定律', 'Joule heating', [
        R('shj-13-3a', 'circuit', '焦耳定律', 'Joule’s law',
          '纯电阻上 Q = I² R t，并且等于 W = U I t。暖色块跟着 Q 加深。',
          'On a pure resistor Q = I² R t, and that equals W = U I t. The warm fill tracks Q.',
          { layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 6, r: 0.5, R1: 8, R2: 0, Rs: 0, t: 20 }, true),
      ]),
      S('shj-13-4', '家庭电路', 'Household circuits', [
        R('shj-13-4a', 'circuit', '家庭电路', 'Household circuit',
          '火线、零线、地线。正常通路电流由用电器电阻决定；火零直接短接时 I = E/r。',
          'Live, neutral, and earth. On a closed path the load sets the current; a live–neutral short draws I = E/r.',
          { layout: 'household', links: 'bp-s1,s2-a1,a2-bn', closed: true, E: 220, r: 2, R1: 484, R2: 0, Rs: 0, t: 1 }),
      ]),
    ]),
    C('shj-14', 'g9v2', '电与磁', 'Electricity and magnetism', [
      S('shj-14-1', '磁场', 'Magnetic field', [
        R('shj-14-1a', 'bar-magnet', '磁感线', 'Field lines',
          '磁体外磁感线从 N 极出发回到 S 极。强弱只改变画出的线条疏密。',
          'Outside the magnet the lines leave N and return to S. Strength only packs the drawn lines.',
          { strength: 0.7, flip: false }),
      ]),
      S('shj-14-2', '电流的磁场', 'Magnetic field of a current', [
        R('shj-14-2a', 'solenoid', '通电螺线管', 'Solenoid',
          '长直螺线管轴线上 B = μ0 n I。右手四指沿电流，拇指指向 B，也就是 N 端。',
          'On the axis of a long solenoid B = μ0 n I. Curl the right-hand fingers with the current; the thumb is B and the north end.',
          { n: 1000, I: 2, turns: 8 }),
      ]),
      S('shj-14-3', '通电导线在磁场中受到的作用力', 'Force on a current', [
        R('shj-14-3a', 'ampere-force', '磁场对电流的作用', 'Force on a wire',
          'B 垂直于 I 时，F = B I L。右手定则给出 F 的指向。',
          'When B is perpendicular to I, F = B I L. The right-hand rule gives the sense of F.',
          { B: 0.4, I: 3, L: 0.2 }, true),
      ]),
      S('shj-14-4', '电磁感应', 'Electromagnetic induction', [
        R('shj-14-4a', 'induction', '感应电流', 'Induced current',
          '导轨上 Φ = B ℓ x，感应电动势 ε = B ℓ v，回路电流 I = ε / R。拖动杆改变 x。',
          'On the rails Φ = B ℓ x, the emf is ε = B ℓ v, and I = ε / R. Drag the rod to change x.',
          { B: 0.5, ell: 0.2, x: 0.25, v: 1.5, R: 2 }),
      ]),
    ]),
    C('shj-15', 'g9v2', '电磁波及其应用', 'Electromagnetic waves', [
      S('shj-15-1', '电磁波', 'Electromagnetic waves', [
        R('shj-15-1a', 'em-wave', '电磁波', 'A wave',
          '真空中 c = f λ。E 和 B 同相位、互相垂直，也垂直于传播方向。改频率，波长按 λ = c / f 变。',
          'In vacuum c = f λ. E and B stay in phase, perpendicular to each other and to the travel direction. Change f and λ follows λ = c / f.',
          { f: 1e8, A: 1 }, true),
      ]),
      S('shj-15-2', '电磁波的应用', 'Using the waves', [
        R('shj-15-2a', 'em-wave', '应用', 'Uses',
          '同一关系：选定频段的 f，就得到公开的 λ = c / f。不另造发射装置。',
          'Same relation: pick the band’s f and the public λ = c / f follows. No transmitter design.',
          { f: 1e8, A: 0.8 }),
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
