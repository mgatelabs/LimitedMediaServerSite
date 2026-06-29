import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'image-state-number';
const MIN = 100_000;
const MAX = 1_000_000;

@Injectable({
  providedIn: 'root'
})
export class ImageStateNumberService {

  private readonly stateNumberSubject: BehaviorSubject<number>;
  readonly stateNumber$: Observable<number>;

  constructor() {
    const initialValue = this.loadOrGenerate();
    this.stateNumberSubject = new BehaviorSubject<number>(initialValue);
    this.stateNumber$ = this.stateNumberSubject.asObservable();
  }

  /**
   * Returns the current value synchronously (optional convenience)
   */
  get currentValue(): number {
    return this.stateNumberSubject.value;
  }

  /**
   * Forces generation of a new number and notifies all subscribers
   */
  regenerate(): void {
    const newValue = this.generateRandom();
    localStorage.setItem(STORAGE_KEY, newValue.toString());
    this.stateNumberSubject.next(newValue);
  }

  /**
   * Load from localStorage or generate a new value
   */
  private loadOrGenerate(): number {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const generated = this.generateRandom();
    localStorage.setItem(STORAGE_KEY, generated.toString());
    return generated;
  }

  private generateRandom(): number {
    return Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  }

}
