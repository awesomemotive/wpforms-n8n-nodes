import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * WPForms API credentials.
 *
 * @since 1.0
 */
export class WpformsApi implements ICredentialType {
	name = 'wpformsApi';
	displayName = 'WPForms API';
	documentationUrl = 'https://wpforms.com/docs/n8n-addon/?utm_source=n8n&utm_medium=referral&utm_campaign=n8n_integration&utm_content=wpforms_trigger_docs&utm_locale=en_US';
	properties: INodeProperties[] = [
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The secret key used to verify webhook requests',
			hint: 'Copy the value from your WPForms n8n settings. <a href="https://wpforms.com/docs/n8n-addon/?utm_source=n8n&utm_medium=referral&utm_campaign=n8n_integration&utm_content=wpforms_trigger_docs&utm_locale=en_US" target="_blank">Read more</a>',
		},
	];
}
