import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideAuth } from 'angular-auth-oidc-client';
import { NavigationComponent } from './navigation/navigation.component';
import { provideRouter, RouterModule } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule],
      declarations: [AppComponent, NavigationComponent],
      providers: [provideAuth({ config: {} }), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;

    expect(app).toBeTruthy();
  });
});
