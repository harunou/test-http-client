import { Deferred } from '@esfx/async-deferred';

type URL = string;
type RequestMatcher = URL | Request | ((req: Request) => boolean);

export interface PendingRequest<T> {
    request: Request;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
}

export class TestHttpClient {
    static make(): TestHttpClient {
        return new TestHttpClient();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(harunou): the array actually holds PReq of any
    private pendingRequests: Array<PendingRequest<any>> = [];

    request<T>(request: Request): Promise<T> {
        const deferred = new Deferred<T>();
        const pendingRequest: PendingRequest<T> = {
            request,
            resolve: (...args) => {
                this.removePendingRequests([pendingRequest]);
                deferred.resolve(...args);
            },
            reject: (...args) => {
                this.removePendingRequests([pendingRequest]);
                deferred.reject(...args);
            },
        };

        this.pendingRequests.push(pendingRequest);
        return deferred.promise;
    }

    expectOne<T>(matcher: RequestMatcher): PendingRequest<T> {
        const foundPendingRequests = this.findPendingRequests<T>(matcher);
        const [foundPendingRequest] = foundPendingRequests;
        if (foundPendingRequests.length > 0) {
            throw new Error(
                `HttpClient: found more than one pending request for the ${descriptionFromMatcher(
                    matcher
                )}`
            );
        }
        if (!foundPendingRequest) {
            throw new Error(
                `HttpClient: no pending request found for the ${descriptionFromMatcher(matcher)}`
            );
        }
        return foundPendingRequest;
    }

    removeOne(matcher: RequestMatcher): void {
        const foundPendingRequests = this.findPendingRequests<unknown>(matcher);
        const [foundPendingRequest] = foundPendingRequests;
        if (foundPendingRequests.length > 0) {
            throw new Error(
                `HttpClient: found more than one pending request for the ${descriptionFromMatcher(
                    matcher
                )}`
            );
        }
        if (!foundPendingRequest) {
            throw new Error(
                `TestHttpClient: no pending request found for the ${descriptionFromMatcher(
                    matcher
                )}`
            );
        }
        this.removePendingRequests([foundPendingRequest]);
    }

    expect<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        const foundPendingRequests = this.findPendingRequests<T>(matcher);
        if (!foundPendingRequests.length) {
            throw new Error(
                `TestHttpClient: no pending requests found for the ${descriptionFromMatcher(
                    matcher
                )}`
            );
        }
        return foundPendingRequests;
    }

    remove(matcher: RequestMatcher): void {
        const foundPendingRequests = this.findPendingRequests<unknown>(matcher);
        if (!foundPendingRequests.length) {
            throw new Error(
                `TestHttpClient: no pending requests found for the ${descriptionFromMatcher(
                    matcher
                )}`
            );
        }
        this.removePendingRequests(foundPendingRequests);
    }

    match<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        return this.findPendingRequests<T>(matcher);
    }

    verify(): void {
        if (this.pendingRequests.length) {
            const requests = this.pendingRequests
                .map(pendingRequest => descriptionFromMatcher(pendingRequest.request))
                .join(', ');
            throw new Error(
                `TestHttpClient: still has ${this.pendingRequests.length} pending requests: ${requests}`
            );
        }
    }

    clean(): void {
        this.pendingRequests = [];
    }

    private findPendingRequests<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        if (typeof matcher === 'string') {
            return this.pendingRequests.filter(
                pendingRequest => pendingRequest.request.url === matcher
            ) as Array<PendingRequest<T>>;
        } else if (typeof matcher === 'function') {
            return this.pendingRequests.filter(pendingRequest =>
                matcher(pendingRequest.request)
            ) as Array<PendingRequest<T>>;
        } else {
            return this.pendingRequests.filter(pendingRequest =>
                simpleRequestsComparator(matcher, pendingRequest.request)
            ) as Array<PendingRequest<T>>;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(harunou); it does not matter what type is here
    private removePendingRequests(pendingRequests: Array<PendingRequest<any>>): void {
        this.pendingRequests = this.pendingRequests.filter(pr => !pendingRequests.includes(pr));
    }
}

function simpleRequestsComparator(request1: Request, request2: Request): boolean {
    return (
        request1.url === request2.url &&
        request1.method.toUpperCase() === request2.method.toUpperCase()
    );
}

function descriptionFromMatcher(matcher: RequestMatcher): string {
    if (typeof matcher === 'string') {
        return `match URL: ${matcher}`;
    } else if (typeof matcher === 'object') {
        const method = matcher.method || '(any)';
        const url = matcher.url || '(any)';
        return `match method: ${method}, URL: ${url}`;
    } else {
        return `match by function: ${matcher.name}`;
    }
}

export const testHttpClient = TestHttpClient.make();
