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
  imports: [FormsModule, CommonModule, TranslocoDirective],
  templateUrl: './media-folder-tag-chooser.component.html',
  styleUrl: './media-folder-tag-chooser.component.css'
})
export class MediaFolderTagChooserComponent implements OnInit {

  tags: TagLink[] = [];
  tagMap: any = {};
  savedTags: number[] = [];
  ready: boolean = false;

  @Input() bits?: number[]; // Optional integer input
  @Output() totalUpdated = new EventEmitter<number[]>(); // Optional output

  constructor(private tagService: MediaFolderTagService, private authService: AuthService, private noticeService: NoticeService) {
    //if (this.bitmask !== undefined) {
    //  this.applyBitmask(this.bitmask);
    //}
  }

  ngOnInit(): void {
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
      //console.log('Tag Map', this.tagMap);
      this.ready = true;
      if (this.savedTags.length > 0) {
        this.applyBitmask(this.savedTags);
        this.savedTags = [];
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detect changes to bitmask input after initial load
    if (changes['bits'] && this.bits !== undefined) {
      this.applyBitmask(this.bits);
      this.updateTotal();  // Optionally recalculate total when bitmask changes
    }
  }

  applyBitmask(bits: number[]) {
    if (!this.ready) {
      this.savedTags = bits;
      return;
    }
    this.tags.forEach((feature, index) => {
      feature.checked = false;
    });
    //console.log(this.tagMap);
    for (let i = 0; i < bits.length; i++) {
      let value = bits[i];
      //console.log('Checking Bit', value);
      let tag = this.tagMap[value];
      if (tag) {
        //console.log('Tag Checked');
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
