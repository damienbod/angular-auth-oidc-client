import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AutoLoginComponent } from './auto-login.component';

describe('AutoLoginComponent', () => {
    let component: AutoLoginComponent;
    let fixture: ComponentFixture<AutoLoginComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AutoLoginComponent],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AutoLoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
