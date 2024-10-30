import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MediaService, NodeDefinition } from '../media.service';
import {MatListModule} from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { first } from 'rxjs';

export interface MediaDialogChooserData {
  skipNodeId: string,
  maximumRating: number
}

interface NodeLevel {
  nodes: NodeDefinition[];
  node_id: string;
}

@Component({
  selector: 'app-media-dialog-chooser',
  standalone: true,
  imports: [MatListModule, MatIconModule],
  templateUrl: './media-dialog-chooser.component.html',
  styleUrl: './media-dialog-chooser.component.css'
})
export class MediaDialogChooserComponent implements OnInit {

  node_stack: NodeLevel[] = []; 
  nodes: NodeDefinition[] = [];

  constructor(
    public dialogRef: MatDialogRef<MediaDialogChooserData>,
    @Inject(MAT_DIALOG_DATA) public data: MediaDialogChooserData, private mediaService: MediaService) {

  }

  ngOnInit() {
    this.fetchNodes('');
  }

  fetchNodes(node_id: string) {
    console.log(this.data.maximumRating);
    console.log(this.data.skipNodeId);
    this.mediaService.fetchNodes(node_id).pipe(first()).subscribe(result => {
      this.node_stack.push({node_id: node_id, nodes: result});
      this.nodes = result;
    });

  }

  selectNode(node_id: string): void {
    this.dialogRef.close(node_id);
  }

  popNode(): void {
    this.node_stack.pop();
    this.nodes = this.node_stack[this.node_stack.length - 1].nodes;
  }

  onNoClick(): void {
    this.dialogRef.close('');
  }

}
