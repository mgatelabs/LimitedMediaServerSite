import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { AuthService } from '../auth.service';
import { PropertyDefinition, PropertyService } from '../property.service';
import { first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-property-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, TranslocoDirective, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './property-listing.component.html',
  styleUrl: './property-listing.component.css'
})
export class PropertyListingComponent {

  properties: PropertyDefinition[] = [];

  isLoading: boolean = true;

  constructor(private authService: AuthService, private propertyService: PropertyService) {

  }

  ngOnInit() {
    this.propertyService.listPropertiess().pipe(first()).subscribe({
      next: data => {
        this.isLoading = false;
        this.properties = data;
      }, error: error => {
        // Display the error handled by `handleCommonError`
        //this._snackBar.open(error.message, undefined, { duration: 3000 });
      }
    });
  }

}
