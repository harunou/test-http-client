# TestHttpClient

[![codecov](https://codecov.io/gh/harunou/test-http-client/branch/main/graph/badge.svg?token=2R9OQJPG90)](https://codecov.io/gh/harunou/test-http-client)
[![npm](https://img.shields.io/npm/v/test-http-client)](https://www.npmjs.com/package/test-http-client)

# TestHttpClient

`TestHttpClient` is a utility class that provides an emulator for an HTTP client, primarily designed for writing tests and conducting experiments involving asynchronous requests. It allows users to send requests, track pending requests, and perform various operations on them based on URL, Request objects, or custom match functions.

## Features

- Sending HTTP requests asynchronously using Promises.
- Tracking pending requests and managing their resolution or rejection.
- Matching pending requests using URLs, Request objects, or custom functions.
- Resolving or rejecting matched requests individually.
- Removing pending requests individually or in batches based on match criteria.
- Verifying that all pending requests have been resolved or rejected.
- Cleaning the list of pending requests.

## Usage

1. Import the `TestHttpClient` and create an instance:

   ```typescript
   import { TestHttpClient } from './test-http-client';
   const httpClient = TestHttpClient.make();
   ```

2. Send requests using the `request<T>(request: Request): Promise<T>` method:

   ```typescript
   it('allows to resolve pending request', async () => {
       const endpoint = new Request('https://api.example.com/data');
       const resolveValue = { data: 3 };
       const promise = httpClient.request<typeof resolveValue>(endpoint);
       httpClient.expectOne<typeof resolveValue>(endpoint).resolve(resolveValue);
       await expect(promise).resolves.toEqual(resolveValue);
   });
   ```

3. Perform operations on pending requests:

   - Match and retrieve a single pending request:

     ```typescript
     const pendingRequest = httpClient.expectOne<string>((req) => req.url === 'https://api.example.com/data');
     ```

   - Remove a single pending request by matching:

     ```typescript
     httpClient.removeOne((req) => req.url === 'https://api.example.com/data');
     ```

   - Match and retrieve multiple pending requests:

     ```typescript
     const pendingRequests = httpClient.expect<string[]>((req) => req.url.includes('api.example.com'));
     ```

   - Remove multiple pending requests by matching:

     ```typescript
     httpClient.remove((req) => req.url includes('api.example.com'));
     ```

   - Verify the completion of all pending requests:

     ```typescript
     httpClient.verify();
     ```

   - Clean the list of pending requests:

     ```typescript
     httpClient.clean();
     ```

For more examples, see [TestHttpClient.spec.ts](./src/TestHttpClient.spec.ts).
