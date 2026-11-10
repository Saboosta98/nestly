import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'germanDate',
  standalone: true,
})
export class GermanDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '–';
    }
    const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
