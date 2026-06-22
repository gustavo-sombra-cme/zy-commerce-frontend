import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AssistantApiClient } from './assistant-api.client';

describe('AssistantApiClient', () => {
  let client: AssistantApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    client = TestBed.inject(AssistantApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('posts assistant questions to the backend assistant endpoint', () => {
    client.query('Find active coffee products').subscribe((response) => {
      expect(response.answer).toBe('Coffee Beans is active.');
      expect(response.toolsUsed).toEqual(['catalog_search_products']);
      expect(response.dataScope).toBe('catalog');
      expect(response.unsupported).toBe(false);
    });

    const request = http.expectOne('http://localhost:5015/api/assistant/query');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      question: 'Find active coffee products'
    });

    request.flush({
      answer: 'Coffee Beans is active.',
      toolsUsed: ['catalog_search_products'],
      dataScope: 'catalog',
      unsupported: false
    });
  });
});
