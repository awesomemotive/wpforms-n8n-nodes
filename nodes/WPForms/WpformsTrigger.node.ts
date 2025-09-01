import { createHmac, randomBytes } from 'crypto';
import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
	NodeApiError,
} from 'n8n-workflow';

/**
 * WPForms Trigger node.
 *
 * @since 0.1.0
 */
export class WpformsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WPForms Trigger',
		name: 'wpformsTrigger',
		icon: 'file:sullie.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a WPForms form is submitted',
		defaults: {
			name: 'WPForms Trigger',
		},
		inputs: [], // Trigger nodes have no inputs
		outputs: [NodeConnectionType.Main],
		webhooks: [
			{
				name: 'default',
				isWebhook: true,
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Secret Key',
				name: 'scrKey',
				type: 'string',
				default: randomBytes(16).toString('hex'),
				required: true,
				description: 'The secret key used to verify the request',
				hint: 'Copy the value to your WPForms n8n settings. <a href="https://wpforms.com/docs/n8n/">Read more</a>',
			},
			{
				displayName: 'Output Schema',
				name: 'outputSchema',
				type: 'options',
				options: [
					{
						name: 'Default',
						value: 'default',
					},
					{
						name: 'Raw',
						value: 'raw',
					},
				],
				default: 'default',
				description: 'Choose the output format of the trigger',
				hint: `Default: Emits 1 item per submission with properties: <code>form, entry</code>, <code>fields</code>, <code>files</code>, <code>meta</code>.<br>
					Raw: Emits 1 item per submission with properties: <code>body</code> (raw JSON string), <code>headers</code> (object). <a href="https://wpforms.com/docs/n8n/">Read more</a>`,
			},
			{
				displayName: 'Timestamp Skew',
				name: 'timestampSkew',
				type: 'number',
				default: 300,
				description: 'The allowed time difference in seconds between the server and the client',
			},
		],
	};

	/**
	 * Implement webhook listener.
	 *
	 * @since 0.1.0
	 *
	 * @return {Promise<IWebhookResponseData>} The node response data.
	 */
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		// Access the raw HTTP request from n8n's webhook context
		const request = this.getRequestObject();
		// Node parameters configured by the user in the UI
		const secretKey = this.getNodeParameter('scrKey') as string;
		const timestampSkew = this.getNodeParameter('timestampSkew') as number;
		const outputSchema = this.getNodeParameter('outputSchema') as string;

		// WPForms sends HMAC signature and a timestamp in request headers
		const signature = request.headers['x-wpforms-signature'] as string;
		const timestamp = request.headers['x-wpforms-timestamp'] as string;

		// Basic header presence validation
		if (!signature || !timestamp) {
			throw new NodeApiError(this.getNode(), {
				message: 'Missing signature or timestamp headers',
				httpCode: 403,
			});
		}

		// Timestamp skew validation to prevent replay attacks
		// Note: WPForms provides seconds; here we compare as provided by the request
		const now = Date.now();
		const timestampInt = parseInt(timestamp, 10);
		const timeDifference = Math.abs(now - timestampInt);

		if (timeDifference > timestampSkew) {
			const message = `Timestamp is outside the allowed ${ timestampSkew }s skew.`;
			const data = JSON.stringify( { now, timestampInt, timeDifference }  );

			throw new NodeApiError(this.getNode(), {
				message: message + ' ' + data,
				description: message,
				httpCode: 403,
			});
		}

		// Compute expected HMAC of the body using the shared secret
		const hmac = createHmac('sha256', secretKey);
		hmac.update(JSON.stringify(request.body));
		const expectedSignature = hmac.digest('hex');

		// Compare signatures to ensure payload integrity and authenticity
		if (signature !== expectedSignature) {
			const message = `Invalid signature.`;

			throw new NodeApiError(this.getNode(), {
				message: message + ' ' + JSON.stringify({ signature, expectedSignature }),
				description: message,
				httpCode: 403,
			});
		}

		// If a user wants raw output, emit the raw body and headers
		if (outputSchema === 'raw') {
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

		// Default: emit parsed JSON items for downstream nodes
		return {
			workflowData: [this.helpers.returnJsonArray(request.body as IDataObject[])],
		};
	}
}
