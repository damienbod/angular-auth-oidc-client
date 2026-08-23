import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LazyComponent } from './lazy.component';
import { provideAuth } from 'angular-auth-oidc-client';

describe('LazyComponent', () => {
  let component: LazyComponent;
  let fixture: ComponentFixture<LazyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LazyComponent],
      providers: [provideAuth({ config: {} })],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LazyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
