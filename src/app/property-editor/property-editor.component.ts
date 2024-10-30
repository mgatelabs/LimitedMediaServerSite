import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessWidgetComponent } from '../process-widget/process-widget.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../user.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatureSelectorComponent } from "../feature-selector/feature-selector.component";
import { PropertyService } from '../property.service';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, ProcessWidgetComponent, MatIconModule, FeatureSelectorComponent],
  templateUrl: './property-editor.component.html',
  styleUrl: './property-editor.component.css'
})
export class PropertyEditorComponent implements OnDestroy {

  ready: boolean = false;

  property_id: string = '';
  property_value: string = '';
  property_comment: string = '';

  constructor(private propertyService: PropertyService, private _snackBar: MatSnackBar, private route: ActivatedRoute) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let property_id = params['property_id'] || '';
      if (property_id) {
        this.propertyService.getPropertyById(property_id).pipe(first()).subscribe(data => {
          this.property_id = data.id;
          this.property_value = data.value;
          this.property_comment = data.comment;
          this.ready = true;
        });
      }
    }
    );
  }

  isNotBlank(value: string): boolean {
    return value.trim().length > 0;
  }

  update() {
    this.propertyService.updatePropertyById(this.property_id, this.property_value).pipe(first()).subscribe(data => {
      if (data.status == 'OK') {
        this._snackBar.open('Property updated', undefined, {
          duration: 2000
        });
      } else {
        this._snackBar.open(data.message || 'Could not update property', undefined, {
          duration: 3000
        });
      }
    });
  }

}
