import { chapter, queued, ready, section } from './helpers.js';

const Q = queued;
const R = ready;

function q(id, zh, en, iz, ie) {
  return section(id, zh, en, [Q(`${id}a`, zh, en, iz, ie)]);
}

function live(id, sim, zh, en, iz, ie, preset, exam = false) {
  return section(id, zh, en, [R(`${id}a`, sim, zh, en, iz, ie, preset, exam)]);
}

/**
 * Compulsory 1–3 and elective 2 follow the 2021 Shanghai Science and
 * Technology Press contents (沪科版 / 沪科技版). Elective 1 and elective 3
 * are still the chapter map: those contents pages were not checked section
 * by section. 学期活动 and 复习 are omitted.
 */
export const shanghaiSenior = {
  id: 'sh-senior',
  region: 'shanghai',
  stage: 'senior',
  tocConfidence: 'compulsory-1-3-and-elective-2-2021',
  title: { zh: '上海高中物理', en: 'Shanghai senior physics' },
  edition: {
    zh: '沪科版（上海科学技术出版社，2021）。必修一至必修三、选择性必修二按出版目录。选择性必修一和三仍是章节图，尚未逐节核对。',
    en: 'Huke senior (Shanghai Science and Technology Press, 2021). Compulsory 1–3 and elective 2 follow the published contents. Elective 1 and 3 are still a chapter map.',
  },
  volumes: [
    { id: 'm1', zh: '必修第一册', en: 'Compulsory 1' },
    { id: 'm2', zh: '必修第二册', en: 'Compulsory 2' },
    { id: 'm3', zh: '必修第三册', en: 'Compulsory 3' },
    { id: 'e1', zh: '选择性必修第一册', en: 'Elective 1' },
    { id: 'e2', zh: '选择性必修第二册', en: 'Elective 2' },
    { id: 'e3', zh: '选择性必修第三册', en: 'Elective 3' },
  ],
  chapters: [
    chapter('shs-1', 'm1', '运动的描述', 'Describing motion', [
      q('shs-1-1', '质点 物理模型', 'Particle model', '物体尺度与所研究运动的尺度相比。', 'The object’s size against the scale of the motion being studied.'),
      q('shs-1-2', '位置的变化 位移', 'Displacement', '位移是位置的变化，是矢量。', 'Displacement is the change of position, a vector.'),
      q('shs-1-3', '位置变化的快慢 速度', 'Velocity', '速度是位移对时间的变化率。', 'Velocity is the rate of change of displacement.'),
      q('shs-1-4', '速度变化的快慢 加速度', 'Acceleration', '加速度是速度对时间的变化率。', 'Acceleration is the rate of change of velocity.'),
    ]),
    chapter('shs-2', 'm1', '匀变速直线运动', 'Uniformly accelerated motion', [
      q('shs-2-1', '伽利略对落体运动的研究', 'Galileo on falling', '斜面把重力冲淡后的匀加速。', 'Uniform acceleration on a slope that dilutes g.'),
      q('shs-2-2', '自由落体运动的规律', 'Free fall', '初速为零、加速度为 g。空气阻力另算。', 'Zero initial speed and acceleration g. Air resistance is separate.'),
      live('shs-2-3', 'vt-area', '匀变速直线运动的规律', 'The uniform-acceleration relations',
        'v = v0 + a t。v–t 图上 t1 到 t2 的有向面积等于这段位移。拖动区间，或拖动时刻让小车跳过去。',
        'v = v0 + a t. The signed area on the v–t graph from t1 to t2 is the displacement. Drag the interval, or drag the time so the cart jumps there.',
        { v0: 2, a: 1, t1: 1, t2: 3, tEnd: 6 }, true),
    ]),
    chapter('shs-3', 'm1', '相互作用与力的平衡', 'Forces in equilibrium', [
      q('shs-3-1', '生活中常见的力', 'Everyday forces', '重力、弹力、摩擦力。', 'Weight, the spring force, and friction.'),
      q('shs-3-2', '力的合成', 'Adding forces', '平行四边形法则。', 'The parallelogram rule.'),
      q('shs-3-3', '力的分解', 'Resolving a force', '按效果分解，分量由夹角决定。', 'Components fixed by the chosen directions.'),
      q('shs-3-4', '共点力的平衡', 'Concurrent equilibrium', '合力为零。', 'The resultant is zero.'),
    ]),
    chapter('shs-4', 'm1', '牛顿运动定律', 'Newton’s laws', [
      q('shs-4-1', '牛顿第一定律', 'First law', '合外力为零时速度不变。', 'Velocity stays constant when the net force is zero.'),
      q('shs-4-2', '牛顿第二定律', 'Second law', 'a = Fnet / m。', 'a = Fnet / m.'),
      q('shs-4-3', '力学单位制', 'Units', '由基本单位导出其他单位。', 'Derived units from the base units.'),
      q('shs-4-4', '牛顿第三定律', 'Third law', '作用力与反作用力等大、反向、作用在两个物体上。', 'The pair is equal, opposite, and on two bodies.'),
      q('shs-4-5', '牛顿运动定律的应用', 'Using the laws', '先受力，再加速度，再运动。', 'Forces, then acceleration, then the motion.'),
    ]),
    chapter('shs-5', 'm2', '曲线运动', 'Curved motion', [
      q('shs-5-1', '曲线运动', 'Curved motion', '速度沿切线，合力不与速度共线。', 'Velocity is tangent, and the net force is not along it.'),
      live('shs-5-2', 'projectile', '平抛运动', 'Horizontal projection',
        '不计空气阻力时，x = v0 t，y = H − ½ g t²。频闪是等时间间隔上的同一组方程，旁边是 x–t 和 y–t。',
        'With no air resistance, x = v0 t and y = H − ½ g t². The strobes are equal time steps of those equations, with x–t and y–t beside them.',
        { v0: 4, H: 5, g: 10 }, true),
      q('shs-5-3', '圆周运动', 'Circular motion', '线速度、角速度和周期。', 'Linear speed, angular speed, and period.'),
      q('shs-5-4', '向心力 向心加速度', 'Centripetal acceleration', 'a = v² / r = ω² r。', 'a = v² / r = ω² r.'),
      q('shs-5-5', '圆周运动的应用', 'Using circular motion', '由牛顿第二定律求向心力。', 'Centripetal force from Newton’s second law.'),
    ]),
    chapter('shs-6', 'm2', '万有引力定律', 'Gravitation', [
      q('shs-6-1', '行星的运动', 'Planetary motion', '开普勒三定律。', 'Kepler’s three laws.'),
      q('shs-6-2', '万有引力定律', 'The law', 'F = G M m / r²。', 'F = G M m / r².'),
      q('shs-6-3', '万有引力定律的应用', 'Using the law', '环绕速度与轨道半径。', 'Circular speed and orbital radius.'),
    ]),
    chapter('shs-7', 'm2', '机械能守恒定律', 'Conservation of mechanical energy', [
      q('shs-7-1', '功', 'Work', 'W = F s cosθ。', 'W = F s cosθ.'),
      q('shs-7-2', '功率', 'Power', '平均功率与瞬时功率。', 'Average power and instantaneous power.'),
      q('shs-7-3', '动能 动能定理', 'Kinetic energy', '合力的功等于动能变化。', 'Net work equals the change in kinetic energy.'),
      q('shs-7-4', '重力势能', 'Gravitational potential', '近地面 PE = mgh。', 'PE = mgh near the ground.'),
      live('shs-7-5', 'energy', '机械能守恒定律', 'Conservation',
        '斜面上 μ = 0 时，动能与势能之和保持 mgH。色条随运动变化，虚线是总机械能。',
        'On the slope with μ = 0, kinetic plus potential stays at mgH. The bars follow the motion, and the dashed line is the total.',
        { m: 1, g: 9.8, H: 1.2, alpha: 30, mu: 0 }, true),
    ]),
    chapter('shs-8', 'm2', '牛顿力学的局限性与相对论初步', 'Where Newtonian mechanics stops', [
      q('shs-8-1', '牛顿力学的局限性', 'The limit of Newton’s laws', '低速、弱引力时的适用条件。', 'The low-speed, weak-field conditions.'),
      q('shs-8-2', '相对论初步', 'A first look at relativity', '时间膨胀、长度收缩，以及 E = mc²。', 'Time dilation, length contraction, and E = mc².'),
      q('shs-8-3', '宇宙的起源与演化', 'The universe', '公开的宇宙学时间线，不另造观测数据。', 'The public cosmological timeline, with no invented observations.'),
    ]),
    chapter('shs-9', 'm3', '静电场', 'Electrostatics', [
      q('shs-9-1', '静电现象 电荷', 'Charge', '电荷守恒。', 'Charge is conserved.'),
      q('shs-9-2', '电荷的相互作用 库仑定律', 'Coulomb’s law', 'F = k q1 q2 / r²。', 'F = k q1 q2 / r².'),
      q('shs-9-3', '电场力 电场强度', 'Electric field', 'E = F / q。', 'E = F / q.'),
      q('shs-9-4', '电势能 电势', 'Potential', '电场力的功与电势能。', 'Work by the field and electric potential energy.'),
      q('shs-9-5', '带电粒子在电场中的运动', 'A charge in a field', '匀强电场中的加速与偏转。', 'Speeding up and deflecting in a uniform field.'),
      q('shs-9-6', '电容 电容器', 'Capacitance', 'C = Q / U。', 'C = Q / U.'),
      q('shs-9-7', '静电的利用与防范', 'Using and avoiding static charge', '电荷的公开应用，不做装置设计。', 'Public uses of charge, not a device design.'),
    ]),
    chapter('shs-10', 'm3', '电路及其应用', 'Circuits', [
      q('shs-10-1', '简单串联、并联组合电路', 'Series and parallel', '串联相加，并联倒数相加。', 'Series adds; parallel adds reciprocals.'),
      q('shs-10-2', '电阻定律', 'Resistivity', 'R = ρ L / A。', 'R = ρ L / A.'),
      q('shs-10-3', '测量金属丝的电阻率', 'Measuring resistivity', '由 R、L、A 求 ρ。', 'ρ from R, L, and A.'),
      q('shs-10-4', '多用电表', 'A multimeter', '电流挡、电压挡、电阻挡的公开接法。', 'The public connections of the current, voltage, and resistance ranges.'),
      q('shs-10-5', '闭合电路欧姆定律', 'A complete circuit', 'I = E / (R + r)，路端电压 U = E − I r。', 'I = E / (R + r), and the terminal voltage is U = E − I r.'),
      q('shs-10-6', '电源电动势和内阻的测量', 'Measuring E and r', '由 U–I 图的截距和斜率。', 'Intercept and slope of the U–I graph.'),
      q('shs-10-7', '电功、电功率及焦耳定律', 'Power and Joule heat', 'P = U I，Q = I² R t。', 'P = U I, Q = I² R t.'),
      q('shs-10-8', '家庭电路', 'Household circuits', '火线、零线、地线，以及短路电流。', 'Live, neutral, earth, and the current in a short.'),
    ]),
    chapter('shs-11', 'm3', '电磁场与电磁波初步', 'Electromagnetic waves', [
      q('shs-11-1', '磁现象 磁感线', 'Magnetic field lines', '场的方向。', 'The direction of the field.'),
      q('shs-11-2', '电流的磁场 磁感应强度', 'Magnetic field of a current', 'B 的定义式。', 'The defining relation for B.'),
      q('shs-11-3', '磁通量 电磁感应现象', 'Flux and induction', '闭合回路的磁通量变化。', 'Changing flux in a closed loop.'),
      q('shs-11-4', '电磁场与电磁波', 'The wave', 'E 与 B 正交，c = f λ。', 'E perpendicular to B, and c = f λ.'),
    ]),
    chapter('shs-12', 'm3', '能源与可持续发展', 'Energy and sustainability', [
      q('shs-12-1', '能源及其应用', 'Sources', '一次能源与二次能源。', 'Primary and secondary sources.'),
      q('shs-12-2', '能量的转化', 'Conversion', '转化与转移，总量守恒。', 'Conversion and transfer, with the total conserved.'),
      q('shs-12-3', '能源与环境', 'Energy and the environment', '效率与来源，不做装置设计。', 'Efficiency and source, not a device design.'),
    ]),
    chapter('shs-e1', 'e1', '动量', 'Momentum', [
      q('shs-e1-1', '动量与冲量', 'Momentum and impulse', '冲量是 F–t 图的面积。本章目录尚未按课本逐节核对。', 'Impulse is the area on an F–t graph. This chapter is not yet checked against the contents page.'),
      q('shs-e1-2', '动量守恒与碰撞', 'Conservation and collisions', '一维碰撞，弹性与非弹性。', 'One-dimensional collisions, elastic and inelastic.'),
    ]),
    chapter('shs-e2', 'e1', '机械振动', 'Oscillations', [
      q('shs-e2-1', '简谐运动', 'Simple harmonic motion', 'x = A cos(ωt)，以及参考圆。', 'x = A cos(ωt), and the reference circle.'),
      q('shs-e2-2', '单摆与共振', 'Pendulum and resonance', '小角度周期，以及受迫振动的振幅。', 'The small-angle period, and the amplitude of driven motion.'),
    ]),
    chapter('shs-e3', 'e1', '机械波', 'Mechanical waves', [
      q('shs-e3-1', '波的形成与描述', 'Making a wave', 'v = f λ，质点振动方向与波的传播方向。', 'v = f λ, and how a particle moves relative to the wave.'),
      q('shs-e3-2', '干涉、衍射与多普勒效应', 'Interference and Doppler', '公开的干涉条件与频率移动。', 'The public interference condition and the frequency shift.'),
    ]),
    chapter('shs-e4', 'e1', '光', 'Light', [
      q('shs-e4-1', '折射与全反射', 'Refraction', 'n1 sin θ1 = n2 sin θ2，以及临界角。', 'n1 sin θ1 = n2 sin θ2, and the critical angle.'),
      q('shs-e4-2', '干涉、衍射与偏振', 'Interference and diffraction', '双缝条纹间距。', 'Double-slit fringe spacing.'),
    ]),
    chapter('shs-e5', 'e2', '磁场', 'Magnetic fields', [
      q('shs-e5-1', '安培力', 'The Ampère force', '导线与磁场垂直时 F = B I L。', 'F = B I L when the wire is perpendicular to the field.'),
      q('shs-e5-2', '洛伦兹力', 'The Lorentz force', 'F = q v B，垂直时。', 'F = q v B when the velocity is perpendicular to the field.'),
      q('shs-e5-3', '带电粒子在匀强磁场中的圆周运动', 'Circular motion in a uniform field', 'r = m v / (q B)。', 'r = m v / (q B).'),
    ]),
    chapter('shs-e6', 'e2', '电磁感应定律', 'Faraday’s law', [
      q('shs-e6-1', '楞次定律', 'Lenz’s law', '感应电流的效果阻碍引起它的磁通量变化。', 'The induced current opposes the change in flux that causes it.'),
      q('shs-e6-2', '法拉第电磁感应定律', 'Faraday’s law', '感应电动势等于磁通量变化率。', 'Induced emf equals the rate of change of flux.'),
    ]),
    chapter('shs-e7', 'e2', '电磁感应定律的应用', 'Using induction', [
      q('shs-e7-1', '自感现象和涡流现象', 'Self-inductance and eddy currents', '电流变化与涡流。', 'A changing current, and eddy currents.'),
      q('shs-e7-2', '交变电流', 'Alternating current', '正弦式电流的峰值与有效值。', 'Peak and rms values of a sinusoidal current.'),
      q('shs-e7-3', '变压器', 'A transformer', '理想变压器的匝数比。', 'The turns ratio of an ideal transformer.'),
      q('shs-e7-4', '发电机和电动机', 'Generators and motors', '线圈在磁场中转动的公开关系。', 'The public relation for a coil turning in a field.'),
    ]),
    chapter('shs-e8', 'e2', '电磁振荡与电磁波', 'Electromagnetic oscillations', [
      q('shs-e8-1', '麦克斯韦电磁场理论', 'Maxwell’s account', '变化的磁场产生电场，变化的电场产生磁场。', 'A changing magnetic field makes an electric field, and the reverse.'),
      q('shs-e8-2', '电磁波的产生与发射', 'Emitting a wave', 'LC 振荡里电场能与磁场能交替。', 'Electric and magnetic energy alternate in an LC circuit.'),
      q('shs-e8-3', '电磁波的传播和接收', 'Travel and reception', 'c = f λ。', 'c = f λ.'),
      q('shs-e8-4', '电磁波的应用', 'Uses', '频率与波段的公开对应。', 'The public map from frequency to band.'),
    ]),
    chapter('shs-e9', 'e2', '传感器', 'Sensors', [
      q('shs-e9-1', '传感器及其敏感元件', 'A sensor', '非电学量转换为电学量。', 'A non-electrical quantity converted to an electrical one.'),
      q('shs-e9-2', '常见传感器的工作原理', 'How common sensors work', '电阻、电容随被测量变化的公开关系。', 'The public dependence of resistance or capacitance on the measured quantity.'),
      q('shs-e9-3', '传感器的应用', 'Using sensors', '把敏感元件接进电路后的读数。', 'The reading once the element is in a circuit.'),
    ]),
    chapter('shs-e10', 'e3', '热学', 'Thermal physics', [
      q('shs-e10-1', '分子动理论与气体实验定律', 'Kinetic theory and gas laws', 'pV、V/T、p/T。本章目录尚未按课本逐节核对。', 'pV, V/T, and p/T. This chapter is not yet checked against the contents page.'),
      q('shs-e10-2', '热力学定律', 'Laws of thermodynamics', 'ΔU = Q + W，符号按教材约定。', 'ΔU = Q + W, with the textbook’s signs.'),
    ]),
    chapter('shs-e13', 'e3', '近代物理', 'Modern physics', [
      q('shs-e13-1', '原子与能级', 'Atoms and levels', '跃迁能量差与光谱线。', 'The transition energy and a spectral line.'),
      q('shs-e13-2', '光电效应', 'Photoelectric effect', '截止频率与爱因斯坦关系。', 'The cutoff frequency and Einstein’s relation.'),
      q('shs-e13-3', '原子核', 'The nucleus', '半衰期 N = N0 e^{−λt}。裂变与聚变只作为质量差对应的能量，不涉及装置。', 'Half-life N = N0 e^{−λt}. Fission and fusion stay at the energy of a mass difference, with no device.'),
    ]),
  ],
};
