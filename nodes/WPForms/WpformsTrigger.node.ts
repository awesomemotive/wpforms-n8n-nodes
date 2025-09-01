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

export class WpformsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WPForms Trigger',
		name: 'wpformsTrigger',
		icon: 'file:wpforms.svg',
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
				hint: `Default: Emits 1 item per submission with properties: <code>form</code>, <code>entry</code>, <code>fields</code>, <code>files</code>, <code>meta</code>.<br>
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

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const secretKey = this.getNodeParameter('scrKey') as string;
		const timestampSkew = this.getNodeParameter('timestampSkew') as number;
		const outputSchema = this.getNodeParameter('outputSchema') as string;

		const signature = req.headers['x-wpforms-signature'] as string;
		const timestamp = req.headers['x-wpforms-timestamp'] as string;

		if (!signature || !timestamp) {
			throw new NodeApiError(this.getNode(), { message: 'Missing signature or timestamp headers' });
		}

		const now = Math.floor(Date.now() / 1000);
		const timeDifference = Math.abs(now - parseInt(timestamp, 10));

		if (timeDifference > timestampSkew) {
			throw new NodeApiError(this.getNode(), { message: 'Timestamp is outside the allowed skew' });
		}

		const hmac = createHmac('sha256', secretKey);
		hmac.update(JSON.stringify(req.body));
		const expectedSignature = `sha256=${hmac.digest('hex')}`;

		if (signature !== expectedSignature) {
			throw new NodeApiError(this.getNode(), { message: 'Invalid signature' });
		}

		if (outputSchema === 'raw') {
			return {
				workflowData: [
					[
						{
							json: {
								body: req.body,
								headers: req.headers,
							},
						},
					],
				],
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject[])],
		};
	}
}
