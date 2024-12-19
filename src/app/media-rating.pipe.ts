import { Pipe, PipeTransform } from '@angular/core';
import { NoticeService } from './notice.service';

@Pipe({
  name: 'mediaRating',
  standalone: true
})
export class MediaRatingPipe implements PipeTransform {

  constructor(private noticeService: NoticeService) {

  }

  transform(value: number): string {
    switch (value) {
      case 0: return this.noticeService.getMessage('form.rating_g');
      case 40: return this.noticeService.getMessage('form.rating_pg');
      case 60: return this.noticeService.getMessage('form.rating_pg13');
      case 80: return this.noticeService.getMessage('form.rating_r17');
      case 90: return this.noticeService.getMessage('form.rating_rplus');
      case 100: return this.noticeService.getMessage('form.rating_rx');
      case 200: return this.noticeService.getMessage('form.rating_unrated');
    }
    return '?';
  }

}
