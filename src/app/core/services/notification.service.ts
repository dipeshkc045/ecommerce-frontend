import { Injectable, signal } from '@angular/core';
import { AppNotification, NotificationType } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  show(notification: Omit<AppNotification, 'id'>): string {
    const id = crypto.randomUUID();
    const full: AppNotification = {
      duration: 4000,
      dismissible: true,
      ...notification,
      id,
    };

    this._notifications.update(prev => [...prev, full]);

    if (full.duration && full.duration > 0) {
      setTimeout(() => this.dismiss(id), full.duration);
    }

    return id;
  }

  success(title: string, message?: string): string {
    return this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): string {
    return this.show({ type: 'error', title, message, duration: 6000 });
  }

  warning(title: string, message?: string): string {
    return this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string): string {
    return this.show({ type: 'info', title, message });
  }

  dismiss(id: string): void {
    this._notifications.update(prev => prev.filter(n => n.id !== id));
  }

  clearAll(): void {
    this._notifications.set([]);
  }
}
