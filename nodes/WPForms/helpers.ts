import {
	IDataObject,
	IWebhookResponseData,
	IWebhookFunctions,
} from 'n8n-workflow';

/**
 * Shared helper utilities for WPForms nodes.
 *
 * @since 1.0
 *
 * @return {Object} Helpers object.
 */
export default {

	/**
	 * Get output response.
	 *
	 * @since 1.0
	 *
	 * @param {Request} request HTTP request object.
	 * @param {IWebhookFunctions} node Node object.
	 *
	 * @return Promise<IWebhookResponseData>
	 */
	async getOutput(request: any, node: IWebhookFunctions): Promise<IWebhookResponseData> {
		return {
			workflowData: [node.helpers.returnJsonArray(request.body as IDataObject[])],
		};
	},

	/**
	 * Get the raw output response.
	 *
	 * @since 1.0
	 *
	 * @param {Request} request HTTP request object.
	 *
	 * @return Promise<IWebhookResponseData>
	 */
	async getRawOutput(request: any): Promise<IWebhookResponseData> {
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
	},

	/**
	 * Send a controlled error response for webhooks and stop n8n from overriding it.
	 *
	 * @since 1.0
	 *
	 * @param {any} err Error object possibly containing httpCode, message, description
	 * @param {IWebhookFunctions} node Node context to access Express response
	 *
	 * @return Promise<IWebhookResponseData>
	 */
	async getErrorOutput(err: any, node: IWebhookFunctions): Promise<IWebhookResponseData> {
		const code = Number(err?.httpCode) || 400;
		const res = node.getResponseObject();
		const body = {
			message: err?.message ?? 'Bad Request',
			description: err?.description,
			data: err?.data,
		};

		try {
			res.status(code).json(body);
		} catch (err) {
			res.status(code).send(body.message);
		}

		return {
			noWebhookResponse: true,
			workflowData: [
				[
					{
						json: body,
					},
				],
			],
		};
	}
}
