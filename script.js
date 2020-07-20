const targetNode = document.body;

const ATTACHMENTS_SELECTOR = `[data-testid="attachments"]`;
const UNLABBELED_MEDIA_GROUP_SELECTOR = `[role="group"][aria-label="Media"]`;
const DISABLED_CLASS_NAME = `disable-tweet-for-missing-alt-text`;
const TWEET_BUTTON_SELECTOR = `[data-testid^=tweetButton]`;

const GIPHY_URL = new RegExp(`/http(s?):\/\/media([0-9]+).giphy.com\/media\/`);

let initialTweetButtonText = null;

function findTextNode(node) {
  let child = node.firstChild;
  while (child.nodeType !== document.TEXT_NODE && child != null) {
    child = child.firstChild;
  }
  return child;
}

function writeTextToButtonNode(node, text) {
  let textNode = findTextNode(node);
  if (initialTweetButtonText === null) {
    initialTweetButtonText = textNode.textContent;
  }
  textNode.textContent = text;
}

const style = document.createElement("style");
style.innerText = `
  .${DISABLED_CLASS_NAME} {
      background-color: red;
      pointer-events: none;
  }
`;
document.head.appendChild(style);

let isReportingMissingLabels = false;

// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
  let hasMissingLabels = false;
  try {
    // Check if the attachments section is rendered anywhere
    const attachmentSections = document.querySelectorAll(ATTACHMENTS_SELECTOR);
    if (attachmentSections.length === 0) {
      // No attachments, do nothing
      return;
    }

    attachmentSections.forEach((attachmentSection) => {
      const unlabelledGroup = attachmentSection.querySelector(
        UNLABBELED_MEDIA_GROUP_SELECTOR
      );
      if (unlabelledGroup == null) {
        return;
      }
      // Check if this group contains a image.
      const img = unlabelledGroup.querySelector("img");
      if (img == null) {
        return;
      }
      // Ignore images coming from giphy
      if (GIPHY_URL.test(img.src)) {
        return;
      }
      // We have a user uploaded image with no label! report it
      hasMissingLabels = true;
    });
  } finally {
    if (hasMissingLabels && !isReportingMissingLabels) {
      const tweetButton = targetNode.querySelector(TWEET_BUTTON_SELECTOR);
      if (tweetButton != null) {
        writeTextToButtonNode(tweetButton, "Add Alt Text");
        if (!tweetButton.classList.contains(DISABLED_CLASS_NAME)) {
          tweetButton.classList.add(DISABLED_CLASS_NAME);
        }
        isReportingMissingLabels = true;
      }
      // Report the missing labels
    } else if (!hasMissingLabels && isReportingMissingLabels) {
      const tweetButton = targetNode.querySelector(TWEET_BUTTON_SELECTOR);
      writeTextToButtonNode(tweetButton, initialTweetButtonText || "Tweet");
      isReportingMissingLabels = false;
      tweetButton.classList.remove(DISABLED_CLASS_NAME);
      // Clear the now fixed
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

observer.observe(targetNode, { subtree: true, childList: true });
