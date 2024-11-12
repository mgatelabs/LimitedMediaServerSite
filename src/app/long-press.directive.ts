import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  standalone: true
})
export class LongPressDirective {

  @Output() longPress = new EventEmitter<void>();

  private pressTimeout: any;
  private readonly pressDuration = 500; // Duration in ms to consider a long press

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPressStart(event: Event): void {
    event.preventDefault();
    this.pressTimeout = setTimeout(() => {
      this.longPress.emit();
    }, this.pressDuration);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  onPressEnd(): void {
    clearTimeout(this.pressTimeout);
  }

}
