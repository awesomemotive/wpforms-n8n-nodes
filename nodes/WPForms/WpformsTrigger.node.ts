import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
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
				responseMode: 'onReceived', // 'onReceived' sends a 200 OK response immediately
				path: 'webhook',
			},
		],
		properties: [
			// This node does not need any properties. 
			// The webhook URL is displayed on the node itself.
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		return {
			workflowData: [
				this.helpers.returnJsonArray(req.body)
			],
		};
	}
}
