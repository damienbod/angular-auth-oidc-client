export class AuthenticationStart {
    constructor(readonly id: number) { }

    toString = () => `AuthenticationStart(id: ${this.id})`
}

export class AuthenticationSuccess {
    constructor(readonly id: number) { }

    toString = () => `AuthenticationSuccess(id: ${this.id}')`
}

export class AuthenticationError {
    constructor(readonly id: number, readonly err?: any) { }

    toString = () => `AuthenticationError(id: ${this.id}, err: '${this.err}')`
}

export class AuthenticationLogout {
    constructor(readonly id: number) { }

    toString = () => `AuthenticationLogout(id: ${this.id})`
}

export class FetchUserInfoStart {
    constructor(readonly id: number) { }

    toString = () => `FetchUserInfoStart(id: ${this.id})`
}

export class FetchUserInfoSuccess {
    constructor(readonly id: number) { }

    toString = () => `FetchUserInfoSuccess(id: ${this.id})`
}

export class FetchUserInfoError {
    constructor(readonly id: number, readonly err?: any) { }

    toString = () => `FetchUserInfoError(id: ${this.id}, err: '${this.err}')`
}

export class RefreshTokenStart {
    constructor(readonly id: number) { }

    toString = () => `RefreshTokenStart(id: ${this.id})`
}

export class RefreshTokenSuccess {
    constructor(readonly id: number) { }

    toString = () => `RefreshTokenSuccess(id: ${this.id})`
}

export class RefreshTokenError {
    constructor(readonly id: number, readonly err?: any) { }

    toString = () => `RefreshTokenError(id: ${this.id}, err: '${this.err}')`
}

export class RefreshTokenExpired {
    constructor(readonly id: number) { }

    toString = () => `RefreshTokenExpired(id: ${this.id}')`
}

export type OidcEvent =
    AuthenticationStart | AuthenticationSuccess | AuthenticationError |
    AuthenticationLogout |
    FetchUserInfoStart | FetchUserInfoSuccess | FetchUserInfoError |
    RefreshTokenStart | RefreshTokenSuccess | RefreshTokenError | RefreshTokenExpired;
