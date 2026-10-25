import { Component, computed, input } from '@angular/core';
import { User } from '../../core/models';

@Component({
  selector: 'app-avatar',
  template: `
    @if (user()?.photo) {
      <img class="av" [style.width.px]="size()" [style.height.px]="size()" [src]="user()!.photo" alt="" />
    } @else {
      <span
        class="av ph"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="size() * 0.4"
        >{{ initial() }}</span
      >
    }
  `,
  styles: [
    `
      :host { display: inline-flex; flex: none; }
      .av { border-radius: 50%; object-fit: cover; display: block; }
      .ph {
        display: grid; place-items: center; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #1a56db, #38bdf8);
      }
    `,
  ],
})
export class AvatarComponent {
  user = input<User | null | undefined>(null);
  size = input(40);
  initial = computed(() => (this.user()?.name ?? '?').trim().charAt(0).toUpperCase() || '?');
}
