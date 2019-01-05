import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class NotificationService {

  constructor(private toastrService: ToastrService) {
  }

  public notify(message: string, title: string = null) {
    this.toastrService.success(message, title);
  }

  public notifyError(message: string, title: string = null) {
    this.toastrService.error(message, title, { tapToDismiss: true });
  }
}
