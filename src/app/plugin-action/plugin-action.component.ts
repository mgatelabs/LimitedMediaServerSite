import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActionPlugin, ActionPluginArg, PluginService } from '../plugin.service';
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
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

/**
 * Screen to run an Plugin
 */
@Component({
  selector: 'app-plugin-action',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatToolbarModule, ProcessWidgetComponent, MatFormFieldModule, MatSelectModule, MatInputModule, NodeNameComponent, TranslocoDirective],
  templateUrl: './plugin-action.component.html',
  styleUrl: './plugin-action.component.css'
})
export class PluginActionComponent implements OnInit, OnDestroy {

  plugin: ActionPlugin = { name: '', id: '', icon: '', args: [], category: '', standalone: false, prefix_lang_id: '' };
  series_id: string = '';
  book_id: string = '';
  file_id: string = '';
  folder_id: string = '';

  task_id: number = 0;

  choices: Map<string, string> = new Map();

  formGroup: FormGroup;

  constructor(private mediaDialogChooserService: MediaDialogChooserService, private mediaService: MediaService, private fb: FormBuilder, private pluginService: PluginService, private route: ActivatedRoute, private noticeService: NoticeService) {
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

  getFieldName(arg: ActionPluginArg, plugin: ActionPlugin): string {
    if (arg.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + arg.prefix_lang_id + '.' + arg.id + '.name', {}, arg.name);
    } else if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.' + arg.id + '.name', {}, arg.name);
    } else {
      return arg.name;
    }
  }

  getFieldHint(arg: ActionPluginArg, plugin: ActionPlugin): string {
    if (arg.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + arg.prefix_lang_id + '.' + arg.id + '.hint', {}, arg.description);
    } else if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.' + arg.id + '.hint', {}, arg.description);
    } else {
      return arg.description;
    }
  }

  getFieldOptionValue(value_key: string, value_name: string, arg: ActionPluginArg, plugin: ActionPlugin): string {
    if (arg.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + arg.prefix_lang_id + '.' + arg.id + '.opt_' + value_key, {}, value_name);
    } else if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.' + arg.id + '.opt_' + value_key, {}, value_name);
    } else {
      return value_name;
    }
  }

  prep() {
    this.choices.clear();
    for (let arg of this.plugin.args) {
      this.choices.set(arg.id, arg.default ? arg.default : '');
    }
    if (this.series_id) {
      this.choices.set('series_id', this.series_id);
    } else if (this.book_id) {
      this.choices.set('book_id', this.book_id);
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

  sendFinished() {
    for (let arg of this.plugin.args) {
      if (arg.type === 'filename') {
        this.updateFilename(arg.id, 0, 1, '');
      }
    }
  }

  send() {
    this.pluginService.runActionPlugin(this.plugin, this.choices)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data.task_id) {
            this.task_id = data.task_id;
          } else {
            this.task_id = 0;
          }
          //if (data.message) {
          //  this._snackBar.open(data.message, undefined, { duration: 3000 });
          //}
          this.sendFinished();
        }, error: error => {
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
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
      } else if (Utility.isNotBlank(text)) {
        this.formGroup.patchValue({ [field_id]: text });
      }
    });
  }

  getNodeName(node_id: number) {
    //this.mediaService.fetchNode()
  }

  formatSeasonEpisode(season: number, episode: number, ending?: string): string {
    const formattedSeason = season.toString().padStart(2, '0'); // Pads with leading zero if needed
    const formattedEpisode = episode.toString().padStart(2, '0'); // Pads with leading zero if needed

    let result = `S${formattedSeason}E${formattedEpisode}`;

    if (ending) {
      result += ending; // Add ending if provided
    }

    return result;
  }

  updateFilename(fieldname: string, seasonDiff: number, episodeDiff: number, endingDiff: string) {
    let control = this.formGroup.get(fieldname);
    if (control) {
      let value = control?.value || '';

      if (Utility.isNotBlank(value)) {
        const regex = /S(\d{2})E(\d{2})([A-Z])?/;
        const matches = value.match(regex);
        if (matches) {
          let season = parseInt(matches[1]);
          let episode = parseInt(matches[2]);
          let ending = matches[3] || '';  // Default to null if no ending is found

          season += seasonDiff;
          if (season < 0) {
            season = 0;
          }
          episode += episodeDiff;
          if (episode < 0) {
            episode = 0;
          }
          if (endingDiff === 'en') {
            ending = '';
          } else if (endingDiff === 'jp') {
            ending = 'J';
          } else if (endingDiff === 'cn') {
            ending = 'C';
          }
          control.setValue(this.formatSeasonEpisode(season, episode, ending));
        }
      } else {
        control.setValue('S01E01');
      }
    }
  }

  onFilenameChange(fieldname: string, event: any): void {
    const selectedValue = event.value;
    this.updateFilename(fieldname, 0, 0, selectedValue)
  }

  getPluginName(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.'+ plugin.prefix_lang_id + '.name', {}, plugin.name)
    }
    return plugin.name;
  }

  getPluginTitle(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.'+ plugin.prefix_lang_id + '.title', {}, plugin.name)
    }
    return '';
  }
}
