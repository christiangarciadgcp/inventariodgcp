import { Injectable, signal, computed } from '@angular/core';

export type SidebarState = 'EXPANDED' | 'HOVER' | 'COLLAPSED';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  sidebarState = signal<SidebarState>('EXPANDED');

  sidebarCollapsed = computed(() => this.sidebarState() !== 'EXPANDED');

  toggleSidebar() {
    const currentState = this.sidebarState();

    if (currentState === 'EXPANDED') {
      this.sidebarState.set('HOVER');
    } else if (currentState === 'HOVER') {
      this.sidebarState.set('COLLAPSED');
    } else {
      this.sidebarState.set('EXPANDED');
    }
  }
}
