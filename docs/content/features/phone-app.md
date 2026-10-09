+++
disableToc = false
title = "Using LocalAI on a phone"
weight = 95
url = '/features/phone-app'
+++

On a phone (any screen narrower than 640px) the web UI is laid out like an iPhone app rather than a shrunk desktop page. It works the same in Safari, Chrome and any other mobile browser, and needs no install. Add it to your home screen from the browser's share menu for a full-screen app.

Desktop and tablet keep their sidebar layout. Home uses one entry per resource, and Studio's model-installation links select the matching gallery filter on every screen size.

## Navigation

- **Tab bar.** Home, Chat, Studio, Models (administrators only) and More sit at the bottom of the screen, within thumb reach.
- **More.** Preferences stay near the top. **Build** and **Operate** open expandable sections containing the same pages and access rules as the desktop sidebar. One section is open at a time, so advanced controls do not crowd the initial menu. More remembers the open section for the rest of the browser tab's session, so Back from a page such as Traces returns to the same list. **Search** finds pages, preferences, account actions and About information even when their section is closed; searching a section name shows its matching rows directly. **About** contains instance details and documentation. Talk remains on Home and can also be found through Search.
- **Large titles and Back.** Each page opens with a large title. When you scroll, the title moves into the navigation bar. A page opened from a tab has a Back button labelled with the screen you came from. A page opened directly by its address goes back to its tab.

Pages you open from More, such as Traces or Settings, show their content straight away. On a desktop or tablet these pages keep the section rail for switching between them; on a phone you go back to More instead.

## Screens

- **Home** shows live status, New chat, Talk and (for administrators) Manage by chat, followed by the running models and their Stop controls. Creation tools live in Studio; gallery, installation and import actions live in Models. Home does not repeat those menus or the desktop API introduction.
- **Chat** opens as its own screen: Back on the left, the conversation title above a compact model picker, and Chats and settings on the right. Your messages appear in bubbles; assistant replies use the full reading width. Copy is always visible, with Edit beside your messages and a message-actions sheet for editing, regenerating or branching replies. New conversations show grouped prompt starters and recent chats.
- **Chats** opens a searchable sheet. Start a new conversation or select an existing one; each row's action button reveals Rename, Duplicate, Copy, Export and Delete when available.
- **Chat settings** uses the same grouped sheets as the rest of the phone app. System prompt and model details come first; **Generation settings** expands temperature, Top P, Top K and context size. Token counts and context usage live here, leaving the conversation free of repeated status strips. Manage mode and model configuration remain administrator-only. Clearing chat history asks for confirmation.
- **Studio** is the home for creation tools (images, video, 3D, speech, sound and audio transform). A ready tool opens its generator; for administrators, **Get** opens Models with that tool's use-case filter already selected. Other users see model availability without an installation link to administrator-only screens. Old `?capability=` links also work. The filter is saved in the URL, so reload and browser history retain the selected use cases.
- **Models** uses a segmented control for Explore and Installed, and for the gallery or a [Hugging Face search]({{%relref "features/model-gallery#searching-hugging-face-from-the-web-ui" %}}). A model opens as a details page with its size and fit summarised under the name.
- **Pickers** (model, backend and other searchable lists) open as a modal sheet from the bottom of the screen. Tap **Cancel**, the dimmed background, or press Escape to dismiss without changing the selection. The background cannot scroll while the sheet is open, keyboard focus stays inside it, and closing returns focus to the original control. Search is not automatically focused, so opening a picker does not immediately raise the phone keyboard. The sheet follows the visible viewport when the keyboard opens.

## Controls and text

- **Page actions** (for example New job, Import, Create agent) sit in one row of rounded buttons under the title, with the main action first and filled.
- **On/off options** appear as iOS switches, filters such as Fits in GPU as rows in a settings group, and short tab rows as segmented controls.
- **Lists** (agents, usage, jobs and similar) appear as a grouped list with one row per item.
- **Text** follows the iOS sizes: 17px body, 15px secondary text and 13px captions. Only tab bar labels and status badges are smaller.
- **Talk** keeps its Connect button docked above the tab bar, so it stays in reach while you scroll through the options.
- **Chat composer** gives the message field its own full-width row, with **+** and Send below it. The conversation follows the visible viewport to keep the composer above the on-screen keyboard. Tap **+** for the Attach file, Canvas and MCP sheet. MCP opens a separate sheet so its controls remain visible above the composer. Closing each sheet returns focus to its trigger. A dot on **+** and a short status show when Canvas, an MCP server or an MCP resource is enabled. Composer controls, message actions and the model picker have at least a 44px touch target.

## Themes

The phone layout follows the light or dark theme you choose, from **More → Dark mode** or the theme button on the desktop.
