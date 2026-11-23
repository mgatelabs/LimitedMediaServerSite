import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

interface ExternalLink {
  title: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-link-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, MatListModule, MatDividerModule, TranslocoDirective],
  templateUrl: './link-widget.component.html',
  styleUrl: './link-widget.component.css'
})
export class LinkWidgetComponent {

  links: ExternalLink[] = [
    {
      title: 'GitHub - Limited Media Server 🖥️',
      url: 'https://github.com/mgatelabs/LimitedMediaServer',
      icon: 'code'
    },
    {
      title: 'GitHub - Limited Media Site 🌐',
      url: 'https://github.com/mgatelabs/LimitedMediaServerSite',
      icon: 'code'
    },
    {
      title: 'GitHub - Limited Media Encoder 🎬',
      url: 'https://github.com/mgatelabs/LimitedMediaEncoder',
      icon: 'code'
    },
    {
      title: 'Firefox Extension - Limited Media Tracker 🔍',
      url: 'https://addons.mozilla.org/en-US/firefox/addon/limited-media-tracker/',
      icon: 'extension'
    }
  ];

}
