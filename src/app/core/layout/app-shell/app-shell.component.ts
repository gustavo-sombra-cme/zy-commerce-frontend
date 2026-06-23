import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthSessionService } from '../../auth/auth-session.service';
import { CartStateService } from '../../../features/cart/data/cart-state.service';

@Component({
  selector: 'zy-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly cartState = inject(CartStateService);
  private readonly router = inject(Router);

  readonly user = this.authSession.user;
  readonly isAdmin = this.authSession.isAdmin;
  readonly cartQuantity = this.cartState.totalQuantity;
  readonly userLabel = computed(() => {
    const user = this.user();
    return user?.displayName || user?.email || 'Signed in';
  });

  logout(): void {
    this.authSession.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
