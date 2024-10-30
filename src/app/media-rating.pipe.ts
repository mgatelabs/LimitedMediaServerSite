import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mediaRating',
  standalone: true
})
export class MediaRatingPipe implements PipeTransform {

  transform(value: number): string {

    switch(value) {
      case 0: return 'G';
      case 40: return 'PG';
      case 60: return 'PG-13';
      case 80: return 'R-17';
      case 90: return 'R+';
      case 100: return 'Rx';
      case 200: return 'Unrated';
      default: return '??';
    }
  }

}
