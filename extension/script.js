"use strict";
const targetNode = document.body;
const ATTACHMENTS_SELECTOR = `[data-testid="attachments"]`;
const UNLABBELED_MEDIA_GROUP_SELECTOR = `[role="group"][aria-label="Media"]`;
const DISABLED_CLASS_NAME = `disable-tweet-for-missing-alt-text`;
const TWEET_BUTTON_SELECTOR = `[data-testid^=tweetButton]`;
const TWEET_TEXT_AREA_SELECTOR = `[data-testid^=tweetTextarea]`;
// TODO: we should try and do some i18n here. We can detect the client
// language and then ship a map of translations.
const DISABLED_BUTTON_TEXT = "Add Alt Text";
// CSS Selector to find any groups within Twitter's attachment interface.
// This will find *all* attachment types (images, GIFs, videos)
const ATTACHMENT_GROUP_SELECTOR = `[data-testid="attachments"] [role="group"]`;
// Find the first text node child for a given node. This is used to
// replace the text in the "Tweet" button.
function findTextNode(node) {
    let child = node;
    while (child != null && child.nodeType !== document.TEXT_NODE) {
        child = child.firstChild;
    }
    return child;
}
// Add some custom CSS to the page that we will apply to the "Tweet"
// button to signal that alt text needs to be added and prevent the user
// from submitting their Tweet.
const style = document.createElement("style");
style.innerText = `
  .${DISABLED_CLASS_NAME} {
      background-color: red;
      pointer-events: none;
  }
`;
document.head.appendChild(style);
let isReportingMissingLabels = false;
let tweetButton = null;
let tweetButtonClone = null;
function onKeyDown(event) {
    if (event.key === "Enter" && event.metaKey) {
        const tweetTextAreas = [
            ...document.querySelectorAll(TWEET_TEXT_AREA_SELECTOR),
        ];
        if (document.activeElement != null &&
            tweetTextAreas.indexOf(document.activeElement) !== -1) {
            event.stopImmediatePropagation();
        }
    }
}
// Called when we've identified that image attachments
// exist and they are missing required alt text. We want
// to replace the Tweet button with a version of it that
// signals to the user that they need to add alt text.
function reportMissingLabels() {
    var _a;
    tweetButton = targetNode.querySelector(TWEET_BUTTON_SELECTOR);
    if (tweetButton == null) {
        // If for some reason we can't find a Tweet button, do nothing
        return;
    }
    // Make a deep clone of the button. This is what we'll mutate.
    tweetButtonClone = tweetButton.cloneNode(true);
    // @ts-ignore we know this is an HTML element
    tweetButtonClone.classList.add(DISABLED_CLASS_NAME);
    // Find the text node in this button.
    const textNode = findTextNode(tweetButtonClone);
    // If we can't find the text node, just set the textContent on the
    // button itself.This will mess up the styles, but its better than doing
    // nothing.
    if (textNode == null) {
        tweetButtonClone.textContent = DISABLED_BUTTON_TEXT;
    }
    else {
        textNode.textContent = DISABLED_BUTTON_TEXT;
    }
    // Hide the real button
    tweetButton.style.display = "none";
    (_a = tweetButton.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(tweetButtonClone, tweetButton);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    isReportingMissingLabels = true;
}
function dismissMissingLabels() {
    var _a;
    // Unhide the real tweet button, remove our clone
    if (tweetButtonClone != null && tweetButton != null) {
        tweetButton.style.display = "";
        (_a = tweetButton.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(tweetButtonClone);
    }
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    tweetButton = null;
    tweetButtonClone = null;
    isReportingMissingLabels = false;
}
// Callback function to execute when mutations are observed
const callback = function () {
    var _a, _b;
    let hasMissingLabels = false;
    try {
        // Find any attachment groups
        const attachmentGroups = [
            ...targetNode.querySelectorAll(ATTACHMENT_GROUP_SELECTOR),
        ];
        // Do nothing if there are no groups on the page
        if (attachmentGroups.length === 0) {
            return;
        }
        // Check each group to see if it's a non-GIF image and whether
        // it already has alt text.
        for (let group of attachmentGroups) {
            const userImage = group.querySelector("img");
            if (userImage != null) {
                // Now we need to verify whether there is any alt-text.
                // Twitter doesn't add any unique identifiers to the DOM element
                // that renders the ALT token. As far as I tested, Twitter doesn't
                // translate the ALT token so this should work for all languages.
                if (!(((_a = group.textContent) === null || _a === void 0 ? void 0 : _a.includes("ALT")) || ((_b = group.textContent) === null || _b === void 0 ? void 0 : _b.includes("GIFALT")))) {
                    hasMissingLabels = true;
                    return;
                }
            }
        }
    }
    finally {
        if (hasMissingLabels && !isReportingMissingLabels) {
            reportMissingLabels();
        }
        else if (!hasMissingLabels && isReportingMissingLabels) {
            dismissMissingLabels();
        }
    }
};
// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
observer.observe(targetNode, { subtree: true, childList: true });
