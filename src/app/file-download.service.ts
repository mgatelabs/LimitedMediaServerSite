import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {

  constructor() { }

  postForFileDownload(url: string, postData: { [key: string]: any }) {
    // Create a form element
    const form = document.createElement('form');
    form.action = url;
    form.method = 'POST';
    form.style.display = 'none';
    
    // Set the target to open the download in the current window or new tab
    form.target = '_blank';

    // Add inputs based on postData
    for (const key in postData) {
      if (postData.hasOwnProperty(key)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = postData[key];
        form.appendChild(input);
      }
    }

    // Append the form to the body and submit it
    document.body.appendChild(form);
    form.submit();

    // Clean up by removing the form from the document
    document.body.removeChild(form);
  }
}
