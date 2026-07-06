declare global {
  var $boldChat: any;
  var boldChatSettings: {
    email?: string;
    userToken?: string;
    isConversationVerified?: boolean;
    isSessionVerified?: boolean;
  };
}

/** Optional configuration for the live chat widget. */
interface Options {
  /** The locale code (e.g., 'en-US', 'fr') used to load a localized version of the widget script.*/
  locale?: string;
  /** The user's email address that will be automatically pre-configured in the chat widget, eliminating the need for manual entry. */
  email?: string;
  /** The user's userToken that will be automatically pre-configured in the chat widget, useful when performing conversation or session verification */
  userToken?: string;
}

class LiveChat {
  private widgetScriptUrl: string = '';
  /** Flag to track whether the chat widget script has already been injected into the DOM to prevent duplicate loading. */
  private isScriptInjected: boolean = false;

  /**
   * Configures the live chat widget URL using the given widget and brand IDs and an optional locale.
   * @param widgetId - The unique ID of the chat widget.
   * @param brandUrl - The base URL of the brand where the widget script is hosted.
   * @param option - An optional object that can include additional configuration settings for the live chat widget.
   * @throws Will throw an error if widgetID or brandUrl is not provided.
   */
  public configure(widgetId: string, brandUrl: string, options: Options = {}): void {
    this.initializeChatData();
    if (!widgetId || !brandUrl) {
      throw new Error(" Website ID and Brand ID should be set to configure bold chat")
    }

    // Set email in boldChatSettings if provided
    if (options.email?.trim()) {
      window.boldChatSettings = window.boldChatSettings || {};
      window.boldChatSettings.email = options.email;
    }

    // Set userToken in boldChatSettings if provided
    if (options.userToken?.trim()) {
      window.boldChatSettings = window.boldChatSettings || {};
      window.boldChatSettings.email = options.userToken;
    }

    this.widgetScriptUrl = `${brandUrl}/chatwidget-api/widget/v1/${widgetId}${options.locale ? `?culture=${options.locale}` : ''}`;
    this.load();
  }

  /**
   * Injects the chat widget script into the document head. Defers to deferredLoading if head is unavailable.
   */
  private load(): void {
    // Prevents the live chat widget from being rendered multiple times.
    if (this.isScriptInjected) {
      return;
    }

    const head = document.getElementsByTagName("head");
    if (!head || !head[0]) {
      this.deferredLoading();
      return;
    }
    const script = document.createElement("script");
    script.src = this.widgetScriptUrl;
    script.async = true;
    head[0].appendChild(script);
    this.isScriptInjected = true;
  }

  /** Ensures that the global $boldChat array is initialized. */
  private initializeChatData(): void {
    window.$boldChat = window.$boldChat || [];
  }

  /**
   * Sets up a once-triggered event listener to load the chat widget script when the DOM is ready.
   */
  private deferredLoading(): void {
    document.addEventListener("DOMContentLoaded", () => {
      this.load();
    }, { once: true });
  }

  /** Opens the chat widget popup. */
  public openWidget(): void {
    this.initializeChatData();
    window.$boldChat.push(["do:setIsOpen", true]);
  }

  /** Close the chat widget popup */
  public closeWidget(): void {
    this.initializeChatData();
    window.$boldChat.push(["do:setIsOpen", false]);
  }

  /** Makes the chat widget visible. */
  public showWidget(): void {
    this.initializeChatData();
    window.$boldChat.push(["do:setIsVisible", true]);
  }

  /** Hides the chat widget. */
  public hideWidget(): void {
    this.initializeChatData();
    window.$boldChat.push(["do:setIsVisible", false]);
  }

  /** Enables the message input field for the user. */
  public showMsgInput(): void {
    this.initializeChatData();
    window.$boldChat.push(["set:canSend", true]);
  }

  /** Disables the message input field for the user. */
  public hideMsgInput(): void {
    this.initializeChatData();
    window.$boldChat.push(["set:canSend", false]);
  }

  /** Clears the current chat conversation/session. */
  public clearConversation(): void {
    this.initializeChatData();
    window.$boldChat.push(["do:clearSession"]);
  }

  /**
   * Adds a custom option (menu item) to the to the more options menu which opens when the user clicks the three dots in the chat widget header.
   * @param option - The option name or identifier to be added to the widget.
   */
  public addMoreOptions(option: string): void {
    this.initializeChatData();
    window.$boldChat.push(["do:addOption", option]);
  }

  /**
   * Registers a callback to validate user email in the chat widget before conversation is started.
   * This method is triggered when a user starts a chat—either after entering their email (in email-required widgets) or after user sends their 1st message (in widgets with a pre-configured email).
   * @param callback - A function that receives an array of form fields:
   *                   - `apiName`: the unique identifier for the form field.
   *                   - `value`: the input provided by the user.
   *                   This callback function should return an object with:
   *                   - `isValid`: indicates whether the conversation can be started (true if valid).
   *                   - `confirmationMessage` (optional): The message to be displayed to the user after validation, regardless of validity.
   */
  public onValidateForm(callback: (formData: { apiName: string, value: string }[]) => { isValid: boolean, confirmationMessage?: string } | Promise<{ isValid: boolean; confirmationMessage?: string }>): void {
    this.initializeChatData();
    window.$boldChat.push(["on:validateForm", callback]);
  }

  /**
   * Registers a callback triggered when a custom option is clicked in the chat widget.
   * This allows you to perform custom logic when a visitor clicks a predefined or dynamically added option. For instance, you can use this to trigger workflows like opening a knowledge base, starting a feedback form, etc.
   * @param callback - A callback function that takes an event object with:
   *                   - `name`: the identifier of the clicked option.
   */
  public onMoreOptionClick(callback: (event: { name: string }) => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:moreOptionClick", callback]);
  }

/** Navigates the chat widget to a specific section.
 * @param section - The section identifier to open (e.g., 'home', 'chat', 'help').
 */
  public openSection(section: string): void {
    this.initializeChatData();
    window.$boldChat.push(["do:openSection", section]);
  }

  /**
   * Verifies the current conversation by validating the user's identity with the backend.
   * @param options - An object containing:
   *                  - `email` (optional): The user's email address.
   *                  - `userToken` (optional): A token used to verify the user.
   *                  - `callback`: A function invoked with the verification result:
   *                    - `isVerified`: Whether verification was successful.
   *                    - `message`: A status or error message from the server.
   */
  public verifyConversation(options: { email?: string, userToken?: string, callback: (response: { isVerified: boolean, message: string }) => void }): void {
    this.initializeChatData();
    window.$boldChat.push(["do:verifyConversation", options]);
  }

  /**
   * Verifies the current session by validating the user's identity with the backend.
   * @param options - An object containing:
   *                  - `email` (optional): The user's email address.
   *                  - `userToken` (optional): A token used to verify the session.
   *                  - `callback`: A function invoked with the verification result:
   *                    - `isVerified`: Whether verification was successful.
   *                    - `message`: A status or error message from the server.
   */
  public sessionVerification(options: { email?: string, userToken?: string, callback: (response: { isVerified: boolean, message: string }) => void }): void {
    this.initializeChatData();
    window.$boldChat.push(["do:sessionVerification", options]);
  }

  /**
   * Registers a callback to validate the user's email before it is submitted in the chat widget.
   * This is triggered when the user enters and submits their email in the pre-chat form.
   * @param callback - A function that receives the submitted email string and returns:
   *                   - `isValid`: Whether the email should be accepted.
   *                   - `confirmationMessage` (optional): A message to show the user after validation.
   *                   Can return a plain object or a Promise for async validation.
   */
  public onBeforeEmailSubmit(callback: (email: string) => { isValid: boolean, confirmationMessage?: string } | Promise<{ isValid: boolean; confirmationMessage?: string }>): void {
    this.initializeChatData();
    window.$boldChat.push(["on:beforeEmailSubmit", callback]);
  }

  /**
   * Registers a callback triggered whenever the count of unread conversations changes.
   * @param callback - A function that receives the updated unread message count as a number.
   */
  public onUnreadConversationCountChanged(callback: (msgCount: number) => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:unreadConversationCountChanged", callback]);
  }

  /**
   * Registers a callback triggered when a new conversation is started.
   * @param callback - A function that receives the ID of the newly started conversation.
   */
  public onConversationStarted(callback: (conversationID: string) => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:conversationStarted", callback]);
  }

  /**
   * Registers a callback triggered when an ongoing conversation is closed.
   * @param callback - A function that receives the ID of the closed conversation.
   */
  public onConversationClosed(callback: (conversationID: string) => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:conversationClosed", callback]);
  }

  /**
   * Registers a callback triggered when the chat client successfully connects to the chat server.
   * @param callback - A function called with no arguments when the connection is established.
   */
  public onChatServerConnected(callback: () => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:chatServerConnected", callback]);
  }

  /**
   * Registers a callback triggered when the chat client disconnects from the chat server.
   * @param callback - A function called with no arguments when the connection is lost.
   */
  public onChatServerDisconnected(callback: () => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:chatServerDisconnected", callback]);
  }

  /**
   * Registers a callback triggered when the chat widget is opened by the user.
   * @param callback - A function called with no arguments when the widget opens.
   */
  public onWidgetOpened(callback: () => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:widgetOpened", callback]);
  }

  /**
   * Registers a callback triggered when the chat widget is closed by the user.
   * @param callback - A function called with no arguments when the widget closes.
   */
  public onWidgetClosed(callback: () => void): void {
    this.initializeChatData();
    window.$boldChat.push(["on:widgetClosed", callback]);
  }
}

const liveChat = new LiveChat();

export { liveChat as LiveChat, LiveChat as LiveChatClass };