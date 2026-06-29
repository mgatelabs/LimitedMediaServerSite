import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaFolderTag, MediaFolderTagService } from '../media-folder-tag.service';
import { NoticeService } from '../notice.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { first, Subject, takeUntil } from 'rxjs';
import { Utility } from '../utility';

@Component({
  selector: 'app-media-folder-tag-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule, MatCardModule, MatButtonModule, TranslocoDirective],
  templateUrl: './media-folder-tag-entry.component.html',
  styleUrl: './media-folder-tag-entry.component.css'
})
export class MediaFolderTagEntryComponent implements OnDestroy, OnInit {

  ready: boolean = false;

  is_new: boolean = false;

  tag_bit: number = 0;
  tag_short: string = '';
  tag_long: string = '';
  tag_description: string = '';

  constructor(private tagService: MediaFolderTagService, private noticeService: NoticeService, private route: ActivatedRoute, private router: Router) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
  
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        let bit_id = params['bit'] || '';
        if (bit_id) {
          this.tagService.getTag(parseInt(bit_id))
            .pipe(first())
            .subscribe({
              next: data => {
                this.is_new = false;
                this.tag_bit = data.tag.bit;
                this.tag_short = data.tag.short;
                this.tag_long = data.tag.long;
                this.tag_description = data.tag.description;
                this.ready = true;
              }, error: error => {
                //this._snackBar.open(error.message, undefined, { duration: 3000 });
              }
            }
            );
        } else {
          this.is_new = true;
          this.ready = true;
  
          this.tag_bit = 0;
          this.tag_short = '';
          this.tag_long = '';
          this.tag_description = '';
        }
      }
      );
    }
  
  
    deleteTag() {
      if (confirm(this.noticeService.getMessage('msgs.are_sure_delete_group'))) {
        this.tagService.deleteTag(this.tag_bit)
          .pipe(first())
          .subscribe({
            next:
              result => {
                if (result) {
                  this.router.navigate(['/a-media/folder/tag/list']);
                }
              }, error: error => {
                //this._snackBar.open(error.message, undefined, { duration: 3000 });
              }
          }
          );
      }
    }
  
    createTag() {
  
      if (!Utility.isNotBlank(this.tag_short)) {
        this.noticeService.handleMessage('msgs.missing_parameter', {"name":"short"});
        return;
      }
  
      if (!Utility.isNotBlank(this.tag_long)) {
        this.noticeService.handleMessage('msgs.missing_parameter', {"name":"long"});
        return;
      }
  
      let tag: MediaFolderTag = {
        bit: this.tag_bit,
        value: 0,
        short: this.tag_short,
        long: this.tag_long,
        description: this.tag_description || '',
      };
  
      this.tagService.createTag(tag)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              if (data.message) {
                //this._snackBar.open(data.message, undefined, {
                //  duration: 2000
                //});
              }
              // Reset
              this.is_new = true;
              this.tag_bit = 0;
              this.tag_short = '';
              this.tag_long = '';
              this.tag_description = '';
            }
          }, error: error => {
            //this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
        );
    }

}
