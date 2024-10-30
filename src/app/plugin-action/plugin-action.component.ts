import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActionPlugin, PluginService, PluginValue } from '../plugin.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessWidgetComponent } from '../process-widget/process-widget.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MediaDialogChooserService } from '../media-dialog-chooser.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MediaService } from '../media.service';
import { NodeNameComponent } from "../node-name/node-name.component";
import { Utility } from '../utility';

/**
 * Screen to run an Plugin
 */
@Component({
  selector: 'app-plugin-action',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatToolbarModule, ProcessWidgetComponent, MatFormFieldModule, MatSelectModule, MatInputModule, NodeNameComponent],
  templateUrl: './plugin-action.component.html',
  styleUrl: './plugin-action.component.css'
})
export class PluginActionComponent implements OnInit, OnDestroy {

  plugin: ActionPlugin = { name: '', id: '', icon: '', args: [] , category: '', standalone: false};
  series_id: string = '';
  book_id: string = '';
  file_id: string = '';
  folder_id: string = '';

  task_id: number = 0;

  choices: Map<string, string> = new Map();

  formGroup: FormGroup;

  constructor(private mediaDialogChooserService: MediaDialogChooserService, private mediaService: MediaService, private fb: FormBuilder, private pluginService: PluginService, private route: ActivatedRoute, private _snackBar: MatSnackBar) {
    this.formGroup = this.fb.group({});
  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {

      let action_id = params['action_id'];
      this.series_id = params['series_id'] || '';
      this.book_id = params['book_id'] || '';
      this.folder_id = params['folder_id'] || '';
      this.file_id = params['file_id'] || '';


      this.pluginService.getPlugins()
        .pipe(first())
        .subscribe(data => {
          let possible = data.find(item => item.id == action_id);
          if (possible) {
            this.plugin = possible;
            this.prep();
            this.ready();
          }
        });

    });
  }


  onReset() {
    this.prep();
    this.ready();
  }

  prep() {
    this.choices.clear();
    for (let arg of this.plugin.args) {
      this.choices.set(arg.id, arg.default ? arg.default : '');
    }
    if (this.series_id) {
      this.choices.set('series_id', this.series_id);
    } else if (this.book_id) {
      this.choices.set('series_id', this.book_id);
    } else if (this.file_id) {
      this.choices.set('file_id', this.file_id);
    } else if (this.folder_id) {
      this.choices.set('folder_id', this.folder_id);
    }
  }

  ready() {
    this.formGroup = this.fb.group({});
    this.plugin.args.forEach(arg => {
      this.formGroup.addControl(arg.id, new FormControl(this.choices.get(arg.id)));
    });
  }

  executeForm() {
    this.choices.clear();

    Object.keys(this.formGroup.controls).forEach(key => {
      this.choices.set(key, this.formGroup.get(key)?.value || '');
    });

    this.send();
  }

  send() {
    this.pluginService.runActionPlugin(this.plugin, this.choices)
      .pipe(first())
      .subscribe(data => {
        if (data['message']) {
          this._snackBar.open(data['message'], undefined, {
            duration: 3000
          });
        }
        if (data['task_id']) {
          this.task_id = parseInt(data['task_id']);
        }
      });
  }

  showChooser(choose_type: string, field_id: string) {
    if (choose_type === 'mfcmf') {
      this.mediaDialogChooserService.openDialog(this.folder_id, 200).pipe(first()).subscribe(result => {
        this.formGroup.patchValue({ [field_id]: result });
      });
    } else if (choose_type === 'mfc') {
      this.mediaDialogChooserService.openDialog('', 200).pipe(first()).subscribe(result => {
        this.formGroup.patchValue({ [field_id]: result });
      });
    }
  }

  pasteUrl(field_id: string) {
    let entered = navigator.clipboard.readText().then(text => {
      let converted = Utility.extractUrlValue(text);
      if (Utility.isNotBlank(converted)) {
        this.formGroup.patchValue({ [field_id]: converted });
      }
    });
  }

  getNodeName(node_id: number) {
    //this.mediaService.fetchNode()
  }

}
