import { Injectable } from '@angular/core';

@Injectable()
export class ArrayHelperService {
    constructor() {}

    arraysEqual(arr1: Array<string>, arr2: Array<string>) {
        if (arr1.length !== arr2.length) {
            return false;
        }

        for (let i = arr1.length; i--; ) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }
}
