import { Injectable } from '@angular/core';

/**
 * Implement this class-interface to create a custom storage.
 */
@Injectable()
export abstract class AbstractSecurityStorage {
  /**
   * This method must contain the logic to read the storage.
   *
   * @return The value of the given key
   */
  public abstract read(key: string, configId?: string): any;

  /**
   * This method must contain the logic to write the storage.
   *
   * @param key The key to write a value for
   * @param value The value for the given key
   */
  public abstract write(key: string, value: any, configId?: string): void;

  /**
   * This method must contain the logic to remove an item from the storage.
   *
   * @param key The value for the key to be removed
   */
  public abstract remove(key: string, configId?: string): void;

  /**
   * This method must contain the logic to remove all items from the storage.
   */
  public abstract clear(configId?: string): void;
}
