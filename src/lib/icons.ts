const BASE_ATTRS = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;

const ICON_BODIES = {
  camera:
    '<rect x="3" y="7" width="18" height="14" rx="3" /><circle cx="12" cy="14" r="4" /><path d="M8 7l2-3h4l2 3" />',
  type: '<path d="M4 7V5h16v2" /><path d="M9 20h6" /><path d="M12 5v15" />',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="14 3 14 9 20 9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />',
  share:
    '<circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="M8 12l8-5" /><path d="M16 17l-8-5" />',
  shield:
    '<path d="M12 3l8 4v5c0 4.6-3.2 8.8-8 9.8C7.2 21.8 4 17.6 4 12V7z" />',
  sparkles:
    '<path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4Z" /><path d="M6 15l0.8 2.4L9 18l-2.2 0.8L6 21l-0.8-2.2L3 18l2.2-0.6Z" /><path d="M18 14l0.9 2.4L21 17l-2.1 0.7L18 20l-0.9-2.3L15 17l2.1-0.6Z" />',
  upload:
    '<path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M4 15v4h16v-4" />',
  image:
    '<rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="10" r="2" /><path d="M21 16l-5-4-3 3-4-3-4 4" />',
  trash:
    '<path d="M3 6h18" /><path d="M8 6v-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />',
  "arrow-up": '<path d="M12 5v14" /><path d="M6 11l6-6 6 6" />',
  "arrow-down": '<path d="M12 19V5" /><path d="M6 13l6 6 6-6" />',
  x: '<path d="M18 6L6 18" /><path d="M6 6l12 12" />',
  info: '<circle cx="12" cy="12" r="9" /><line x1="12" y1="10" x2="12" y2="16" /><line x1="12" y1="7" x2="12" y2="7" />',
  check: '<path d="M20 6L9 17l-5-5" />',
  github:
    '<path d="M15 22v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19.5 4.77 5.07 5.07 0 0 0 19.38 1S18.27.65 15 2.48a13.38 13.38 0 0 0-6 0C5.73.65 4.62 1 4.62 1a5.07 5.07 0 0 0-.12 3.78A5.44 5.44 0 0 0 3 8.52c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8.5 18.13V22" />',
} as const;

export type IconName = keyof typeof ICON_BODIES;

export function iconSvg(name: IconName, size = 20) {
  const body = ICON_BODIES[name] ?? ICON_BODIES.sparkles;
  return `<svg ${BASE_ATTRS} width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}
