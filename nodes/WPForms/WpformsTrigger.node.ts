import { randomBytes } from 'crypto';
import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';
import { validateRequest } from './validation';
import helpers from './helpers';

/**
 * WPForms Trigger node.
 *
 * @since 1.0
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
				hint: `Default: Emits 1 item with properties: <code>form, entry, fields, files, meta</code>.<br>
					Raw: Emits 1 item with properties: <code>body, headers</code>. <a href="https://wpforms.com/docs/n8n/">Read more</a>`,
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
	 * @since 1.0
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

		// Validate request headers, timestamp skew, and signature
		try {
			validateRequest(request, secretKey, timestampSkew);
		} catch (err: any) {
			return helpers.getErrorOutput(err, this);
		}

		// If a user wants raw output, emit the raw body and headers
		if (outputSchema === 'raw') {
			return helpers.getRawOutput(request);
		}

		// Default: emit parsed JSON items for downstream nodes via helpers
		return helpers.getOutput(request, this);
	}
}
