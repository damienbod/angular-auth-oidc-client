import { Injectable } from '@angular/core';

/**
 * Implement this class-interface to create a custom storage.
 */
@Injectable()
export abstract class AbstractSecurityStorage {
    /**
     * This method must contain the logic to read the storage.
     * @return The value of the given key
     */
    public abstract read(key: string): any;

    /**
     * This method must contain the logic to write the storage.
     * @param value The value for the given key
     */
    public abstract write(key: string, value: any): void;
}
