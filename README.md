# Conversation Accessibility for ChatGPT

**Version 1.0.1** — A free, independent Chrome extension that keeps previously loaded ChatGPT conversation messages in the DOM, improving accessibility for blind and visually impaired screen reader users.

[Türkçe dokümantasyon](README.tr.md)

## Why this extension exists

ChatGPT uses DOM virtualization to improve performance in long conversations. When a message moves outside the rendered window, it may disappear from the DOM and consequently from a screen reader's virtual buffer. This makes navigating and copying long conversations difficult.

This extension changes the recognized rendering window so that previously loaded messages remain available while scrolling. It preserves the original scrolling and measurement mechanisms and does not rely on a particular JavaScript filename.

## Installation

Requires Google Chrome 118 or later.

1. [Download the source ZIP](https://github.com/dogancankalinci/conversation-accessibility-for-chatgpt/archive/refs/heads/main.zip) and extract it into a dedicated folder.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked**, then select the extracted folder containing `manifest.json`.
5. Reload ChatGPT. If necessary, use **Enable and reload page** in the extension popup.
6. NVDA users may need to press NVDA+F5 to refresh the virtual buffer.

Keep the extracted folder. Do not run multiple versions of the extension at the same time.

## Reading and copying complete conversations

Disabling virtualization is not the same as disabling lazy loading. The extension does not automatically fetch the entire conversation when you first open it. Initially, only recent messages may be loaded, so pressing Ctrl+A and copying immediately may not include the entire conversation.

Scroll upward until you reach the beginning of the conversation, allowing older messages to load. Once loaded, they should remain in the DOM as you scroll back down. Ctrl+A can then include the full loaded conversation, along with other selectable page content.

Without the extension, scrolling upward can remove newer messages from the DOM, and scrolling downward can remove older messages. The extension prevents that virtualization behavior for recognized code, not the initial on-demand loading of history.

For comparison, disabling Claude.ai's built-in virtualization setting has shown the same lazy-loading behavior: older messages are not all loaded immediately, and Ctrl+A immediately after opening a conversation may not select every message. This comparison reflects observed behavior, not a guarantee about future Claude.ai versions.

## Permissions and privacy

The extension attaches to ChatGPT tabs and uses the Chrome debugger API to intercept JavaScript responses from `https://chatgpt.com/cdn/assets/` and modify the recognized virtualization code locally. Chrome may display a debugging notification; this is expected.

- The debugger permission is broad, but the extension is designed to inspect only the relevant JavaScript responses.
- It does not intentionally inspect conversation API responses, cookies or credentials.
- It does not transmit data to external servers.
- Preferences and per-tab operational state are stored locally in Chrome local and session extension storage.
- Caching is disabled while the debugger is attached.

## Limitations

- Future changes to ChatGPT's implementation may require an extension update. Unrecognized JavaScript structures are left unchanged.
- Retaining many messages can increase memory and CPU usage.
- The extension does not increase the model's context window, prevent server-side summarization, or remove conversation length limits.
- Compatibility with every browser and screen reader has not been independently verified.

## Feedback

Please report issues or suggestions through [GitHub Issues](https://github.com/dogancankalinci/conversation-accessibility-for-chatgpt/issues). Include your browser and screen reader versions, but do not share credentials, private conversations or sensitive HAR files.

## License

[MIT License](LICENSE). This is an independent project and is not affiliated with OpenAI, Google or NV Access.
