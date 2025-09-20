import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo, MediaPlaylist, MediaService } from '../media.service';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-media-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdkDrag, CdkDragHandle, MatToolbar, MatMenu, MatMenuModule, TranslocoDirective],
  templateUrl: './media-player.component.html',
  styleUrl: './media-player.component.css'
})
export class MediaPlayerComponent implements OnInit {

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;
  @ViewChild('audioPlayer', { static: false }) audioPlayer: ElementRef;
  @ViewChild('chaosBtn', { static: false }) chaosBtn!: ElementRef<HTMLButtonElement>;

  // Chaos
  chaosMode = false;
  private chaosIntervalId: any;
  private strobeTimeoutId: any;

  // Unsafe Streams
  unsafeMode: boolean = false;

  private progressInterval: any;

  supports_xr: boolean = 'xr' in navigator;

  is_ready: boolean = false;

  videoSourceIndex = -1;
  videoSourceName = '';
  videoSourceUrl: string = '';
  videoProgressToLoad: number = 0;
  videoProgressAvailable: boolean = false;
  videoFile: FileInfo | undefined;
  playlist: MediaPlaylist = { start_index: 0, files: [] }

  audioSourceUrl: string;
  endMode: 'next' | 'random' | 'repeat' = 'next';
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
    this.stopChaosMode();

    if (this.videoFile.mime_type.startsWith('video')) {
      if (this.unsafeMode) {
        this.getUnrestrictedStream();
      } else {
        this.videoSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
        this.loadVideo();
      }
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
    if (this.endMode === 'next') {
      this.nextVideo();
    } else if (this.endMode === 'random') {
      this.shuffle();
    } else { // if (this.endMode === 'loop')
      const player: HTMLAudioElement = this.audioPlayer?.nativeElement;
      if (player) {
        player.currentTime = 0; // Reset to start
        player.play(); // Restart playback
      }
    }
  }

  onVideoPlay() {
    this.startProgressTracking();
  }

  onVideoPause() {
    this.stopProgressTracking();
  }

  onVideoEnd() {
    this.stopProgressTracking();
    if (this.endMode == 'next') {
      this.nextVideo();
    } else if (this.endMode == 'random') {
      this.shuffle();
    } else { // if (this.endMode == 'loop')
      const player: HTMLVideoElement = this.videoPlayer?.nativeElement;
      if (player) {
        player.currentTime = 0; // Reset to start
        player.play(); // Restart playback
      }
    }
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

  // VR

  enterVR(): void {
    const video = this.videoPlayer.nativeElement;
    if (!video) return;

    video.pause(); // Pause the 2D video player

    // Set up the VR scene
    this.initVR(video);
  }

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cameraFixture!: THREE.Group;
  private clock!: THREE.Clock;

  private createController(controllerId: number) {
    // RENDER CONTROLLER
    const controller = this.renderer.xr.getController(controllerId);
    const cylinderGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 32);
    const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.geometry.translate(0, 0.5, 0);
    cylinder.rotateX(- 0.25 * Math.PI);
    controller.add(cylinder);
    this.cameraFixture.add(controller);

    // TRIGGER
    controller.addEventListener('selectstart', () => { cylinderMaterial.color.set(0xff0000) });
    controller.addEventListener('selectend', () => { cylinderMaterial.color.set(0xffff00) });
  }

  private initVR(video: HTMLVideoElement): void {

    // Clock
    this.clock = new THREE.Clock();

    const container = document.body; // Fullscreen container for VR

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    container.appendChild(this.renderer.domElement);

    document.body.appendChild(VRButton.createButton(this.renderer));

    this.scene = new THREE.Scene();
    this.cameraFixture = new THREE.Group();

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraFixture.add(this.camera);
    this.cameraFixture.position.set(0, 1, 3);
    this.scene.add(this.cameraFixture);

    // LIGHT
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(1, 1, 1);
    this.scene.add(light);

    // Add video as a texture
    const videoTexture = new THREE.VideoTexture(video);
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    const videoGeometry = new THREE.PlaneGeometry(4, 2.25);
    const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    this.scene.add(videoMesh);
    videoMesh.position.set(0, 1, -3);

    // Add exit button in VR
    const exitButtonGeometry = new THREE.PlaneGeometry(0.5, 0.2);
    const exitButtonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const exitButton = new THREE.Mesh(exitButtonGeometry, exitButtonMaterial);
    this.scene.add(exitButton);
    exitButton.position.set(0, 0.5, -0.1); // Position in front of the user

    // Add interaction for the exit button
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onSelect = () => {
      const intersects = raycaster.intersectObject(exitButton);
      if (intersects.length > 0) {
        this.exitVR();
      }
    };

    this.renderer.xr.getController(0).addEventListener('selectstart', onSelect);

    this.createController(0);
    this.createController(1);

    // Start rendering
    const animate = () => {
      this.renderer.setAnimationLoop(() => {
        const delta = this.clock.getDelta();

        this.renderer.render(this.scene, this.camera);
      });
    };

    animate();
  }

  private exitVR(): void {
    if (this.renderer.xr.isPresenting) {
      this.renderer.xr.getSession()?.end();
    }

    this.renderer.setAnimationLoop(null); // Stop the animation loop
    this.renderer.dispose();
    this.scene.clear();
    document.body.removeChild(this.renderer.domElement);

    // Resume 2D video playback
    const video = this.videoPlayer.nativeElement;
    video.play();
  }

  toggleChaosMode() {
    if (this.chaosMode) {
      this.stopChaosMode();
    } else {
      this.startChaosMode();
    }
  }

  planChaosStrobe() {
    setTimeout(() => {
      if (this.chaosBtn && this.chaosBtn.nativeElement) {
        this.chaosBtn.nativeElement.classList.add('strobe');
      }
    }, 26000);
  }

  cancelChaosStrobe() {
    if (this.strobeTimeoutId) {
      clearInterval(this.strobeTimeoutId);
      this.strobeTimeoutId = null;
    }
    if (this.chaosBtn && this.chaosBtn.nativeElement) {
      this.chaosBtn.nativeElement.classList.remove('strobe');
    }
  }

  startChaosMode() {
    if (!this.videoPlayer?.nativeElement) return;

    this.chaosMode = true;
    this.planChaosStrobe();
    this.chaosIntervalId = setInterval(() => {
      const video = this.videoPlayer.nativeElement;
      if (video && video.duration > 0) {
        const randomTime = Math.random() * video.duration;
        video.currentTime = randomTime;
      }
      this.cancelChaosStrobe();
      this.planChaosStrobe();
    }, 30000); // every 30 seconds
  }

  stopChaosMode() {
    this.chaosMode = false;
    if (this.chaosIntervalId) {
      clearInterval(this.chaosIntervalId);
      this.chaosIntervalId = null;
    }
    this.cancelChaosStrobe();
  }

  setEndMode(mode: 'next' | 'random' | 'repeat') {
    this.endMode = mode;
    // Any extra logic for applying the mode
  }

  toogleUnsafeMode() {
    this.unsafeMode = !this.unsafeMode;

    if (this.videoPlayer && this.videoPlayer.nativeElement) {
      let rate = (this.videoPlayer.nativeElement.currentTime / this.videoPlayer.nativeElement.duration);
      if (rate > 0.01) {
        this.videoProgressToLoad = rate * 100;
        this.videoProgressAvailable = true;
      }
    }

    if (this.unsafeMode) {
      // Switch to the unresticted stream
      this.getUnrestrictedStream();
    } else if (this.videoFile) {
      // Restore the normal stream
      this.videoSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadVideo();
    }
  }

  getUnrestrictedStream() {
    if (this.videoFile && this.videoFile.id) {
      this.mediaService.getUnsafeToken(this.videoFile.id).pipe(first()).subscribe(data => {
        // Switch to the unsafe stream
        this.videoSourceUrl = '/api/media/unsafe-stream?cache_id=' + encodeURIComponent(data.token);
        this.loadVideo();
      });
    }
  }
}
