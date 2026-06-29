import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { MediaFolderTag, MediaFolderTagService } from '../media-folder-tag.service';
import { NoticeService } from '../notice.service';
import { first } from 'rxjs';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-media-folder-tag-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatToolbarModule, MatPaginatorModule, MatGridListModule, MatListModule, MatCardModule, MatDividerModule, LoadingSpinnerComponent, TranslocoDirective],
  templateUrl: './media-folder-tag-listing.component.html',
  styleUrl: './media-folder-tag-listing.component.css'
})
export class MediaFolderTagListingComponent {

   tags: MediaFolderTag[] = [];
  
    isLoading: boolean = true;
  
    constructor(private authService: AuthService, private tagService: MediaFolderTagService, private noticeService: NoticeService) {
  
    }
  
    ngOnInit() {
  
      this.tagService.fetchTags().pipe(first())
        .subscribe({
          next: data => {
            this.isLoading = false;
            let tempTags = data.tags;
            tempTags.sort((a,b) => a.bit - b.bit);
            this.tags = tempTags;
          }, error: error => {
            //this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }

}
