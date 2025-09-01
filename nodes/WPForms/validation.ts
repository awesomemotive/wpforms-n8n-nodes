import { createHmac } from 'crypto';

/**
 * Validate WPForms webhook request by checking required headers, timestamp skew,
 * and HMAC-SHA256 signature using the provided secret.
 *
 * Throws NodeApiError on validation failure.
 *
 * @since 0.1.0
 */
export function isValidated(
	request: any,
	secretKey: string,
	timestampSkew: number,
): boolean {
	// Header presence validation
	const signature = request.headers['x-wpforms-signature'] as string;
	const timestamp = request.headers['x-wpforms-timestamp'] as string;

	if (!signature || !timestamp) {
		const err: any = new Error('Missing signature or timestamp headers');

		err.httpCode = 403;

		throw err;
	}

	// Skew validation (compare values as provided by the request)
	const now = Date.now();
	const timestampInt = parseInt(timestamp, 10);
	const timeDifference = Math.abs(now - timestampInt);

	if (timeDifference > timestampSkew) {
		const message = `Timestamp is outside the allowed ${ timestampSkew }s skew.`;
		const data = JSON.stringify({ now, timestampInt, timeDifference });
		const err: any = new Error(message + ' ' + data);

		err.description = message;
		err.httpCode = 403;

		throw err;
	}

	// Compute expected HMAC of the body using the shared secret
	const hmac = createHmac('sha256', secretKey);
	hmac.update(JSON.stringify(request.body));
	const expectedSignature = hmac.digest('hex');

	// Compare signatures for integrity and authenticity
	if (signature !== expectedSignature) {
		const message = 'Invalid signature.';
		const data = JSON.stringify({ signature, expectedSignature });
		const err: any = new Error(message + ' ' + data);

		err.description = message;
		err.httpCode = 403;

		throw err;
	}

	return true;
}
