import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { AuthService } from '../auth.service';
import { PropertyDefinition, PropertyService } from '../property.service';
import { first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-property-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatFormFieldModule, TranslocoDirective, MatToolbarModule, MatPaginatorModule, MatGridListModule, MatListModule, MatCardModule, MatDividerModule, LoadingSpinnerComponent, MatInputModule],
  templateUrl: './property-listing.component.html',
  styleUrl: './property-listing.component.css'
})
export class PropertyListingComponent {

  properties: PropertyDefinition[] = [];
  filteredProperties: PropertyDefinition[] = [];

  isLoading: boolean = true;

  searchQuery: string = '';

  constructor(private authService: AuthService, private propertyService: PropertyService) {

  }

  ngOnInit() {
    this.propertyService.listPropertiess().pipe(first()).subscribe({
      next: data => {
        this.isLoading = false;
        this.properties = data;
        this.filteredProperties = data;
      }, error: error => {
        // Display the error handled by `handleCommonError`
        //this._snackBar.open(error.message, undefined, { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchQuery = value;
    
    if (!value) {
      this.filteredProperties = [...this.properties];
      return;
    }
    
    this.filteredProperties = this.properties.filter(property => 
      (property.id && property.id.toString().toLowerCase().includes(value)) ||
      (property.comment && property.comment.toLowerCase().includes(value))
    );
  }

}
