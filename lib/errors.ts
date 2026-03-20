/**
 * Thrown when request input fails validation; maps to HTTP 4xx in API routes.
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}
