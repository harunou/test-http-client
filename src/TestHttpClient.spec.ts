import { TestHttpClient } from './TestHttpClient';

describe(`${TestHttpClient.name}`, () => {
    let httpClient: TestHttpClient;
    let endpoint: string;

    beforeEach(() => {
        endpoint = 'test/endpoint';
        httpClient = new TestHttpClient();
    });

    describe('expectOne', () => {
        it('finds pending request by url', () => {
            void httpClient.request(new Request(endpoint));
            const pendingRequest = httpClient.expectOne(endpoint);
            expect(pendingRequest.request.url).toEqual(endpoint);
        });

        it('finds pending request by request object', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequest = httpClient.expectOne(new Request(endpoint, { method: 'POST' }));
            expect(pendingRequest.request.url).toEqual(endpoint);
        });

        it('finds pending request by predicate function', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequest = httpClient.expectOne(req => req.url === endpoint);
            expect(pendingRequest.request.url).toEqual(endpoint);
        });

        it('does not remove pending request from the client', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequest0 = httpClient.expectOne(endpoint);
            const pendingRequest1 = httpClient.expectOne(endpoint);
            expect(pendingRequest0).toEqual(pendingRequest1);
        });

        it('throws an error if a pending request is not found', () => {
            expect(() => httpClient.expectOne(endpoint)).toThrow();
        });

        it('throws error with a specific message', () => {
            expect(() => httpClient.expectOne(endpoint)).toThrow(new RegExp(`URL: ${endpoint}`));
            expect(() => httpClient.expectOne(new Request(endpoint, { method: 'POST' }))).toThrow(
                new RegExp(`method: POST, URL: ${endpoint}`)
            );
            function predicate(req: Request): boolean {
                return req.url === endpoint;
            }
            expect(() => httpClient.expectOne(predicate)).toThrow(
                new RegExp(`function: ${predicate.name}`)
            );
        });

        it('throws an error if more than 1 pending request is found', () => {
            void httpClient.request(new Request(endpoint));
            void httpClient.request(new Request(endpoint));
            expect(() => httpClient.expectOne(endpoint)).toThrow();
        });
    });

    describe('removeOne', () => {
        it('allows to remove existing pending request', () => {
            void httpClient.request(new Request(endpoint));
            httpClient.removeOne(endpoint);
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('allows to remove pending request by request object', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.removeOne(new Request(endpoint, { method: 'POST' }));
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('allows to remove pending request by predicate function', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.removeOne(req => req.url === endpoint);
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('throws an error if tries to remove non-existing pending request', () => {
            expect(() => httpClient.removeOne(endpoint)).toThrow();
        });

        it('throws an error if  found many pending request in attempt to remove', () => {
            void httpClient.request(new Request(endpoint));
            void httpClient.request(new Request(endpoint));
            expect(() => httpClient.removeOne(endpoint)).toThrow();
        });
    });

    describe('resolve and reject', () => {
        it('allows to resolve pending request', async () => {
            const resolveValue = 3;
            const promise = httpClient.request<number>(new Request(endpoint));
            httpClient.expectOne<number>(endpoint).resolve(resolveValue);
            await expect(promise).resolves.toEqual(resolveValue);
        });

        it('removes pending request from http client once resolved', () => {
            const resolveValue = 3;
            void httpClient.request<number>(new Request(endpoint));
            httpClient.expectOne<number>(endpoint).resolve(resolveValue);
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('allows to reject pending request', async () => {
            const error = new Error('error');
            const promise = httpClient.request(new Request(endpoint));
            httpClient.expectOne(endpoint).reject(error);
            await expect(promise).rejects.toEqual(error);
        });

        it('removes pending request from http client once rejected', () => {
            const error = new Error('error');
            void httpClient.request<number>(new Request(endpoint)).catch(() => {
                /* noop */
            });
            httpClient.expectOne<number>(endpoint).reject(error);
            expect(() => httpClient.verify()).not.toThrow();
        });
    });

    describe('expect', () => {
        it('allows to find all pending requests by url', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.expect(endpoint);
            expect(pendingRequests.length).toEqual(2);
        });

        it('allows to find all pending requests by request object', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.expect(new Request(endpoint, { method: 'POST' }));
            expect(pendingRequests.length).toEqual(2);
        });

        it('allows to find all pending requests by predicate function', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.expect(req => req.url === endpoint);
            expect(pendingRequests.length).toEqual(2);
        });

        it('throws an error if pending requests are not found', () => {
            expect(() => httpClient.expect(endpoint)).toThrow();
        });
    });

    describe('remove', () => {
        it('allows to delete all pending requests by url', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.remove(endpoint);
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('allows to delete all pending requests by request object', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.remove(new Request(endpoint, { method: 'POST' }));
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('allows to delete all pending requests by predicate function', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.remove(req => req.url === endpoint);
            expect(() => httpClient.verify()).not.toThrow();
        });

        it('throws an error if tries to remove non-existing pending requests', () => {
            expect(() => httpClient.remove(endpoint)).toThrow();
        });
    });

    describe('match', () => {
        it('allows to find all pending requests by url', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.match(endpoint);
            expect(pendingRequests.length).toEqual(2);
        });
        it('allows to find all pending requests by request object', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.match(new Request(endpoint, { method: 'POST' }));
            expect(pendingRequests.length).toEqual(2);
        });
        it('allows to find all pending requests by predicate function', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.match(req => req.url === endpoint);
            expect(pendingRequests.length).toEqual(2);
        });
    });

    describe('verify and clean', () => {
        it('verifies unresolved requests', () => {
            void httpClient.request(new Request(endpoint));
            expect(() => httpClient.verify()).toThrow();
        });

        it('cleans all pending requests', () => {
            void httpClient.request(new Request(endpoint));
            httpClient.clean();
            expect(() => httpClient.verify()).not.toThrow();
        });
    });

    describe('debug', () => {
        it('should log pending requests when debug is called', () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
                /* noop */
            });

            const request = new Request('http://example.com');
            void httpClient.request(request);

            // eslint-disable-next-line testing-library/no-debugging-utils -- NOTE(harunou): testing debug
            httpClient.debug();

            expect(consoleLogSpy).toHaveBeenCalledWith('Pending requests:', [request]);
            consoleLogSpy.mockRestore();
        });
    });
});
