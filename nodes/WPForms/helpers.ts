/**
 * Shared helper utilities for WPForms nodes.
 *
 * @since 1.0
 *
 * @return {Object} Helpers object.
 */
export default {

	/**
	 * Get the raw output response.
	 *
	 * @param {Request} request HTTP request object.
	 *
	 * @return Promise<IWebhookResponseData>
	 */
	getRawOutput(request: Request) {
		return {
			workflowData: [
				[
					{
						json: {
							body: request.body,
							headers: request.headers,
						},
					},
				],
			],
		};
	}
}
