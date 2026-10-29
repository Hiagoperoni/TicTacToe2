/**
 * `AiPort` real via Web Worker (SPEC-003 A7): estado → jogada fora da thread main.
 * O worker recebe `AiRequest` e devolve `AiResponse` (assinaturas de Task 0).
 */

import type { AiPort, AiRequest, AiResponse } from '@ttt/shared/contracts';

/** Contrato mínimo do worker usado pelo `AiPort` (estrutura leve do Web Worker). */
interface WorkerLike {
  readonly postMessage: (message: AiRequest) => void;
  onmessage: ((event: MessageEvent<AiResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

interface PendingRequest {
  readonly resolve: (response: AiResponse) => void;
  readonly reject: (error: Error) => void;
}

const pendingRequests = new Map<number, PendingRequest>();

function createWorker(): WorkerLike {
  const worker = new Worker(new URL('../worker/ai.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => {
    const pending = pendingRequests.get(event.data.id);
    if (pending) {
      pendingRequests.delete(event.data.id);
      pending.resolve(event.data);
    }
  };
  worker.onerror = (event) => {
    const error = new Error(`ai.worker error: ${event.message}`);
    for (const pending of pendingRequests.values()) {
      pending.reject(error);
    }
    pendingRequests.clear();
  };
  return worker;
}

export class WorkerAi implements AiPort {
  private readonly worker: WorkerLike;

  constructor() {
    this.worker = createWorker();
  }

  readonly request: AiPort['request'] = (request) =>
    new Promise<AiResponse>((resolve, reject) => {
      const pending: PendingRequest = { resolve, reject };
      pendingRequests.set(request.id, pending);
      this.worker.postMessage(request);
    });
}
