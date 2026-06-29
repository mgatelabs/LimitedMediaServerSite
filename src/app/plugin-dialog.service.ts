import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PluginActionComponent } from './plugin-action/plugin-action.component';
import { QuickProcessInfoComponent } from './quick-process-info/quick-process-info.component';

export interface PluginDialogOptions {
  modal?: boolean;
  width?: string;
  data?: any;
}

export interface ProcessStatusDialogOptions {
  modal?: boolean;
  width?: string;
  task_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class PluginDialogService {

  constructor(private dialog: MatDialog) {}

  openPluginAction(options: PluginDialogOptions = {}): MatDialogRef<PluginActionComponent> {
    return this.dialog.open(PluginActionComponent, {
      width: 'auto',
      height: 'auto',
      data: options.data,
      hasBackdrop: options.modal !== false,
      disableClose: options.modal === true,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'plugin-dialog'
    });
  }


  /**
   * Opens a NON-MODAL process status dialog.
   * This dialog is intentionally non-blocking and user-dismissible.
   */
  openProcessStatus(
    options: ProcessStatusDialogOptions
  ): MatDialogRef<QuickProcessInfoComponent> {

    return this.dialog.open(QuickProcessInfoComponent, {
      width: options.width ?? '560px',
      height: 'auto',
      data: {
        task_id: options.task_id
      },
      hasBackdrop: false,
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'plugin-dialog'
    });
  }

}
