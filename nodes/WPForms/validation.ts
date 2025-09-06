import { createHmac } from 'crypto';

/**
 * Validate WPForms webhook request by checking required headers, timestamp skew,
 * and HMAC-SHA256 signature using the provided secret.
 *
 * Throws NodeApiError on validation failure.
 *
 * @since 0.1.0
 */
export function validateRequest(
	request: any,
	secretKey: string,
	timestampSkew: number,
): boolean {
	// Header presence validation
	const signature = request.headers['x-wpforms-signature'] as string;
	const timestamp = request.headers['x-wpforms-timestamp'] as string;

	/**
	 *
	 *
	 * @param message
	 * @param data
	 */
	function throwError(
		message: string,
		data: Object,
	) {
		const err: any = new Error(message);

		err.message = message;
		err.data = data;
		err.httpCode = 403;

		throw err;
	}

	if (!signature || !timestamp) {
		throwError(
			'Missing signature or timestamp headers',
			{ signature, timestamp }
		);
	}

	// Skew validation (compare values as provided by the request)
	const now = Date.now();
	const timestampInt = parseInt(timestamp, 10);
	const timeDifference = Math.abs(now - timestampInt);

	if (timeDifference > timestampSkew) {
		throwError(
			`Timestamp is outside the allowed ${ timestampSkew }s skew.`,
			{ now, timestampInt, timeDifference }
		);
	}

	// Compute expected HMAC of the body using the shared secret
	const hmac = createHmac('sha256', secretKey);
	hmac.update(JSON.stringify(request.body));
	const expectedSignature = hmac.digest('hex');

	// Compare signatures for integrity and authenticity
	if (signature !== expectedSignature) {
		throwError(
			'Invalid signature.',
			{ signature, expectedSignature }
		);
	}

	return true;
}
