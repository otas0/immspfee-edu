export function ready(id, sim, zh, en, introZh, introEn, preset, exam = false) {
  return {
    id, sim, status: 'ready', exam,
    title: { zh, en },
    intro: { zh: introZh, en: introEn },
    preset,
  };
}

export function queued(id, zh, en, intentZh, intentEn) {
  return {
    id, sim: null, status: 'queued',
    title: { zh, en },
    intent: { zh: intentZh, en: intentEn },
  };
}

export function section(id, zh, en, lessons) {
  return { id, title: { zh, en }, lessons };
}

export function chapter(id, volume, zh, en, sections, priority = false) {
  return { id, volume, priority, title: { zh, en }, sections };
}
