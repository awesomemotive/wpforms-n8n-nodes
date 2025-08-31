# n8n WPForms Trigger Node Implementation Summary

This document summarizes the final implementation of the WPForms trigger node for n8n.

## 1. Node Properties

The trigger node has the following properties:

- **Secret Key**: A required string to verify the HMAC-SHA256 signature of the request.
- **Timestamp Skew**: An optional number (default: 300s) for the allowed time difference.
- **Output Schema**: An optional dropdown ('Default' or 'Raw') to control the output format.

## 2. Webhook Verification

The node's webhook performs the following checks on incoming POST requests:

- Verifies the presence of `X-WPForms-Signature` and `X-WPForms-Timestamp` headers.
- Validates the timestamp against the configured skew.
- Validates the HMAC-SHA256 signature using the provided `Secret Key`.

## 3. Output

- **Default**: Outputs a structured JSON object of the form submission data.
- **Raw**: Outputs the raw request body and headers.

## 4. Manual Testing Guide

1.  **Build the node:** Run `npm run build`.
2.  **Install the node:** Follow the instructions in the `README.md`.
3.  **Create a test workflow:**
    *   Add the WPForms Trigger node and configure its properties.
    *   Copy the webhook URL.
4.  **Configure WPForms:**
    *   In your WordPress site, paste the webhook URL and the secret key into the WPForms n8n addon settings for a specific form.
5.  **Test the trigger:**
    *   Submit the form.
    *   Check the n8n workflow to verify the trigger received the data correctly.
