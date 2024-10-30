import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MediaService } from '../media.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-node-name',
  standalone: true,
  imports: [],
  templateUrl: './node-name.component.html',
  styleUrl: './node-name.component.css'
})
export class NodeNameComponent implements OnChanges, OnInit {

  @Input() node_id: string = '';

  nodeName: string = '';
  nodeRating: number = 0;

  constructor(private mediaService: MediaService) {

  }

  ngOnInit() {
    if (this.node_id) {
      this.refresh();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node_id']) {
      const currentValue = changes['node_id'].currentValue;

      this.node_id = currentValue;

      if (this.node_id) {
        this.refresh();
      }
    }
  }

  refresh() {
    this.mediaService.fetchNode(this.node_id).pipe(first()).subscribe(data => {
      this.nodeName = data.name;
      this.nodeRating = data.rating;
    });
  }

}
