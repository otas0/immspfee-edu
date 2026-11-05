import { chapter, queued, section } from './helpers.js';

const Q = queued;

function door(id, zh, en, items) {
  return chapter(id, 'uni', zh, en, [
    section(`${id}-s`, zh, en, items.map(([sid, sz, se, iz, ie]) => Q(sid, sz, se, iz, ie))),
  ]);
}

/** Subject entrances, not another textbook volume. Each slot is a core model to deepen later. */
export const university = {
  id: 'university',
  region: 'university',
  stage: 'university',
  tocConfidence: 'entrance-map',
  title: { zh: '大学物理 · 学科入口', en: 'University physics · entrances' },
  edition: {
    zh: '不按“第四册”平铺。每个入口下列出以后要做深的核心模型，现在都还没有模拟。',
    en: 'Not a fourth textbook. Each entrance lists core models to deepen later. None of them is simulated yet.',
  },
  volumes: [{ id: 'uni', zh: '学科入口', en: 'Entrances' }],
  chapters: [
    door('uni-cm', '经典力学进阶', 'Classical mechanics', [
      ['uni-cm-1', '拉格朗日与哈密顿', 'Lagrangian and Hamiltonian', '由拉格朗日量得到运动方程。', 'Equations of motion from a Lagrangian.'],
      ['uni-cm-2', '刚体转动', 'Rigid rotation', '欧拉方程的公开形式。', 'Euler’s equations in their public form.'],
      ['uni-cm-3', '混沌', 'Chaos', '双摆或非线性摆。', 'A double pendulum or a nonlinear pendulum.'],
      ['uni-cm-4', '有心力', 'Central forces', '轨道由有心力得出。', 'Orbits from a central force.'],
      ['uni-cm-5', '两体简正模', 'Normal modes', '耦合振子的简正模。', 'Normal modes of coupled oscillators.'],
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
