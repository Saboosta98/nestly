import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'centsCurrency',
  standalone: true,
})
export class CentsCurrencyPipe implements PipeTransform {
  transform(
    cents: number | null | undefined,
    options: { signed?: boolean; compact?: boolean } = {},
  ): string {
    if (cents == null || Number.isNaN(cents)) {
      return '–';
    }

    const euros = cents / 100;
    const absolute = Math.abs(euros);
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: options.compact && Number.isInteger(absolute) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(absolute);

    if (options.signed) {
      if (cents > 0) {
        return `+${formatted}`;
      }
      if (cents < 0) {
        return `−${formatted}`;
      }
    }

    if (cents < 0) {
      return `−${formatted}`;
    }

    return formatted;
  }
}
