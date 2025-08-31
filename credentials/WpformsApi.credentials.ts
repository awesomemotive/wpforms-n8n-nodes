import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WpformsApi implements ICredentialType {
	name = 'wpformsApi';
	displayName = 'WPForms API';
	documentationUrl = 'https://wpforms.com/docs/how-to-set-up-and-use-the-rest-api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Site URL',
			name: 'siteUrl',
			type: 'string',
			default: '',
			placeholder: 'https://my-wordpress-site.com',
			description: 'The URL of your WordPress site where WPForms is installed',
		},
		{
			displayName: 'Consumer Key',
			name: 'consumerKey',
			type: 'string', // eslint-disable-line
			default: '',
		},
		{
			displayName: 'Consumer Secret',
			name: 'consumerSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				consumer_key: '={{$credentials.consumerKey}}',
				consumer_secret: '={{$credentials.consumerSecret}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.siteUrl}}',
			url: '/wp-json/',
		},
	};
}
