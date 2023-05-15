# TestHttpClient

[![codecov](https://codecov.io/gh/harunou/test-http-client/branch/main/graph/badge.svg?token=2R9OQJPG90)](https://codecov.io/gh/harunou/test-http-client)
[![npm](https://img.shields.io/npm/v/test-http-client)](https://www.npmjs.com/package/test-http-client)

`TestHttpClient` is a utility class that provides an emulator for an HTTP client, primarily designed for writing tests and conducting experiments involving asynchronous requests. It allows users to send requests, track pending requests, and perform various operations on them.

## Features

- Sending HTTP requests asynchronously.
- Tracking pending requests and managing them effectively.
- Retrieving pending requests based on URL and optional request initialization options.
- Removing pending requests individually or in batches.
- Verifying the completion of all pending requests.
- Cleaning the list of pending requests.

## Usage

1. Import the `TestHttpClient`  and create an instance of `TestHttpClient`:

   ```typescript
   import { TestHttpClient } from './test-http-client';
   const httpClient = TestHttpClient.make();
   ```

2. Send requests using the `request<T>(request: Request): Promise<T>` method:

   ```typescript
   const request = new Request('https://api.example.com/data');
   const response = await httpClient.request<string>(request);
   console.log(response);
   ```

3. Perform operations on pending requests:

   - Retrieve a single pending request based on URL and optional initialization options:

     ```typescript
     const pendingRequest = httpClient.expectOne<string>('https://api.example.com/data');
     ```

   - Remove a single pending request based on URL and optional initialization options:

     ```typescript
     httpClient.removeOne('https://api.example.com/data');
     ```

   - Retrieve multiple pending requests based on URL and optional initialization options:

     ```typescript
     const pendingRequests = httpClient.expect<string>('https://api.example.com/data');
     ```

   - Remove multiple pending requests based on URL and optional initialization options:

     ```typescript
     httpClient.remove('https://api.example.com/data');
     ```

   - Verify the completion of all pending requests:

     ```typescript
     httpClient.verify();
     ```

   - Clean the list of pending requests:

     ```typescript
     httpClient.clean();
     ```

More examples in [TestHttpClient.spec.ts](./src/TestHttpClient.spec.ts)
