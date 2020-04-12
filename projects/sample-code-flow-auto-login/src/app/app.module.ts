import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, AuthModule.forRoot()],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
