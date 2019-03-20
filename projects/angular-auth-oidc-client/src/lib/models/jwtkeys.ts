export class JwtKeys {
    keys: JwtKey[] = [];
}

export class JwtKey {
    kty = '';
    use = '';
    kid = '';
    x5t = '';
    e = '';
    n = '';
    x5c: any[] = [];
}
