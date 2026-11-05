import { chapter, queued, section } from './helpers.js';

const Q = queued;
const S = section;

function lessons(rows) {
  return rows.map(([id, zh, en, iz, ie]) => Q(id, zh, en, iz, ie));
}

/**
 * Chapter order matches the Shanghai senior 沪科版 map for this edition
 * (compulsory 1–3, elective 1–3). Section titles here are the model slots
 * from that map, not a page-checked contents list. tocConfidence is brief-map.
 */
export const shanghaiSenior = {
  id: 'sh-senior',
  region: 'shanghai',
  stage: 'senior',
  tocConfidence: 'brief-map',
  title: { zh: '上海高中物理', en: 'Shanghai senior physics' },
  edition: {
    zh: '沪科版 · 必修与选择性必修（章节按本教育版的映射，模拟待做）',
    en: 'Huke senior, compulsory and elective (mapped; simulations not built yet)',
  },
  volumes: [
    { id: 'm1', zh: '必修一', en: 'Compulsory 1' },
    { id: 'm2', zh: '必修二', en: 'Compulsory 2' },
    { id: 'm3', zh: '必修三', en: 'Compulsory 3' },
    { id: 'e1', zh: '选择性必修一', en: 'Elective 1' },
    { id: 'e2', zh: '选择性必修二', en: 'Elective 2' },
    { id: 'e3', zh: '选择性必修三', en: 'Elective 3' },
  ],
  chapters: [
    chapter('shs-1', 'm1', '运动的描述', 'Describing motion', [
      S('shs-1-1', '质点、图像与加速度', 'Particle, graphs, acceleration', lessons([
        ['shs-1-1a', '质点', 'Particle model', '物体尺度与轨道尺度的比较。', 'Object size against the scale of the path.'],
        ['shs-1-1b', 'x–t 与 v–t', 'x–t and v–t', '图像上的点对应运动的时刻。', 'A point on the graph is a time in the motion.'],
        ['shs-1-1c', '加速度', 'Acceleration', '速度的变化率。', 'The rate of change of velocity.'],
      ])),
    ]),
    chapter('shs-2', 'm1', '匀变速直线运动', 'Uniform acceleration', [
      S('shs-2-1', '公式与图像面积', 'Equations and graph area', lessons([
        ['shs-2-1a', '伽利略斜面', 'Galileo’s ramp', '冲淡重力后的匀加速。', 'Uniform acceleration with a diluted g.'],
        ['shs-2-1b', '自由落体', 'Free fall', '有空气与没有空气。', 'With air and without it.'],
        ['shs-2-1c', 'v–t 面积', 'Area on a v–t graph', '面积等于位移。', 'The area equals the displacement.'],
      ])),
    ]),
    chapter('shs-3', 'm1', '相互作用与力的平衡', 'Forces and equilibrium', [
      S('shs-3-1', '合成与平衡', 'Composition and equilibrium', lessons([
        ['shs-3-1a', '三种力', 'Three forces', '重力、弹力、摩擦力。', 'Weight, spring force, friction.'],
        ['shs-3-1b', '平行四边形', 'Parallelogram', '两个分力合成。', 'Two components make a resultant.'],
        ['shs-3-1c', '共点力平衡', 'Concurrent equilibrium', '三力汇交。', 'Three forces meeting at a point.'],
      ])),
    ]),
    chapter('shs-4', 'm1', '牛顿运动定律', 'Newton’s laws', [
      S('shs-4-1', '定律与电梯', 'The laws and a lift', lessons([
        ['shs-4-1a', '第二定律', 'Second law', 'F、m、a 控制变量。', 'F, m, and a, one at a time.'],
        ['shs-4-1b', '第三定律', 'Third law', '成对出现的作用力与反作用力。', 'The pair appears together.'],
        ['shs-4-1c', '超重与失重', 'Apparent weight', '电梯加速度与视重。', 'Lift acceleration and the scale reading.'],
      ])),
    ]),
    chapter('shs-5', 'm2', '曲线运动', 'Motion in a curve', [
      S('shs-5-1', '抛体与圆周', 'Projectiles and circles', lessons([
        ['shs-5-1a', '小船渡河', 'Crossing a river', '速度的合成。', 'Adding velocities.'],
        ['shs-5-1b', '平抛', 'Horizontal projection', '水平与竖直分运动。', 'Horizontal and vertical parts.'],
        ['shs-5-1c', '圆周与向心力', 'Circles and centripetal force', 'v、ω、T 与临界条件。', 'v, ω, T, and the limiting case.'],
      ])),
    ]),
    chapter('shs-6', 'm2', '万有引力定律', 'Gravitation', [
      S('shs-6-1', '轨道', 'Orbits', lessons([
        ['shs-6-1a', '开普勒', 'Kepler', '三条定律。', 'The three laws.'],
        ['shs-6-1b', '卫星轨道', 'Satellite orbits', '圆轨道、椭圆与逃逸。', 'Circle, ellipse, and escape.'],
        ['shs-6-1c', '宇宙速度', 'Cosmic speeds', '由 GM/R 得出的三个速度。', 'The three speeds from GM/R.'],
      ])),
    ]),
    chapter('shs-7', 'm2', '机械能守恒定律', 'Mechanical energy', [
      S('shs-7-1', '功与能量', 'Work and energy', lessons([
        ['shs-7-1a', '功与功率', 'Work and power', '力与位移的夹角；瞬时功率与平均功率。', 'The angle between force and displacement; instantaneous and average power.'],
        ['shs-7-1b', '动能定理', 'Work–energy', '合力的功等于动能变化。', 'The net work equals the change in kinetic energy.'],
        ['shs-7-1c', '机械能守恒', 'Conservation', '动能与势能的色条。', 'Bars for kinetic and potential energy.'],
      ])),
    ]),
    chapter('shs-8', 'm2', '相对论初步', 'Introduction to relativity', [
      S('shs-8-1', '狭义相对论的两个效应', 'Two special-relativistic effects', lessons([
        ['shs-8-1a', '时间与长度', 'Time and length', '时间膨胀与长度收缩。', 'Time dilation and length contraction.'],
        ['shs-8-1b', '质能', 'Mass–energy', 'E = mc² 作为公开教学关系。', 'E = mc² as the public teaching relation.'],
      ])),
    ]),
    chapter('shs-9', 'm3', '静电场', 'Electrostatics', [
      S('shs-9-1', '场与粒子', 'Field and particles', lessons([
        ['shs-9-1a', '库仑与场强', 'Coulomb and field', '点电荷与匀强电场。', 'A point charge and a uniform field.'],
        ['shs-9-1b', '电势', 'Potential', '等势面与电场线正交。', 'Equipotentials orthogonal to field lines.'],
        ['shs-9-1c', '带电粒子', 'A charged particle', '加速与偏转。', 'Speeding up and deflecting.'],
      ])),
    ]),
    chapter('shs-10', 'm3', '电路及其应用', 'Circuits', [
      S('shs-10-1', '闭合电路', 'A complete circuit', lessons([
        ['shs-10-1a', '电阻定律', 'Resistivity', 'R = ρL/A。', 'R = ρL/A.'],
        ['shs-10-1b', '闭合电路欧姆定律', 'Complete-circuit Ohm law', '电动势、内阻、路端电压。', 'Emf, internal resistance, terminal voltage.'],
        ['shs-10-1c', '电功率与焦耳热', 'Power and Joule heat', 'P = UI，Q = I²Rt。', 'P = UI, Q = I²Rt.'],
      ])),
    ]),
    chapter('shs-11', 'm3', '电磁场与电磁波初步', 'Fields and waves', [
      S('shs-11-1', '磁场与电磁波', 'Magnetism and waves', lessons([
        ['shs-11-1a', '电流的磁场', 'Field of a current', '磁感线。', 'Field lines.'],
        ['shs-11-1b', '电磁感应现象', 'Induction', '磁通量变化。', 'A change in flux.'],
        ['shs-11-1c', '电磁波', 'Electromagnetic wave', 'E 与 B 正交，c = fλ。', 'E perpendicular to B, c = fλ.'],
      ])),
    ]),
    chapter('shs-e1', 'e1', '动量', 'Momentum', [
      S('shs-e1-1', '动量守恒', 'Conservation of momentum', lessons([
        ['shs-e1-1a', '冲量', 'Impulse', 'F–t 图的面积。', 'The area on an F–t graph.'],
        ['shs-e1-1b', '碰撞', 'Collisions', '弹性与非弹性，恢复系数。', 'Elastic and inelastic, with a coefficient of restitution.'],
      ])),
    ]),
    chapter('shs-e2', 'e1', '机械振动', 'Oscillations', [
      S('shs-e2-1', '简谐运动', 'Simple harmonic motion', lessons([
        ['shs-e2-1a', '参考圆', 'Reference circle', '匀速圆周的投影。', 'The projection of uniform circular motion.'],
        ['shs-e2-1b', '单摆', 'Pendulum', '周期公式。', 'The period formula.'],
        ['shs-e2-1c', '共振', 'Resonance', '受迫振动的振幅。', 'The amplitude of driven motion.'],
      ])),
    ]),
    chapter('shs-e3', 'e1', '机械波', 'Mechanical waves', [
      S('shs-e3-1', '波', 'Waves', lessons([
        ['shs-e3-1a', '波形', 'A waveform', '质点振动方向与波的传播方向。', 'How a particle moves, and which way the wave travels.'],
        ['shs-e3-1b', '干涉与多普勒', 'Interference and Doppler', 'λ、f、v 与频率移动。', 'λ, f, v, and the frequency shift.'],
      ])),
    ]),
    chapter('shs-e4', 'e1', '光', 'Light', [
      S('shs-e4-1', '波动光学', 'Wave optics', lessons([
        ['shs-e4-1a', '全反射', 'Total internal reflection', '临界角。', 'The critical angle.'],
        ['shs-e4-1b', '双缝干涉', 'Double slit', '条纹间距与缝距、波长、屏距。', 'Fringe spacing from slit separation, wavelength, and screen distance.'],
      ])),
    ]),
    chapter('shs-e5', 'e2', '磁场', 'Magnetic fields', [
      S('shs-e5-1', '安培力与洛伦兹力', 'Ampère and Lorentz forces', lessons([
        ['shs-e5-1a', '圆周运动', 'Circular motion', 'r = mv / (qB)。', 'r = mv / (qB).'],
      ])),
    ]),
    chapter('shs-e6', 'e2', '电磁感应', 'Electromagnetic induction', [
      S('shs-e6-1', '法拉第与楞次', 'Faraday and Lenz', lessons([
        ['shs-e6-1a', '感应电流', 'Induced current', '插入与拔出线圈时的方向和大小。', 'Direction and size as a magnet enters or leaves a coil.'],
        ['shs-e6-1b', '自感与涡流', 'Self-inductance and eddy currents', '电流变化与涡流。', 'A changing current, and eddy currents.'],
      ])),
    ]),
    chapter('shs-e8', 'e2', '电磁振荡与传感器', 'Oscillations and sensors', [
      S('shs-e8-1', 'LC 振荡', 'An LC circuit', lessons([
        ['shs-e8-1a', '电场能与磁场能', 'Electric and magnetic energy', '两种能量交替。', 'The two energies alternate.'],
      ])),
    ]),
    chapter('shs-e10', 'e3', '热学', 'Thermal physics', [
      S('shs-e10-1', '气体与热力学', 'Gases and thermodynamics', lessons([
        ['shs-e10-1a', '分子动理论', 'Kinetic theory', '温度、体积、压强。', 'Temperature, volume, pressure.'],
        ['shs-e10-1b', '气体实验定律', 'Gas laws', 'pV、V/T、p/T。', 'pV, V/T, p/T.'],
        ['shs-e10-1c', '热力学第一定律', 'First law', 'ΔU = Q + W，符号按教材约定。', 'ΔU = Q + W, with the textbook’s signs.'],
      ])),
    ]),
    chapter('shs-e13', 'e3', '近代物理', 'Modern physics', [
      S('shs-e13-1', '原子、光子与原子核', 'Atoms, photons, nuclei', lessons([
        ['shs-e13-1a', '能级', 'Energy levels', '跃迁能量差与光谱线。', 'The transition energy and a spectral line.'],
        ['shs-e13-1b', '光电效应', 'Photoelectric effect', '截止频率与爱因斯坦关系。', 'The cutoff frequency and Einstein’s relation.'],
        ['shs-e13-1c', '衰变', 'Decay', '半衰期 N = N0 e^{−λt}。裂变与聚变只作为质量差对应的能量释放，不涉及装置。', 'Half-life N = N0 e^{−λt}. Fission and fusion stay at the energy tied to a mass difference, with no device.'],
      ])),
    ]),
  ],
};
