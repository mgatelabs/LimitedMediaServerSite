import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '../auth.service';
import { NoticeService } from '../notice.service';
import { MediaFolderTagInfo, MediaFolderTagService } from '../media-folder-tag.service';
import { TagSearch } from '../volume.service';

export interface TagLink {
  name: string,
  value: number,
  checked: boolean
}

@Component({
  selector: 'app-media-folder-tag-chooser',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslocoDirective, MatCheckboxModule],
  templateUrl: './media-folder-tag-chooser.component.html',
  styleUrl: './media-folder-tag-chooser.component.css'
})
export class MediaFolderTagChooserComponent implements OnInit {

  tags: TagLink[] = [];
  tagMap: any = {};
  private _tagsLoaded = false;

  @Input() bits?: number[]; // Optional integer input
  @Output() totalUpdated = new EventEmitter<number[]>(); // Optional output

  constructor(private tagService: MediaFolderTagService, private authService: AuthService, private noticeService: NoticeService) {
  }

  ngOnInit(): void {
    // intentionally left blank - tags load on demand via ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bits'] && this.bits !== undefined) {
      // Load tags on first bits update, then apply bitmask
      if (!this._tagsLoaded) {
        this._loadTagsAndApply(this.bits);
      } else {
        this.applyBitmask(this.bits);
        this.updateTotal();
      }
    }
  }

  private _loadTagsAndApply(bits: number[]) {
    this.tagService.fetchTags().subscribe((tagResult: MediaFolderTagInfo) => {
      this.tags = [];
      let temp: TagLink[] = [];
      for (let i = 0; i < tagResult.tags.length; i++) {
        let tag = tagResult.tags[i];
        let created: TagLink = { name: tag.long, value: tag.bit, checked: false };
        this.tagMap[tag.bit] = created;
        temp.push(created);
      }
      temp.sort((a, b) => a.value - b.value);
      this.tags = temp;
      this._tagsLoaded = true;
      this.applyBitmask(bits);
    });
  }

  applyBitmask(bits: number[]) {
    if (!this._tagsLoaded) {
      return;
    }
    this.tags.forEach((feature, index) => {
      feature.checked = false;
    });
    for (let i = 0; i < bits.length; i++) {
      let value = bits[i];
      let tag = this.tagMap[value];
      if (tag) {
        tag.checked = true;
      } else {
        console.log('Tag Not Fount');
      }
    }
    this.updateTotal();
  }

  updateTotal() {
    let result: number[] = [];
    for (let i = 0; i < this.tags.length; i++) {
      let tag = this.tags[i];
      if (tag.checked) {
        result.push(tag.value);
      }
    }
    // Optionally emit the total
    this.totalUpdated.emit(result);
  }

}
