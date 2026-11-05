import { chapter, queued, ready, section } from './helpers.js';

const Q = queued;
const R = ready;

function door(id, zh, en, items) {
  return chapter(id, 'uni', zh, en, [
    section(`${id}-s`, zh, en, items.map((item) => Q(item[0], item[1], item[2], item[3], item[4]))),
  ]);
}

/** Subject entrances, not another textbook volume. Classical mechanics is the first entrance with simulations. */
export const university = {
  id: 'university',
  region: 'university',
  stage: 'university',
  tocConfidence: 'entrance-map',
  title: { zh: '大学物理 · 学科入口', en: 'University physics · entrances' },
  edition: {
    zh: '不按“第四册”平铺。经典力学入口的五个模型已经可以上课，其余入口仍只列出关系。',
    en: 'Not a fourth textbook. The five classical-mechanics models can be taught. The other entrances still list the relation only.',
  },
  volumes: [{ id: 'uni', zh: '学科入口', en: 'Entrances' }],
  chapters: [
    chapter('uni-cm', 'uni', '经典力学进阶', 'Classical mechanics', [
      section('uni-cm-s', '经典力学进阶', 'Classical mechanics', [
        R('uni-cm-1', 'oscillator', '拉格朗日与哈密顿', 'Lagrangian and Hamiltonian',
          '弹簧振子 L = T − V，H = T + V。x = A cos(ωt) 同时满足牛顿第二定律和欧拉–拉格朗日方程，H 保持 ½kA²。',
          'For the spring, L = T − V and H = T + V. x = A cos(ωt) satisfies both Newton’s second law and the Euler–Lagrange equation, and H stays at ½kA².',
          { m: 0.5, k: 8, A: 0.12 }),
        R('uni-cm-2', 'rigid-disk', '刚体转动', 'Rigid rotation',
          '均匀圆盘绕中心：τ = R F sinφ，I = ½ M R²，α = τ / I。φ 从半径量起。',
          'A uniform disk about its centre: τ = R F sinφ, I = ½ M R², α = τ / I. φ is measured from the radius.',
          { M: 2, R: 0.2, F: 4, phi: 90 }),
        R('uni-cm-3', 'pendulum-pair', '非线性摆', 'A nonlinear pendulum',
          'θ\'\' = −(g/L) sinθ。两个摆只差一个小的初始角度，角分离会随时间变化。能量按 ½(Lθ\')² + gL(1−cosθ) 计算。',
          'θ\'\' = −(g/L) sinθ. Two pendulums start a small angle apart, and that separation changes with time. Energy is ½(Lθ\')² + gL(1−cosθ).',
          { g: 9.8, L: 1, theta0: 2.5, delta: 0.02 }),
        R('uni-cm-4', 'central-orbit', '有心力', 'Central forces',
          '发射方向垂直于半径。比能量 ½v² − GM/r 决定圆、椭圆、抛物线或双曲线。GM 是这个模型的参数。',
          'The launch is perpendicular to the radius. The specific energy ½v² − GM/r selects a circle, ellipse, parabola, or hyperbola. GM is this model’s parameter.',
          { GM: 1, r: 1, v: 1 }),
        R('uni-cm-5', 'normal-modes', '两体简正模', 'Normal modes',
          '两堵墙、两个等质量物块、三根等劲度弹簧。对称模 ω = √(k/m)，反对称模 ω = √(3k/m)。',
          'Two walls, two equal masses, three equal springs. The symmetric frequency is √(k/m) and the antisymmetric frequency is √(3k/m).',
          { m: 1, k: 4, A1: 0.4, A2: 0.25 }),
      ]),
    ]),
    door('uni-em', '电磁学进阶', 'Electromagnetism', [
      ['uni-em-1', '麦克斯韦方程组', 'Maxwell’s equations', '真空中的平面波由这组方程得出。', 'A plane wave in vacuum from the equations.'],
      ['uni-em-2', '传输线', 'Transmission line', '电报方程。', 'The telegrapher’s equations.'],
      ['uni-em-3', '电偶极辐射', 'Dipole radiation', '远场的公开角分布。', 'The public far-field angular pattern.'],
      ['uni-em-4', '镜像法', 'Method of images', '导体平面前的点电荷。', 'A point charge in front of a conducting plane.'],
      ['uni-em-5', '波导截止', 'Waveguide cutoff', '截止频率的公开公式。', 'The public cutoff frequency.'],
    ]),
    door('uni-th', '热与统计物理', 'Thermal and statistical physics', [
      ['uni-th-1', '理想气体', 'Ideal gas', 'pV = nRT。', 'pV = nRT.'],
      ['uni-th-2', '麦克斯韦分布', 'Maxwell distribution', '速率分布。', 'The speed distribution.'],
      ['uni-th-3', '卡诺循环', 'Carnot cycle', '两条等温线与两条绝热线。', 'Two isotherms and two adiabats.'],
      ['uni-th-4', '伊辛模型', 'Ising model', '二维格子上的梅特罗波利斯抽样。', 'Metropolis sampling on a two-dimensional lattice.'],
      ['uni-th-5', '热力学第一定律', 'First law', 'ΔU = Q + W。', 'ΔU = Q + W.'],
    ]),
    door('uni-qm', '量子物理', 'Quantum physics', [
      ['uni-qm-1', '波包', 'Wave packet', '自由粒子高斯波包。', 'A free Gaussian packet.'],
      ['uni-qm-2', '无限深势阱', 'Infinite well', '能级与驻波。', 'Levels and standing waves.'],
      ['uni-qm-3', '势垒隧穿', 'Barrier tunneling', '一维方势垒的透射系数。', 'Transmission for a one-dimensional rectangular barrier.'],
      ['uni-qm-4', '氢原子', 'Hydrogen', '径向概率密度。', 'The radial probability density.'],
      ['uni-qm-5', '自旋', 'Spin', '施特恩–格拉赫的两种结果。', 'The two Stern–Gerlach outcomes.'],
      ['uni-qm-6', '纠缠', 'Entanglement', '贝尔态的关联，不是通信协议。', 'Correlations of a Bell state, not a communication protocol.'],
    ]),
    door('uni-wv', '振动与波进阶', 'Waves', [
      ['uni-wv-1', '耦合振子', 'Coupled oscillators', '简正模。', 'Normal modes.'],
      ['uni-wv-2', '二维波动方程', 'Two-dimensional wave equation', '膜的振动。', 'A vibrating membrane.'],
      ['uni-wv-3', '傅里叶级数', 'Fourier series', '把周期函数拆成谐波。', 'A periodic function as harmonics.'],
      ['uni-wv-4', '拍频', 'Beats', '两个相近频率。', 'Two close frequencies.'],
      ['uni-wv-5', '色散', 'Dispersion', '相速度与群速度。', 'Phase velocity and group velocity.'],
    ]),
    door('uni-op', '光学进阶', 'Optics', [
      ['uni-op-1', '双缝的定量', 'Double slit, quantitative', '条纹间距。', 'Fringe spacing.'],
      ['uni-op-2', '单缝衍射', 'Single-slit diffraction', '极小位置。', 'The minima.'],
      ['uni-op-3', '薄膜', 'Thin films', '光程差与干涉条件。', 'Path difference and the interference condition.'],
      ['uni-op-4', '马吕斯定律', 'Malus’s law', 'I = I0 cos²θ。', 'I = I0 cos²θ.'],
      ['uni-op-5', '激光腔', 'A laser cavity', '腔模的频率间隔，不涉及增益介质的制备。', 'The frequency spacing of cavity modes, not how to prepare a gain medium.'],
    ]),
  ],
};

