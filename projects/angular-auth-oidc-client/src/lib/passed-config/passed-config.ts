import { InjectionToken } from '@angular/core';
import { PassedInitialConfig } from './passed-initial-config';

export const PASSED_CONFIG = new InjectionToken<PassedInitialConfig>('PASSED_CONFIG');
