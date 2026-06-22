import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../core/config/runtime-config.service';
import { AssistantQueryRequest, AssistantQueryResponse } from './assistant.models';

@Injectable({
  providedIn: 'root'
})
export class AssistantApiClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  query(question: string): Observable<AssistantQueryResponse> {
    const request: AssistantQueryRequest = {
      question
    };

    return this.http.post<AssistantQueryResponse>(
      `${this.runtimeConfig.snapshot.apiBaseUrl}/api/assistant/query`,
      request
    );
  }
}
