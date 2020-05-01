import { InjectionToken } from '@angular/core';

export function _window(): any {
    return window;
}

export const WINDOW = new InjectionToken('WindowToken');
