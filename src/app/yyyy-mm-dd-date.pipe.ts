import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'yyyyMmDdDate',
  standalone: true
})
export class YyyyMmDdDatePipe implements PipeTransform {

  transform(value: string | number): string {
    

    if (!value || value?.toString().length !== 8) {
      return value?.toString() || '';
    }

    let c = parseInt(value.toString());

    const year = Math.floor(c / 10000);
    const month = Math.floor((c % 10000) / 100);
    const day = c % 100;

    // Ensure two-digit month and day
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');

    return `${year}-${monthStr}-${dayStr}`;
  }

}
