export interface AuthOptions {
    customParams?: { [key: string]: string | number | boolean };
    urlHandler?(url: string): any;
}
