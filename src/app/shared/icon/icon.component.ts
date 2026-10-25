import { Component, computed, input } from '@angular/core';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

/** Stroke icons (Lucide-style, 24×24). Each entry is a list of path strings. */
const ICONS: Record<string, string[]> = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', circle(12, 7, 4)],
  bell: ['M7.9 20A9 9 0 1 0 4 16.1L2 22z'],
  news: [rect(4, 3, 16, 18, 2), 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  sparkles: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M19 17v4', 'M17 19h4'],
  globe: [circle(12, 12, 10), 'M2 12h20', 'M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z'],
  bookmark: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  image: [rect(3, 3, 18, 18, 2), circle(9, 9, 2), 'M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21'],
  smile: [circle(12, 12, 10), 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01'],
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4z'],
  heart: ['M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z'],
  comment: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  more: [circle(12, 12, 1), circle(19, 12, 1), circle(5, 12, 1)],
  key: ['M21 2l-2 2', circle(7.5, 15.5, 5.5), 'M11.4 11.6L15.5 7.5', 'M15.5 7.5l3 3L22 7l-3-3'],
  mail: [rect(2, 4, 20, 16, 2), 'M22 7l-8.97 5.7a2 2 0 0 1-2.06 0L2 7'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  calendar: [rect(3, 4, 18, 18, 2), 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  at: [circle(12, 12, 4), 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8'],
  search: [circle(11, 11, 8), 'M21 21l-4.3-4.3'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M19 8v6', 'M22 11h-6'],
  check: ['M20 6L9 17l-5-5'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  edit: ['M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  lock: [rect(3, 11, 18, 11, 2), 'M7 11V7a5 5 0 0 1 10 0v4'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', circle(12, 13, 4)],
  chevron: ['M6 9l6 6 6-6'],
  arrowLeft: ['M19 12H5', 'M12 19l-7-7 7-7'],
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: [':host { display: inline-flex; flex: none; line-height: 0; }'],
})
export class IconComponent {
  name = input.required<string>();
  size = input(18);
  paths = computed(() => ICONS[this.name()] ?? []);
}
