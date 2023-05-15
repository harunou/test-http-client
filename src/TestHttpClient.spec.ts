import { TestHttpClient } from './TestHttpClient';

describe(`${TestHttpClient.name}`, () => {
    let httpClient: TestHttpClient;
    let endpoint: string;
    beforeEach(() => {
        endpoint = 'test/endpoint';
        httpClient = new TestHttpClient();
    });
    describe('instance', () => {
        it('creates a singleton with make command', () => {
            const instance0 = TestHttpClient.make();
            const instance1 = TestHttpClient.make();
            expect(instance0).toEqual(instance1);
        });
    });
    describe('singular pending request', () => {
        it('finds pending request by url', () => {
            void httpClient.request(new Request(endpoint));
            const pendingRequest = httpClient.expectOne(endpoint);
            expect(pendingRequest.request.url).toEqual(endpoint);
        });

        it('finds pending request by url and init', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequest = httpClient.expectOne(endpoint, { method: 'POST' });
            expect(pendingRequest.request.url).toEqual(endpoint);
        });

        it('throws an error if a pending request in not found', () => {
            expect(() => httpClient.expectOne(endpoint)).toThrow();
        });

        it('does not remove pending request from the client with expectOne', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequest0 = httpClient.expectOne(endpoint, { method: 'POST' });
            const pendingRequest1 = httpClient.expectOne(endpoint, { method: 'POST' });
            expect(pendingRequest0).toEqual(pendingRequest1);
        });

        it('allows to remove existing pending request', () => {
            void httpClient.request(new Request(endpoint));
            httpClient.removeOne(endpoint);
            expect(() => httpClient.expectOne(endpoint)).toThrow();
        });

        it('throws an error if tries to remove non existing pending request', () => {
            expect(() => httpClient.removeOne(endpoint)).toThrow();
        });

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
            expect(() => httpClient.expectOne<number>(endpoint)).toThrow();
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
            expect(() => httpClient.expectOne<number>(endpoint)).toThrow();
            expect(true).toEqual(true);
        });
    });
    describe('multiple pending requests', () => {
        it('allows to find all pending request by url and init', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            const pendingRequests = httpClient.expect(endpoint, { method: 'POST' });
            expect(pendingRequests.length).toEqual(2);
        });

        it('throws an error if pending requests ar not found', () => {
            expect(() => httpClient.expect(endpoint, { method: 'POST' })).toThrow();
        });

        it('allows to delete all pending requests by url and init', () => {
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            void httpClient.request(new Request(endpoint, { method: 'POST' }));
            httpClient.remove(endpoint, { method: 'POST' });
            expect(() => httpClient.expect(endpoint, { method: 'POST' })).toThrow();
        });

        it('throws an error if tries to remove non existing pending requests', () => {
            expect(() => httpClient.remove(endpoint, { method: 'POST' })).toThrow();
        });

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
});
