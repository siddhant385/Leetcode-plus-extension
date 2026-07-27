// src/features/companyTags/ProblemTagsModifier.ts
import elementReady, { observeReadyElements } from "element-ready";
import { $ as select } from "select-dom";

export class ProblemTagsElementModifier {
  private autoFetchCallback: ((container: HTMLElement) => void) | null = null;

  async modifyCompaniesTagButton() {
    // 1. Wait for the fresh bottom container (that has not been modified yet)
    const companySpan = await elementReady(
      ".group:not([data-lc-modified]) .premium-text-yellow-gradinet",
      { stopOnDomReady: false },
    );
    if (!companySpan) return;

    const tagButton = companySpan.closest(".group") as HTMLElement;
    if (!tagButton) return;

    // 2. Mark it instantly so duplicate clicks are prevented upon navigation
    tagButton.setAttribute("data-lc-modified", "true");

    // 🚀 3. THE MASTER FIX FOR FIRST & SECOND LOCK 🚀
    // Find all "Companies" labels on the page and remove the locks

    // for await (const element of observeReadyElements(
    //   ".premium-text-yellow-gradinet",
    // )) {
    //   const parent = element.parentElement;
    //   if (parent) {
    //     const lock = parent.querySelector(
    //       'img[alt="icon"], img[alt="premium lock icon"]',
    //     );
    //     if (lock) (lock as HTMLElement).style.display = "none";
    //     parent.style.backgroundColor = "rgba(44,187,93,0.15)";
    //     element.classList.remove("premium-text-yellow-gradinet");
    //     (element as HTMLElement).style.color = "#2cbb5d";
    //     (element as HTMLElement).style.fontWeight = "500";
    //   }
    // }

    const allSpans = document.querySelectorAll(".premium-text-yellow-gradinet");

    allSpans.forEach((span) => {
      const parent = span.parentElement;
      if (parent) {
        // Remove the lock (from both top and bottom)
        const lock = parent.querySelector(
          'img[alt="icon"], img[alt="premium lock icon"]',
        );
        if (lock) (lock as HTMLElement).style.display = "none";

        // If this is the TOP pill (it lacks the .group class)
        if (!span.closest(".group")) {
          // Give the parent pill the LeetCode success green background
          parent.style.backgroundColor = "rgba(44, 187, 93, 0.15)";

          // Remove yellow gradient class so the text does not appear yellow
        }
        span.classList.remove("premium-text-yellow-gradinet");

        // Make the text solid green for a native feel
        (span as HTMLElement).style.color = "#2cbb5d";
        (span as HTMLElement).style.fontWeight = "500";
      }
    });
    // 4. Bottom accordion logic
    const expandableWrapper = tagButton.nextElementSibling as HTMLElement;
    const tagsContainer = select(".pl-7", expandableWrapper) as HTMLElement;

    if (!expandableWrapper || !tagsContainer) return;

    // Set height auto by default (Expand the accordion)
    let isExpanded = false;
    expandableWrapper.style.setProperty("height", "auto", "important");

    // Trigger data fetch silently (without click)
    if (this.autoFetchCallback) {
      this.autoFetchCallback(tagsContainer);
    }

    // Capture Phase click listener to block React premium popup
    tagButton.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = !isExpanded;
        expandableWrapper.style.setProperty(
          "height",
          isExpanded ? "auto" : "0px",
          "important",
        );
      },
      true, // 🔥 Required to intercept and stop React events
    );
  }

  addTagButtonOnClickListener(func: (container: HTMLElement) => void) {
    this.autoFetchCallback = func;
  }
}
