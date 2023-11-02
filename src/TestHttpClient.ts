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
        return new Promise((resolve, reject) => {
            const pendingRequest: PendingRequest<T> = {
                request,
                resolve: (...args) => {
                    this.removePendingRequests([pendingRequest]);
                    resolve(...args);
                },
                reject: (...args) => {
                    this.removePendingRequests([pendingRequest]);
                    reject(...args);
                },
            };
            this.pendingRequests.push(pendingRequest);
        });
    }

    expectOne<T>(url: string, init?: RequestInit): PendingRequest<T> {
        const foundPendingRequests = this.findPendingRequests<T>(url, init);
        const [foundPendingRequest] = foundPendingRequests;
        if (!foundPendingRequest) {
            throw new Error(`HttpClient: no pending request found for the ${url}`);
        }
        return foundPendingRequest;
    }

    removeOne(url: string, init?: RequestInit): void {
        const foundPendingRequests = this.findPendingRequests<unknown>(url, init);
        const [foundPendingRequest] = foundPendingRequests;
        if (!foundPendingRequest) {
            throw new Error(`HttpClient: no pending request found for the ${url}`);
        }
        this.removePendingRequests([foundPendingRequest]);
    }

    expect<T>(url: string, init?: RequestInit): Array<PendingRequest<T>> {
        const foundPendingRequests = this.findPendingRequests<T>(url, init);
        if (!foundPendingRequests.length) {
            throw new Error(`HttpClient: no pending requests found for the ${url}`);
        }
        return foundPendingRequests;
    }

    remove(url: string, init?: RequestInit): void {
        const foundPendingRequests = this.findPendingRequests<unknown>(url, init);
        if (!foundPendingRequests.length) {
            throw new Error(`HttpClient: no pending requests found for the ${url}`);
        }
        this.removePendingRequests(foundPendingRequests);
    }

    verify(): void {
        if (this.pendingRequests.length) {
            throw new Error(`HttpClient: still has pending requests`);
        }
    }

    clean(): void {
        this.pendingRequests = [];
    }

    private findPendingRequests<T>(url: string, init?: RequestInit): Array<PendingRequest<T>> {
        const foundPendingRequests = this.pendingRequests.filter(pendingRequest => {
            const isUrlEqual = pendingRequest.request.url === url;
            const isInitEqual = init
                ? simpleCompareTwoRequestObjects(new Request(url, init), pendingRequest.request)
                : true;
            return isUrlEqual && isInitEqual;
        });
        return foundPendingRequests as Array<PendingRequest<T>>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(harunou); it does not matter what type is here
    private removePendingRequests(pendingRequests: Array<PendingRequest<any>>): void {
        this.pendingRequests = this.pendingRequests.filter(pr => !pendingRequests.includes(pr));
    }
}

function simpleCompareTwoRequestObjects(request1: Request, request2: Request): boolean {
    return (
        request1.url === request2.url &&
        request1.method === request2.method &&
        request1.body === request2.body &&
        JSON.stringify(request1.headers) === JSON.stringify(request2.headers)
    );
}

export const testHttpClient = TestHttpClient.make();
