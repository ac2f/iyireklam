// 24x24 çizgi ikonlar (stroke=currentColor). Satır içi SVG olarak kullanılır.
const P = {
  letters: '<path d="M3 19 7.5 7 12 19M5 15h5"/><path d="M15 7v12h3a3 3 0 0 0 0-6h-3h2.6a2.8 2.8 0 0 0 0-6H15"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4 7.5 9 12 20M15 4l1.5 5L12 20"/>',
  lightbox: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h10M9 9.5h6M12 2v2M5 3l1.5 1.7M19 3l-1.5 1.7"/>',
  totem: '<rect x="8" y="2.5" width="8" height="16" rx="1.5"/><path d="M10.5 7h3M10.5 10.5h3M10.5 14h2M6 21.5h12"/>',
  door: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="7" cy="8" r=".7"/><circle cx="17" cy="8" r=".7"/><circle cx="7" cy="16" r=".7"/><circle cx="17" cy="16" r=".7"/><path d="M8.5 11h7M10 14h4"/>',
  router: '<path d="M12 3v8M9 11h6l-1 3h-4zM12 14v3"/><path d="M4 21h16M6 21v-3h12v3"/>',
  laser: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  print: '<path d="M7 8V3.5h10V8"/><path d="M7 17H4.5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H17"/><path d="M7 14h10v6.5H7z"/>',
  users: '<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 6 18.5V20"/><circle cx="11" cy="8.5" r="3"/><path d="M18 20v-1a3 3 0 0 0-2-2.8M16.5 5.7a3 3 0 0 1 0 5.6"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  pin: '<path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  whatsapp: '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h6"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5" opacity=".6"/>',
};

export function icon(name, cls = '') {
  const body = P[name] || P.spark;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const checkIcon = () => icon('check');
