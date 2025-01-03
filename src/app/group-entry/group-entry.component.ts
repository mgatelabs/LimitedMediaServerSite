import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { first, of, Subject, takeUntil } from 'rxjs';
import { FeatureSelectorComponent } from "../feature-selector/feature-selector.component";
import { ProcessWidgetComponent } from '../process-widget/process-widget.component';
import { UserService } from '../user.service';
import { Utility } from '../utility';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-group-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule, TranslocoDirective],
  templateUrl: './group-entry.component.html',
  styleUrl: './group-entry.component.css'
})
export class GroupEntryComponent {

  ready: boolean = false;

  is_new: boolean = false;

  group_uid: number = 0;
  group_name: string = '';
  group_description: string = '';

  constructor(private userService: UserService, private noticeService: NoticeService, private route: ActivatedRoute, private router: Router) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let entry_uid = params['group_id'] || '';
      if (entry_uid) {
        this.userService.getGroupById(parseInt(entry_uid))
          .pipe(first())
          .subscribe({
            next: data => {
              this.is_new = false;
              this.group_uid = data.id;
              this.group_name = data.name;
              this.group_description = data.description;
              this.ready = true;
            }, error: error => {
              //this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
          }
          );
      } else {
        this.is_new = true;
        this.ready = true;

        this.group_uid = -1;
        this.group_name = '';
        this.group_description = '';
      }
    }
    );
  }


  deleteGroup() {
    if (confirm(this.noticeService.getMessage('msgs.are_sure_delete_group'))) {
      this.userService.removeGroupById(this.group_uid)
        .pipe(first())
        .subscribe({
          next:
            result => {
              if (result) {
                this.router.navigate(['/a-groups']);
              }
            }, error: error => {
              //this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
        }
        );
    }
  }

  createGroup() {

    if (!Utility.isNotBlank(this.group_name)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name":"name"});
      return;
    }

    if (!Utility.isNotBlank(this.group_description)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name":"description"});
      return;
    }

    this.userService.newGroup(this.group_name, this.group_description)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data) {
            if (data.message) {
              //this._snackBar.open(data.message, undefined, {
              //  duration: 2000
              //});
            }
            // Reset
            this.is_new = true;
            this.group_name = '';
            this.group_description = '';
          }
        }, error: error => {
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
  }

}
