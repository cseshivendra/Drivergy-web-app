import { EventEmitter } from 'events';

// A simple event emitter to globally handle Firestore permission errors.
export const errorEmitter = new EventEmitter();
