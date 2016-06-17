# s(election)link

slink allows you to link to a selected segment of a Web page.

```put image here```


## How it works

 1. User selects a portion of a Web page.
 2. slink client polls `window.getSelection()` and detects an updated Selection 
    object.
 3. slink client generates XPath-based specifiers for the selection start and 
    end.
 4. User right-clicks to generate a slink.
 5. slink client sends document.location and selection co-ordinates to slink 
    server.
 6. slink server caches Web page with highlights embedded, generates link, and 
    returns it to client.
 7. slink client displays link for user.


## Frontend architecture
 1. pollSelection() - The Web Selection API is not fully implemented yet, so it 
    is necessary to poll `window.getSelection()` and scan for changes in the 
    Selection object.
 2. selectionToPointers(selection) - Generates XPath-based specifiers for the 
    start and end of a selection.
 3. requestSlink(location, pointers) - Sends the location and pointers to the 
    API server and retrieves a slink.


## Backend architecture

For scalability, the backend can be split into three components:
 1. API server - Public. Exposes endpoints for creating and retrieving slinks.
 2. Retrieval server - Private. Retrieves user's link and annotates with 
    selection.
 3. Storage server - Private. Holds slink IDs mapped to cached pages.
