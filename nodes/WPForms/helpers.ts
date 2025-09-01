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
	}
}
