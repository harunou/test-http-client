import { Deferred } from '@esfx/async-deferred';

type Url = string;
type RequestMatcher = Url | Request | ((req: Request) => boolean);

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
            resolve: value => {
                this.removePendingRequests([pendingRequest]);
                deferred.resolve(value);
            },
            reject: reason => {
                this.removePendingRequests([pendingRequest]);
                deferred.reject(reason);
            },
        };

        this.pendingRequests.push(pendingRequest);
        return deferred.promise;
    }

    expectOne<T>(matcher: RequestMatcher): PendingRequest<T> {
        return this.expectOnePendingRequest<T>(matcher);
    }

    removeOne(matcher: RequestMatcher): void {
        const pendingRequest = this.expectOnePendingRequest<unknown>(matcher);
        this.removePendingRequests([pendingRequest]);
    }

    expect<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        const foundPendingRequests = this.match<T>(matcher);
        if (foundPendingRequests.length === 0) {
            throw new Error(
                `TestHttpClient: expected pending requests for ${descriptionFromMatcher(
                    matcher
                )}, but none were found.`
            );
        }
        return foundPendingRequests;
    }

    remove(matcher: RequestMatcher): void {
        const foundPendingRequests = this.matchPendingRequests<unknown>(matcher);
        if (foundPendingRequests.length === 0) {
            throw new Error(
                `TestHttpClient: expected pending requests for ${descriptionFromMatcher(
                    matcher
                )}, but none were found.`
            );
        }
        this.removePendingRequests(foundPendingRequests);
    }

    match<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        return this.matchPendingRequests(matcher);
    }

    verify(): void {
        if (this.pendingRequests.length > 0) {
            const descriptions = this.pendingRequests
                .map(pendingRequest => descriptionFromMatcher(pendingRequest.request))
                .join(', ');
            throw new Error(
                `TestHttpClient: still has ${this.pendingRequests.length} pending requests: ${descriptions}`
            );
        }
    }

    clean(): void {
        this.pendingRequests = [];
    }

    private expectOnePendingRequest<T>(matcher: RequestMatcher): PendingRequest<T> {
        const foundPendingRequests = this.match<T>(matcher);
        if (foundPendingRequests.length !== 1) {
            throw new Error(
                `TestHttpClient: expected one pending request for ${descriptionFromMatcher(
                    matcher
                )}, but found ${foundPendingRequests.length}.`
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- NOTE(harunou): at this point we know that there is only one PReq
        return foundPendingRequests[0]!;
    }

    private matchPendingRequests<T>(matcher: RequestMatcher): Array<PendingRequest<T>> {
        return this.pendingRequests.filter(pendingRequest =>
            matches(pendingRequest.request, matcher)
        ) as Array<PendingRequest<T>>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(harunou): the array actually holds PReq of any
    private removePendingRequests(pendingRequests: Array<PendingRequest<any>>): void {
        this.pendingRequests = this.pendingRequests.filter(pr => !pendingRequests.includes(pr));
    }
}

function matches(request: Request, matcher: RequestMatcher): boolean {
    if (typeof matcher === 'string') {
        return request.url === matcher;
    } else if (typeof matcher === 'function') {
        return matcher(request);
    } else {
        return (
            request.url === matcher.url &&
            request.method.toUpperCase() === matcher.method.toUpperCase()
        );
    }
}

function descriptionFromMatcher(matcher: RequestMatcher): string {
    if (typeof matcher === 'string') {
        return `URL: ${matcher}`;
    } else if (matcher instanceof Request) {
        const method = matcher.method || 'any method';
        const url = matcher.url || 'any url';
        return `method: ${method.toUpperCase()}, URL: ${url}`;
    } else {
        return `function: ${matcher.name}`;
    }
}
