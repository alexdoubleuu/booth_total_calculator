// ==UserScript==
// @name         Booth Purchase History Grabber
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extracts all links from the main section of the BOOTH purchase history page
// @author       FigaroMajiKawai
// @match        https://accounts.booth.pm/orders*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create a button to initiate the extraction
    const button = document.createElement('button');
    button.textContent = 'Get Total JPY: 0';
    button.style.position = 'absolute';
    button.style.bottom = '20px';
    button.style.left = '20px';
    button.style.padding = '10px 15px';
    button.style.backgroundColor = '#1b7f8c';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        // Start the recursive extraction
        extractJPYValues(window.location.href, 0);
    });

    async function extractJPYValues(url, totalJPY) {
        // Fetch the current page
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const mainContent = doc.querySelector('main');
        const links = mainContent.getElementsByTagName('a');
        const extractedLinks = [];

        // Loop through the links and extract order hrefs
        for (let link of links) {
            if (link.href) {
                if (link.closest('.pager') || link.href.includes('/library')) {
                    continue;  // Skip excluded links
                }
                extractedLinks.push(link.href);
            }
        }

        // Process order links
        for (const orderLink of extractedLinks) {
            const newTab = window.open(orderLink, '_blank');
            newTab.blur(); // Send focus back to the original tab
            window.focus(); // Ensure the original tab is focused

            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust the timeout as needed

            const orderDocument = newTab.document;

            // Extract the last child of the specified div
            const titleDiv = orderDocument.querySelector('.l-row.u-tpg-title4');
            if (titleDiv) {
                const jpyValueElement = titleDiv.lastElementChild; // Get the last child
                if (jpyValueElement) {
                    const jpyValueText = jpyValueElement.textContent.trim();
                    const jpyValueNumber = parseInt(jpyValueText.replace(/[^\d]/g, '')); // Parse to number
                    totalJPY += jpyValueNumber; // Sum the JPY value

                    // Update the button text with the current total
                    button.textContent = `Get Total JPY: ${totalJPY}`;
                }
            }

            // Close the tab
            newTab.close();
        }

        // Log the subtotal for the current page
        console.log('Current Subtotal JPY:', totalJPY);

        // Check for the next page
        const nextPageLink = mainContent.querySelector('a[rel="next"]');
        if (nextPageLink) {
            const nextUrl = nextPageLink.href; // Get the next page URL
            // Recursively call the function for the next page
            await extractJPYValues(nextUrl, totalJPY);
        } else {
            // Log the final total to the console
            console.log('Final Total JPY:', totalJPY);
            button.textContent = `Get Total JPY: ${totalJPY}`; // Update button text for final total
        }
    }
})();
