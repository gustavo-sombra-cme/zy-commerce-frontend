import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminAccessDeniedPageComponent } from './admin-access-denied-page.component';

describe('AdminAccessDeniedPageComponent', () => {
  let fixture: ComponentFixture<AdminAccessDeniedPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminAccessDeniedPageComponent],
      providers: [
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(AdminAccessDeniedPageComponent);
    fixture.detectChanges();
  });

  it('renders the admin access required message', () => {
    expect(fixture.nativeElement.textContent).toContain('Admin access required.');
  });
});
