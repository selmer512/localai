+++
disableToc = false
title = "Using LocalAI on a phone"
weight = 95
url = '/features/phone-app'
+++

On a phone (any screen narrower than 640px) the web UI is laid out like an iPhone app rather than a shrunk desktop page. It works the same in Safari, Chrome and any other mobile browser, and needs no install. Add it to your home screen from the browser's share menu for a full-screen app.

Desktop and tablet layouts are unchanged.

## Navigation

- **Tab bar.** Home, Chat, Studio, Models (administrators only) and More sit at the bottom of the screen, within thumb reach.
- **More.** Use **Search** to filter everything on the screen by its translated name: pages, preferences such as dark mode and language, your account and sign out, and the About links. Type a section name, such as Operate or About, to see every row in that section. Clear the search to restore the full menu. Preferences (dark mode and language) sit near the top, before the navigation groups. More lists every other page, grouped as on the desktop sidebar: Talk, the Build pages (agents, skills, memory, jobs, fine-tuning, quantization, face and voice recognition) and the Operate pages (overview, backends, activity, usage, traces, nodes, settings and the rest). It also holds your account and sign out. A page appears here under the same access rules as on the desktop sidebar, including while searching.
- **Large titles and Back.** Each page opens with a large title. When you scroll, the title moves into the navigation bar. A page opened from a tab has a Back button labelled with the screen you came from. A page opened directly by its address goes back to its tab.

Pages you open from More, such as Traces or Settings, show their content straight away. On a desktop or tablet these pages keep the section rail for switching between them; on a phone you go back to More instead.

## Screens

- **Home** shows how many models are loaded and how much memory is in use, then New chat, Talk and (for administrators) Manage by chat, a grid of creation tools, and the models running now with a Stop button on each.
- **Chat** opens as its own screen: Back on the left, the model name as the title (tap it to switch model), and the chat list and chat settings on the right. Messages appear as bubbles.
- **Studio** lists each generator (images, video, 3D, speech, sound, audio transform) with the model that serves it, or a **Get** button that opens the gallery when none is installed. Each generator opens as its own screen.
- **Models** uses a segmented control for Explore and Installed, and for the gallery or a [Hugging Face search]({{%relref "features/model-gallery#searching-hugging-face-from-the-web-ui" %}}). A model opens as a details page with its size and fit summarised under the name.
- **Pickers** (model, backend and other searchable lists) open as a modal sheet from the bottom of the screen. Tap **Cancel**, the dimmed background, or press Escape to dismiss without changing the selection. The background cannot scroll while the sheet is open, keyboard focus stays inside it, and closing returns focus to the original control. Search is not automatically focused, so opening a picker does not immediately raise the phone keyboard. The sheet follows the visible viewport when the keyboard opens.

## Controls and text

- **Page actions** (for example New job, Import, Create agent) sit in one row of rounded buttons under the title, with the main action first and filled.
- **On/off options** appear as iOS switches, filters such as Fits in GPU as rows in a settings group, and short tab rows as segmented controls.
- **Lists** (agents, usage, jobs and similar) appear as a grouped list with one row per item.
- **Text** follows the iOS sizes: 17px body, 15px secondary text and 13px captions. Only tab bar labels and status badges are smaller.
- **Talk** keeps its Connect button docked above the tab bar, so it stays in reach while you scroll through the options.
- **Chat composer** is one row, as in Messages: **+**, the message field and send. Tap **+** to open a tray above the field with Attach file, Canvas and MCP; tapping into the field closes it. While the tray is closed, a dot on **+** shows that Canvas or an MCP server is on. Every composer control and the model title has at least a 44px touch target. The model title shows a visible focus outline for keyboard navigation.

## Themes

The phone layout follows the light or dark theme you choose, from **More → Dark mode** or the theme button on the desktop.
