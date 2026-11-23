import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TranslocoModule } from '@jsverse/transloco';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-process-log-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
    TranslocoModule,
  ],
  templateUrl: './process-log-card.component.html',
  styleUrl: './process-log-card.component.css'
})
export class ProcessLogCardComponent implements OnChanges {
  @Input({ required: true }) logs: any[] = [];
  @Input({ required: true }) getIcon!: (log: any) => string;
  @Input({ required: true }) getClass!: (log: any) => string;
  @Input({ required: true }) copy!: (text: string) => void;

  // Paging
  @Input() logTotal: number = 0;
  @Input() logPageSize: number = 50;
  @Input() logPageIndex: number = 0;
  @Input() pageSizeOptions: number[] = [25, 50, 100, 250];
  @Input() hidePageSize: boolean = false;
  @Input() showFirstLast: boolean = true;
  @Output() pageChange = new EventEmitter<any>();

  isMobile = this.breakpoint.observe(Breakpoints.Handset).pipe(map(result => result.matches));

  constructor(
    private breakpoint: BreakpointObserver,
    private sanitizer: DomSanitizer
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['logs']?.currentValue) {
      this.renderMarkdownLogs();
    }
  }

  renderMarkdownLogs() {
    for (const log of this.logs) {
      if ((log as any).fmt === 'md' && !(log as any)._renderedHtml) {
        try {
          const text = String((log as any).text || '');
          const rawHtml = marked.parse(text, { async: false }) as string;
          const sanitized = DOMPurify.sanitize(rawHtml);
          (log as any)._renderedHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized) as SafeHtml;
        } catch {
          log.text = String(log.text || '');
        }
      }
    }
  }

  isMarkdown(log: any): boolean {
    return log?.fmt === 'md';
  }

  getRenderedHtml(log: any): SafeHtml | undefined {
    return (log as any)?._renderedHtml;
  }

  trackByLog = (_: number, log: any) => log.id ?? log.time;

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getSafeText(log: any): SafeHtml | string {
    if (this.isMarkdown(log)) {
      return (log as any)._renderedHtml ?? log.text ?? '';
    }
    return this.escapeHtml(String(log.text || ''));
  }
}
