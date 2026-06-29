import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo, MediaPlaylist, MediaService } from '../media.service';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { first, Subject, takeUntil } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-media-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdkDrag, CdkDragHandle, MatToolbar, MatMenu, MatMenuModule, MatDividerModule, TranslocoDirective],
  templateUrl: './media-player.component.html',
  styleUrl: './media-player.component.css'
})
export class MediaPlayerComponent implements OnInit, OnDestroy {

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;
  @ViewChild('audioPlayer', { static: false }) audioPlayer: ElementRef;
  @ViewChild('textArea', { static: false }) textArea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chaosBtn', { static: false }) chaosBtn!: ElementRef<HTMLButtonElement>;

  // Chaos
  chaosMode: 'off' | 'normal' | 'quick' = 'off';
  private chaosIntervalId: any;
  private strobeTimeoutId: any;
  private chaosRecentPositions: number[] = []; // last 3 jumped-to times (seconds)

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
  textSourceUrl: string;
  textContent: string;

  can_manage: boolean = false;

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private mediaService: MediaService, private noticeService: NoticeService, private authService: AuthService) {

  }

  ngOnInit() {
    //this.showVideo(this.playlist.start_index);

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.can_manage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_MEDIA);
    });

  }

  setData(playlist: MediaPlaylist) {
    this.playlist = playlist;
    if (this.playlist.files.length > 0) {
      this.showItem(this.playlist.start_index);
    }
  }

  showItem(index: number) {

    const previousChaosMode = this.chaosMode;
    this.stopChaosMode();
    this.cancelChaosStrobe();

    this.audioSourceUrl = '';
    this.videoSourceUrl = '';
    this.imageSourceUrl = '';
    this.textSourceUrl = '';

    if (index >= this.playlist.files.length) {
      this.is_ready = false;
      return;
    }

    this.is_ready = true;
    this.videoSourceIndex = index;
    this.videoFile = this.playlist.files[index];
    this.videoSourceName = this.videoFile.name;

    if (this.videoFile.mime_type.startsWith('video')) {
      if (this.unsafeMode) {
        this.getUnrestrictedStream();
      } else {
        this.videoSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
        this.loadVideo();
      }
      //this.audioSourceUrl = '';
      this.loadAudio();
      //this.imageSourceUrl = '';
      if (this.videoFile.progress) {
        this.videoProgressToLoad = parseFloat(this.videoFile.progress);
        this.videoProgressAvailable = true;
      } else {
        this.videoProgressAvailable = false;
      }
      // If chaos was running, re-arm it once the new video's metadata is ready
      if (previousChaosMode !== 'off') {
        this._pendingChaosMode = previousChaosMode;
      }
    } else if (this.videoFile.mime_type.startsWith('audio')) {
      this.audioSourceUrl = '/api/media/stream?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadAudio();
      //this.videoSourceUrl = '';
      this.loadVideo();
      //this.imageSourceUrl = '';
    } else if (this.videoFile.mime_type.startsWith('image')) {
      this.imageSourceUrl = '/api/media/view?file_id=' + encodeURIComponent(this.videoFile.id);
      this.loadAudio();
      //this.videoSourceUrl = '';
      this.loadVideo();
      //this.audioSourceUrl = '';
    } if (this.videoFile.mime_type.startsWith('text')) {
      this.loadTextPreview();
    } else {

    }
  }

  loadTextPreview() {
    if (this.videoFile && this.videoFile.id) {
      this.mediaService.fetchFileText(this.videoFile.id).pipe(first()).subscribe({
        next: (text) => {
          //this.textArea.nativeElement.value = text;
          this.textSourceUrl = "set";
          //setTimeout(() => {
          //  this.textArea.nativeElement.value = text;
          //});
          this.textContent = text;
          //console.log('File contents:', text);
        },
        error: (err) => {
          console.error('Failed to fetch file:', err);
        }
      });

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
          this.playlist.files = this.playlist.files.splice(this.videoSourceIndex, 1);
        });
      }
    }
  }

  prevVideo() {
    if (this.chaosMode !== 'off') {
      this.restartChaosInterval();
    } else {
      this.findNextVideo(-1);
    }
  }

  nextVideo() {
    if (this.chaosMode !== 'off') {
      this.restartChaosInterval();
    } else {
      this.findNextVideo(1);
    }
  }

  deleteFile() {
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_delete_file', { 'name': (this.videoFile && this.videoFile.name || '') }));
    if (confirmResult) {
      if (this.videoFile && this.videoFile.id) {
        this.mediaService.deleteFile(this.videoFile.id).pipe(first())
          .subscribe({
            next: data => {
              if (data) {

                this.playlist.files = this.playlist.files.splice(this.videoSourceIndex, 1);

                this.nextVideo();
              }
            }, error: error => {

            }
          });
      }
    }
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
    // Chaos always advances to next file so the session keeps going
    if (this.chaosMode !== 'off') {
      this.nextVideo();
      return;
    }
    if (this.endMode == 'next') {
      this.nextVideo();
    } else if (this.endMode == 'random') {
      this.shuffle();
    } else { // repeat
      const player: HTMLVideoElement = this.videoPlayer?.nativeElement;
      if (player) {
        player.currentTime = 0;
        player.play();
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
    if (this._pendingChaosMode !== 'off') {
      this.startChaosMode(this._pendingChaosMode);
      this._pendingChaosMode = 'off';
    }
  }

  private _pendingChaosMode: 'off' | 'normal' | 'quick' = 'off';

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

  toggleChaosMode(speed: 'normal' | 'quick') {
    if (this.chaosMode === speed) {
      this.stopChaosMode();
    } else {
      this.stopChaosMode();
      this.startChaosMode(speed);
    }
  }

  private chaosIntervalMs(speed: 'normal' | 'quick'): number {
    return speed === 'quick' ? 15000 : 30000;
  }

  private pickChaosTime(duration: number): number {
    const minGap = duration * 0.05; // must be >5% of duration away from any recent position
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = Math.random() * duration;
      const tooClose = this.chaosRecentPositions.some(p => Math.abs(p - candidate) < minGap);
      if (!tooClose) return candidate;
    }
    // Fallback: just pick randomly even if close
    return Math.random() * duration;
  }

  private executeChaosJump() {
    const video: HTMLVideoElement | undefined = this.videoPlayer?.nativeElement;
    if (!video || !(video.duration > 0)) return;

    const target = this.pickChaosTime(video.duration);
    this.chaosRecentPositions.push(target);
    if (this.chaosRecentPositions.length > 3) {
      this.chaosRecentPositions.shift();
    }
    video.currentTime = target;
  }

  planChaosStrobe(intervalMs: number) {
    this.strobeTimeoutId = setTimeout(() => {
      if (this.chaosBtn?.nativeElement) {
        this.chaosBtn.nativeElement.classList.add('strobe');
      }
    }, intervalMs - 4000);
  }

  cancelChaosStrobe() {
    if (this.strobeTimeoutId) {
      clearTimeout(this.strobeTimeoutId);
      this.strobeTimeoutId = null;
    }
    if (this.chaosBtn?.nativeElement) {
      this.chaosBtn.nativeElement.classList.remove('strobe');
    }
  }

  startChaosMode(speed: 'normal' | 'quick') {
    if (!this.videoPlayer?.nativeElement) return;

    this.chaosMode = speed;
    this.chaosRecentPositions = [];
    const intervalMs = this.chaosIntervalMs(speed);
    this.planChaosStrobe(intervalMs);

    this.chaosIntervalId = setInterval(() => {
      this.executeChaosJump();
      this.cancelChaosStrobe();
      this.planChaosStrobe(intervalMs);
    }, intervalMs);
  }

  stopChaosMode() {
    this.chaosMode = 'off';
    this.chaosRecentPositions = [];
    this.cancelChaosStrobe();
    if (this.chaosIntervalId) {
      clearInterval(this.chaosIntervalId);
      this.chaosIntervalId = null;
    }
  }

  private restartChaosInterval() {
    const speed = this.chaosMode as 'normal' | 'quick';
    clearInterval(this.chaosIntervalId);
    this.cancelChaosStrobe();
    this.executeChaosJump();
    const intervalMs = this.chaosIntervalMs(speed);
    this.planChaosStrobe(intervalMs);
    this.chaosIntervalId = setInterval(() => {
      this.executeChaosJump();
      this.cancelChaosStrobe();
      this.planChaosStrobe(intervalMs);
    }, intervalMs);
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
