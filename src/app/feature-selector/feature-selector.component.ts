import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface FeatureLink {
  name: string,
  value: number,
  checked: boolean
}

@Component({
  selector: 'app-feature-selector',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './feature-selector.component.html',
  styleUrl: './feature-selector.component.css'
})
export class FeatureSelectorComponent implements OnChanges {

  features: FeatureLink[] = [];

  @Input() bitmask?: number; // Optional integer input
  @Output() totalUpdated = new EventEmitter<number>(); // Optional output


  constructor(private authService: AuthService) {
    this.features.push({name: 'Manage App', value: this.authService.features.MANAGE_APP, checked: false});
    //this.features.push({name: 'Manage Series', value: this.authService.features.RESERVED_1, checked: false});
    this.features.push({name: 'Manage Books', value: this.authService.features.MANAGE_VOLUME, checked: false});
    this.features.push({name: 'Manage Media', value: this.authService.features.MANAGE_MEDIA, checked: false});
    this.features.push({name: 'Manage Processes', value: this.authService.features.MANAGE_PROCESSES, checked: false});
    
    this.features.push({name: 'General Plugins', value: this.authService.features.GENERAL_PLUGINS, checked: false});
    this.features.push({name: 'Utility Plugins', value: this.authService.features.UTILITY_PLUGINS, checked: false});
    this.features.push({name: 'Book Plugins', value: this.authService.features.VOLUME_PLUGINS, checked: false});
    //this.features.push({name: 'Series Plugins', value: this.authService.features.RESERVED_2, checked: false});
    this.features.push({name: 'Media Plugins', value: this.authService.features.MEDIA_PLUGINS, checked: false});
    
    this.features.push({name: 'View Processes', value: this.authService.features.VIEW_PROCESSES, checked: false});
    this.features.push({name: 'View Books', value: this.authService.features.VIEW_VOLUME, checked: false});
    //this.features.push({name: 'View Series', value: this.authService.features.RESERVED_3, checked: false});
    //this.features.push({name: 'View External', value: this.authService.features.RESERVED_4, checked: false});
    this.features.push({name: 'View Media', value: this.authService.features.VIEW_MEDIA, checked: false});
    
    this.features.push({name: 'Bookmarking', value: this.authService.features.BOOKMARKS, checked: false});

    if (this.bitmask !== undefined) {
      this.applyBitmask(this.bitmask);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detect changes to bitmask input after initial load
    if (changes['bitmask'] && this.bitmask !== undefined) {
      this.applyBitmask(this.bitmask);
      this.updateTotal();  // Optionally recalculate total when bitmask changes
    }
  }

  applyBitmask(bitmask: number) {
    this.features.forEach((feature, index) => {
      feature.checked = !!(bitmask & (feature.value));
    });
  }

  total:number = 0;

  updateTotal() {
    this.total = this.features
      .filter(feature => feature.checked)
      .reduce((sum, feature) => sum + feature.value, 0);

    // Optionally emit the total
    this.totalUpdated.emit(this.total);
  }
}
