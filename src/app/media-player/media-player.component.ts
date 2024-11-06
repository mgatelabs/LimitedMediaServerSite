import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo, MediaPlaylist, MediaService } from '../media.service';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-media-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdkDrag, CdkDragHandle],
  templateUrl: './media-player.component.html',
  styleUrl: './media-player.component.css'
})
export class MediaPlayerComponent implements OnInit {

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;
  @ViewChild('audioPlayer', { static: false }) audioPlayer: ElementRef;

  private progressInterval: any;

  is_ready: boolean = false;

  videoSourceIndex = -1;
  videoSourceName = '';
  videoSourceUrl: string = '';
  videoProgressToLoad: number = 0;
  videoProgressAvailable: boolean = false;
  videoFile: FileInfo | undefined;
  playlist: MediaPlaylist = { start_index: 0, files: [] }

  audioSourceUrl: string;

  imageSourceUrl: string;

  constructor(private mediaService: MediaService) {

  }

  ngOnInit() {
    //this.showVideo(this.playlist.start_index);
  }

  setData(playlist: MediaPlaylist) {
    this.playlist = playlist;
    if (this.playlist.files.length > 0) {
      this.showItem(this.playlist.start_index);
    }
  }

  showItem(index: number) {
    this.is_ready = true;
    this.videoSourceIndex = index;
    this.videoFile = this.playlist.files[index];
    this.videoSourceName = this.videoFile.name;

    if (this.videoFile.mime_type.startsWith('video')) {
      this.videoSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadVideo();
      this.audioSourceUrl = '';
      this.loadAudio();
      this.imageSourceUrl = '';
      if (this.videoFile.progress) {
        this.videoProgressToLoad = parseFloat(this.videoFile.progress);
        this.videoProgressAvailable = true;
      } else {
        this.videoProgressAvailable = false;
      }
    } else if (this.videoFile.mime_type.startsWith('audio')) {
      this.audioSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadAudio();
      this.videoSourceUrl = '';
      this.loadVideo();
      this.imageSourceUrl = '';
    } else if (this.videoFile.mime_type.startsWith('image')) {
      this.imageSourceUrl = '/api/media/view?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadAudio();
      this.videoSourceUrl = '';
      this.loadVideo();
      this.audioSourceUrl = '';
    } else {

    }
  }

  saveVideoState() {
    let rate = (this.videoPlayer.nativeElement.currentTime / this.videoPlayer.nativeElement.duration);
    if (rate > 0.01) {
      let progress = (rate * 100).toFixed(3).toString();
      if (this.videoFile && this.videoFile.id) {
        this.videoFile.progress = progress
        this.mediaService.putProgress(this.videoFile.id, progress).subscribe(data => {
          // No Op
        });
      }
    }
  }

  prevVideo() {
    this.findNextVideo(-1);
  }

  nextVideo() {
    this.findNextVideo(1);
  }

  getRandomIndex(array: any[], excludeIndex: number): number {
    // Filter out the provided index
    const filteredIndices = array.map((_, index) => index).filter(index => index !== excludeIndex);
    // Select a random index from the filtered array
    const randomIndex = filteredIndices[Math.floor(Math.random() * filteredIndices.length)];
    return randomIndex;
  }

  shuffle() {
    let index = this.getRandomIndex(this.playlist.files, this.videoSourceIndex);
    this.showItem(index);
  }

  findNextVideo(dir: number) {
    if (this.playlist.files.length > 0) {
      let index = this.videoSourceIndex + dir;
      if (index < 0) {
        index = this.playlist.files.length - 1;
      } else if (index >= this.playlist.files.length) {
        index = 0;
      }
      this.showItem(index);
    }
  }

  loadVideo() {
    if (this.videoPlayer && this.videoPlayer.nativeElement) {
      const video: HTMLVideoElement = this.videoPlayer.nativeElement;
      video.load();
    }
  }

  loadAudio() {
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      const video: HTMLAudioElement = this.audioPlayer.nativeElement;
      video.load();
    }
  }

  closeVideo() {
    this.videoSourceUrl = '';
    this.is_ready = false;
  }

  onAudioFinished() {
    this.nextVideo()
  }

  onVideoPlay() {
    this.startProgressTracking();
  }

  onVideoPause() {
    this.stopProgressTracking();
  }

  onVideoEnd() {
    this.stopProgressTracking();
  }

  startProgressTracking() {
    console.log('Starting tracker');

    this.progressInterval = setInterval(() => {
      if (this.videoFile)
        this.saveVideoState();
    }, 25000); // Save progress every 25 seconds
  }

  stopProgressTracking() {
    console.log('Ending tracker');
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }

  restoreProgress() {
    const duration = this.videoPlayer.nativeElement.duration;
    this.videoPlayer.nativeElement.currentTime = (this.videoProgressToLoad / 100) * duration;
  }

  onMetadataLoaded() {
    if (this.videoProgressAvailable) {
      this.videoProgressAvailable = false;
      this.restoreProgress();
    }
  }

  close() {
    // Add a close event or method to close the overlay
  }

  // Fullscreen Toggle

  isFullScreen = false;

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }
}
