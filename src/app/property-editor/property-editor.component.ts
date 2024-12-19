import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../property.service';
import { first, Subject, takeUntil } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, TranslocoDirective, MatIconModule],
  templateUrl: './property-editor.component.html',
  styleUrl: './property-editor.component.css'
})
export class PropertyEditorComponent implements OnDestroy {

  ready: boolean = false;

  property_id: string = '';
  property_value: string = '';
  property_comment: string = '';

  constructor(private propertyService: PropertyService, private route: ActivatedRoute, private noticeService: NoticeService) {

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
        this.propertyService.getPropertyById(property_id).pipe(first()).subscribe({
          next: data => {
            this.property_id = data.id;
            this.property_value = data.value;
            this.property_comment = data.comment;
            this.ready = true;
          }, error: error => {
            
          }
        });
      }
    }
    );
  }

  isNotBlank(value: string): boolean {
    return value.trim().length > 0;
  }

  update() {
    this.propertyService.updatePropertyById(this.property_id, this.property_value).pipe(first()).subscribe({
      next: data => {
        if (data.status == 'OK') {
          //this._snackBar.open('Property updated', undefined, {
          //  duration: 2000
          //});
        } else {
          //this._snackBar.open(data.message || 'Could not update property', undefined, {
          //  duration: 3000
          //});
        }
      }, error: error => {
        // Display the error handled by `handleCommonError`
        //this._snackBar.open(error.message, undefined, { duration: 3000 });
      }
    });
  }

}
