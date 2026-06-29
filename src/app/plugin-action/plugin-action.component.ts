import { ChangeDetectorRef, Component, OnDestroy, OnInit, Inject, Optional } from '@angular/core';
import { ActionPlugin, ActionPluginArg, PluginService } from '../plugin.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MediaDialogChooserService } from '../media-dialog-chooser.service';
import { first, Subject, takeUntil } from 'rxjs';
import { NodeNameComponent } from "../node-name/node-name.component";
import { Utility } from '../utility';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';
import { HttpParams } from '@angular/common/http';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PluginDialogService } from '../plugin-dialog.service';

export interface PluginActionInit {
  action_id: string;
  series_id?: string;
  book_id?: string;
  folder_id?: string;
  file_id?: string;
}

/**
 * Screen to run an Plugin
 */
@Component({
  selector: 'app-plugin-action',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NodeNameComponent,
    TranslocoDirective,
    MatSlideToggleModule,
    DragDropModule
  ],
  templateUrl: './plugin-action.component.html',
  styleUrl: './plugin-action.component.css'
})
export class PluginActionComponent implements OnInit, OnDestroy {

  plugin: ActionPlugin = { name: '', id: '', icon: '', args: [], category: '', standalone: false, prefix_lang_id: '' };
  series_id: string = '';
  book_id: string = '';
  file_id: string = '';
  folder_id: string = '';
  showAdvanced: boolean = false;
  //task_id: number = 0;

  choices: Map<string, string> = new Map();

  formGroup: FormGroup;

  public is_dialog: boolean = false;

  isMaximized = false;

  private previousRect?: {
    width: string;
    height: string;
    top: string;
    left: string;
    maxHeigth: string;
  };

  constructor(
    private mediaDialogChooserService: MediaDialogChooserService,
    private fb: FormBuilder,
    private pluginService: PluginService,
    private route: ActivatedRoute,
    private noticeService: NoticeService,
    private popupService: PluginDialogService,
    @Optional() private dialogRef?: MatDialogRef<PluginActionComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData?: any
  ) {
    this.formGroup = this.fb.group({});
  }

  close(): void {
    this.dialogRef?.close();
  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.dialogData) {
      this.is_dialog = true;
      this.initFromData(this.dialogData);
    } else {
      this.is_dialog = false;
      this.initFromRoute();
    }
  }

  private initFromRoute(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.initFromData({
          action_id: params['action_id'],
          series_id: params['series_id'] || '',
          book_id: params['book_id'] || '',
          folder_id: params['folder_id'] || '',
          file_id: params['file_id'] || ''
        });
      });
  }

  private initFromData(init: PluginActionInit): void {
    this.series_id = init.series_id ?? '';
    this.book_id = init.book_id ?? '';
    this.folder_id = init.folder_id ?? '';
    this.file_id = init.file_id ?? '';

    this.pluginService.getPlugins()
      .pipe(first())
      .subscribe(data => {
        const possible = data.find(item => item.id === init.action_id);
        if (!possible) {
          return;
        }

        this.plugin = possible;
        this.prep();
        this.ready();
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
      if (arg.clear_after && arg.clear_after == 'yes') {
        let control = this.formGroup.get(arg.id);
        if (control) {
          control.setValue('');
        }
      } else if (arg.type === 'filename') {
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
            this.popupService.openProcessStatus({ task_id: data.task_id });
          }
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

  private tryToUpdateFieldFromPaste(text: string, field_id: string, text_key: string): boolean {
    if (field_id && text_key) {
      let converted = Utility.extractUrlValue(text, text_key); // This
      if (Utility.isNotBlank(converted)) {
        this.formGroup.patchValue({ [field_id]: converted });
        return true;
      }
    }
    return false;
  }

  pasteUrl(field_id: string, textToFind: string = 'url', alt_field_id: string = '', alt_textToFind: string = '') {
    let entered = navigator.clipboard.readText().then(text => {
      if (this.tryToUpdateFieldFromPaste(text, field_id, textToFind)) {
        this.tryToUpdateFieldFromPaste(text, alt_field_id, alt_textToFind);
      } else if (Utility.isNotBlank(text)) {
        this.formGroup.patchValue({ [field_id]: text });
      }
    });
  }

  extractProxy(field_id: string) {
    this.extractAndSaveNestedUrl(field_id, this.formGroup)
  }

  /**
 * Extracts a nested URL from query string parameters in a field and updates the FormGroup.
 * 
 * @param fieldId - The ID of the field in the FormGroup.
 * @param formGroup - The FormGroup containing the field.
 */
  extractAndSaveNestedUrl(fieldId: string, formGroup: FormGroup): void {
    const fieldValue = formGroup.get(fieldId)?.value;

    if (!fieldValue || typeof fieldValue !== 'string') {
      console.warn(`Field '${fieldId}' is empty or not a string.`);
      return;
    }

    try {
      // Extract query string manually if present
      const queryString = fieldValue.includes('?') ? fieldValue.split('?')[1] : '';

      if (!queryString) {
        console.warn(`No query string found in field '${fieldId}'.`);
        return;
      }

      const params = new HttpParams({ fromString: queryString });

      // Iterate through the parameters and find one starting with 'http'
      let nestedUrl: string | null = null;
      params.keys().forEach(key => {
        const value = params.get(key);

        if (!value) return;

        if (value.startsWith('http')) {
          // Case 1: Already a full URL
          nestedUrl = value;
        } else {
          // Case 2: Try to decode base64
          try {
            const decoded = atob(value);

            if (decoded.startsWith('http')) {
              nestedUrl = decoded;
            }
          } catch (e) {
            // Not valid base64, ignore
          }
        }
      });

      if (nestedUrl) {
        formGroup.patchValue({ [fieldId]: nestedUrl });
        console.log(`Extracted nested URL: ${nestedUrl}`);
      } else {
        console.warn(`No nested URL found in the query parameters of '${fieldId}'.`);
      }
    } catch (error) {
      console.error(`Failed to process query string in field '${fieldId}':`, error);
    }
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

  updateFilename(fieldname: string, seasonDiff: number, episodeDiff: number, endingDiff: string, setOnly: boolean = false) {
    let control = this.formGroup.get(fieldname);
    if (control) {
      let value = control?.value || '';

      if (!Utility.isNotBlank(value)) {
        value = 'S01E00';
      }

      const regex = /(S\d{2}E\d{2}[A-Z]?)(\.[a-zA-Z0-9]+)?$/;
      const matches = value.match(regex);

      if (matches) {
        let baseFilename = matches[1]; // SXXEXX with optional ending letter
        let extension = matches[2] || ''; // Preserve extension if present

        const detailsRegex = /S(\d{2})E(\d{2})([A-Z])?/;
        const detailsMatches = baseFilename.match(detailsRegex);

        if (detailsMatches) {
          let season = parseInt(detailsMatches[1]);
          let episode = parseInt(detailsMatches[2]);
          let ending = detailsMatches[3] || '';

          season += seasonDiff;
          if (season < 0) {
            season = 0;
          }
          if (seasonDiff > 0) {
            episode = 1;
          }
          if (setOnly) {
            episode = episodeDiff;
          } else {
            episode += episodeDiff;
          }
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

          control.setValue(`${this.formatSeasonEpisode(season, episode, ending)}${extension}`);
        }
      }

    }
  }


  onFilenameChange(fieldname: string, event: any): void {
    const selectedValue = event.value;
    this.updateFilename(fieldname, 0, 0, selectedValue)
  }

  getPluginName(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.name', {}, plugin.name)
    }
    return plugin.name;
  }

  getPluginTitle(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.title', {}, plugin.name)
    }
    return '';
  }

  private getOverlayPane(): HTMLElement | null {
    console.log(this.dialogRef);
    return this.dialogRef
      ? (this.dialogRef as any)._ref?.overlayRef?._pane
      : null;
  }

  toggleMaximize(): void {
    const overlayPane = this.getOverlayPane();
    if (!overlayPane) {
      console.log('No Overlay Panel');
      return;
    }

    if (!this.isMaximized) {
      // Save current geometry
      const style = overlayPane.style;
      this.previousRect = {
        width: style.width,
        height: style.height,
        top: style.top,
        left: style.left,
        maxHeigth: style.maxHeight
      };

      // Maximize
      style.top = '0';
      style.left = '0';
      style.width = '100vw';
      style.height = '100vh';
      style.maxHeight = '100vh';

      this.isMaximized = true;
    } else {
      // Restore
      if (this.previousRect) {
        overlayPane.style.width = this.previousRect.width;
        overlayPane.style.height = this.previousRect.height;
        overlayPane.style.top = this.previousRect.top;
        overlayPane.style.left = this.previousRect.left;
        overlayPane.style.maxHeight = this.previousRect.maxHeigth;
      }

      this.isMaximized = false;
    }
  }
}
