# Changelog

All notable changes to the `n8n-nodes-wpforms` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2026-07-20

### Fixed
- Fix timestamp skew validation comparing milliseconds against seconds threshold (#13).

## [0.1.4] - 2025-01-14

### Fixed
- Fix publishing and `npm run build` pipeline.
- Update GitHub Action to replace deprecated action.

### Changed
- Remove unused credential files and incorrect dependencies.
- Add `typeOptions: { password: true }` to the secret key field.
- Update UTM links to WPForms n8n documentation.

## [0.1.3] - 2024-09-17

### Added
- Introduce auto-publishing to npm via GitHub Actions on tag push.

### Changed
- Update links to WPForms n8n documentation.

## [0.1.2] - 2024-06-12

### Fixed
- Fix community node install error (#7).
- Fix eslint issues.

### Security
- Bump pg-promise and n8n-core.
- Bump mysql2 and n8n-core.

## [0.1.1] - 2024-02-20

### Fixed
- Fix node install error.
- Include missing n8n packages.

## [0.1.0] - 2024-02-15

### Added
- Initial release of WPForms Trigger node for n8n.
- Webhook-based trigger that fires on WPForms form submissions.
- HMAC-SHA256 signature validation with configurable secret key.
- Configurable timestamp skew tolerance (default 300 seconds).
- Two output modes: Default (structured JSON) and Raw (raw request body/headers).

[Unreleased]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/awesomemotive/wpforms-n8n-nodes/releases/tag/v0.1.0
